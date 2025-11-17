-- Script para eliminar imágenes duplicadas de la base de datos
-- Ejecuta este script si ya tienes imágenes duplicadas

-- 1. Ver cuántas imágenes duplicadas hay
SELECT 
    url_imagen,
    id_ejecucion,
    COUNT(*) AS cantidad_duplicados
FROM imagenes_servicio
GROUP BY url_imagen, id_ejecucion
HAVING COUNT(*) > 1
ORDER BY cantidad_duplicados DESC;

-- 2. Eliminar duplicados, manteniendo solo el registro más reciente
-- (Esto elimina los registros duplicados, dejando solo uno por cada URL única por ejecución)
DELETE FROM imagenes_servicio
WHERE id_imagen IN (
    SELECT id_imagen
    FROM (
        SELECT 
            id_imagen,
            ROW_NUMBER() OVER (
                PARTITION BY url_imagen, id_ejecucion 
                ORDER BY fecha_subida DESC
            ) AS rn
        FROM imagenes_servicio
    ) t
    WHERE t.rn > 1
);

-- 3. Verificar que se eliminaron los duplicados
SELECT 
    'imagenes_servicio' AS fuente,
    COUNT(*) AS total_imagenes,
    COUNT(DISTINCT url_imagen) AS imagenes_unicas
FROM imagenes_servicio;

-- 4. Limpiar duplicados en ejecuciones_servicio.imagenes_urls (si existen)
-- Esto actualiza cada ejecución para tener solo URLs únicas
UPDATE ejecuciones_servicio
SET imagenes_urls = (
    SELECT jsonb_agg(DISTINCT elem)
    FROM jsonb_array_elements_text(imagenes_urls) AS elem
)
WHERE imagenes_urls IS NOT NULL
AND jsonb_array_length(imagenes_urls) > 0;

-- 5. Verificar resultados finales
SELECT 
    'imagenes_servicio' AS fuente,
    COUNT(*) AS total_imagenes
FROM imagenes_servicio
UNION ALL
SELECT 
    'ejecuciones_servicio.imagenes_urls' AS fuente,
    COUNT(*) AS total_imagenes
FROM ejecuciones_servicio
WHERE imagenes_urls IS NOT NULL 
AND jsonb_array_length(imagenes_urls) > 0;

