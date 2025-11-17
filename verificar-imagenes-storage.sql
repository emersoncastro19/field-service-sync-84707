-- Script para verificar si hay imágenes en Supabase Storage
-- Nota: Este script solo verifica la estructura de la BD
-- Para verificar Storage, ve a Supabase Dashboard → Storage → documentacion-servicios

-- 1. Verificar si hay ejecuciones con trabajo finalizado (donde deberían estar las imágenes)
SELECT 
    id_ejecucion,
    id_orden,
    fecha_inicio,
    fecha_fin,
    trabajo_realizado IS NOT NULL AS tiene_documentacion,
    CASE 
        WHEN imagenes_urls IS NOT NULL THEN jsonb_array_length(imagenes_urls)
        ELSE 0
    END AS cantidad_imagenes_json
FROM ejecuciones_servicio
WHERE fecha_fin IS NOT NULL
ORDER BY fecha_fin DESC
LIMIT 10;

-- 2. Verificar todas las ejecuciones (para ver cuáles tienen trabajo realizado)
SELECT 
    COUNT(*) AS total_ejecuciones,
    COUNT(CASE WHEN fecha_fin IS NOT NULL THEN 1 END) AS ejecuciones_finalizadas,
    COUNT(CASE WHEN trabajo_realizado IS NOT NULL AND trabajo_realizado != '' THEN 1 END) AS ejecuciones_con_documentacion,
    COUNT(CASE WHEN imagenes_urls IS NOT NULL AND jsonb_array_length(imagenes_urls) > 0 THEN 1 END) AS ejecuciones_con_imagenes_json
FROM ejecuciones_servicio;

-- 3. Verificar si hay registros en imagenes_servicio (aunque sean 0)
SELECT 
    COUNT(*) AS total_registros,
    COUNT(DISTINCT id_ejecucion) AS ejecuciones_con_imagenes,
    COUNT(DISTINCT id_orden) AS ordenes_con_imagenes
FROM imagenes_servicio;






