-- Script para verificar y crear la estructura necesaria para almacenar imágenes

-- 1. Verificar si existe la tabla imagenes_servicio
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'imagenes_servicio'
) AS tabla_existe;

-- 2. Si no existe, crear la tabla imagenes_servicio
CREATE TABLE IF NOT EXISTS imagenes_servicio (
    id_imagen SERIAL PRIMARY KEY,
    id_ejecucion INTEGER NOT NULL REFERENCES ejecuciones_servicio(id_ejecucion) ON DELETE CASCADE,
    id_orden INTEGER NOT NULL REFERENCES ordenes_servicio(id_orden) ON DELETE CASCADE,
    url_imagen TEXT NOT NULL,
    descripcion TEXT,
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_imagenes_ejecucion ON imagenes_servicio(id_ejecucion);
CREATE INDEX IF NOT EXISTS idx_imagenes_orden ON imagenes_servicio(id_orden);

-- 4. Verificar si existe el campo imagenes_urls en ejecuciones_servicio
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ejecuciones_servicio' 
AND column_name = 'imagenes_urls';

-- 5. Si no existe, agregar el campo imagenes_urls (JSONB) como fallback
-- Nota: Ejecuta esto solo si el paso 4 no devolvió ninguna fila (la columna no existe)
-- Si el paso 4 devolvió una fila, significa que la columna ya existe y puedes saltar este paso

-- Opción A: Si la columna NO existe (paso 4 devolvió 0 filas), ejecuta esto:
ALTER TABLE ejecuciones_servicio 
ADD COLUMN IF NOT EXISTS imagenes_urls JSONB DEFAULT '[]'::jsonb;

-- Si tu versión de PostgreSQL no soporta "IF NOT EXISTS" en ALTER TABLE, usa esta opción B:
-- DO $$ 
-- BEGIN
--     IF NOT EXISTS (
--         SELECT 1 
--         FROM information_schema.columns 
--         WHERE table_schema = 'public' 
--           AND table_name = 'ejecuciones_servicio' 
--           AND column_name = 'imagenes_urls'
--     ) THEN
--         EXECUTE 'ALTER TABLE ejecuciones_servicio ADD COLUMN imagenes_urls JSONB DEFAULT ''[]''::jsonb';
--     END IF;
-- END $$;

-- 6. Verificar datos existentes
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

-- 7. Ver ejemplo de datos en imagenes_servicio
SELECT 
    id_imagen,
    id_ejecucion,
    id_orden,
    url_imagen,
    fecha_subida
FROM imagenes_servicio
ORDER BY fecha_subida DESC
LIMIT 5;

-- 8. Ver ejemplo de datos en ejecuciones_servicio.imagenes_urls
SELECT 
    id_ejecucion,
    id_orden,
    imagenes_urls,
    jsonb_array_length(imagenes_urls) AS cantidad_imagenes
FROM ejecuciones_servicio
WHERE imagenes_urls IS NOT NULL 
AND jsonb_array_length(imagenes_urls) > 0
ORDER BY id_ejecucion DESC
LIMIT 5;

