-- Script para crear la columna 'leida' en la tabla notificaciones
-- Este script verifica si la columna existe y la crea si no existe

-- 1. Verificar estructura actual de la tabla notificaciones
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'notificaciones'
ORDER BY ordinal_position;

-- 2. Verificar si la columna 'leida' existe
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'notificaciones'
  AND column_name = 'leida';

-- 3. Si la columna NO existe, crearla
-- Verifica primero si existe antes de ejecutar
DO $$
BEGIN
    -- Verificar si la columna 'leida' existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notificaciones' 
        AND column_name = 'leida'
    ) THEN
        -- Crear la columna 'leida' como BOOLEAN con valor por defecto FALSE
        ALTER TABLE notificaciones 
        ADD COLUMN leida BOOLEAN NOT NULL DEFAULT FALSE;
        
        RAISE NOTICE 'Columna "leida" creada exitosamente en la tabla notificaciones';
    ELSE
        RAISE NOTICE 'La columna "leida" ya existe en la tabla notificaciones';
    END IF;
END $$;

-- 4. Verificar todas las columnas requeridas en notificaciones
-- Columnas esperadas según el código:
-- - id_notificacion (PRIMARY KEY, auto-increment)
-- - id_orden (INTEGER, nullable)
-- - id_destinatario (INTEGER, NOT NULL)
-- - tipo_notificacion (VARCHAR/TEXT, NOT NULL)
-- - canal (VARCHAR/TEXT, nullable)
-- - mensaje (TEXT, NOT NULL)
-- - fecha_enviada (TIMESTAMP, NOT NULL)
-- - leida (BOOLEAN, NOT NULL, DEFAULT FALSE)

-- 5. Verificar estructura completa después de crear la columna
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'notificaciones'
ORDER BY ordinal_position;

-- 6. Si necesitas actualizar valores existentes (opcional)
-- Actualizar todas las notificaciones existentes para que tengan leida = false
UPDATE notificaciones 
SET leida = FALSE 
WHERE leida IS NULL;

-- 7. Verificar que no haya valores NULL en la columna leida
SELECT 
    COUNT(*) as total_notificaciones,
    COUNT(leida) as notificaciones_con_leida,
    COUNT(*) FILTER (WHERE leida = TRUE) as leidas,
    COUNT(*) FILTER (WHERE leida = FALSE) as no_leidas
FROM notificaciones;

-- NOTA: Si la columna ya existe pero tiene otro nombre o tipo, 
-- puedes necesitar hacer un ALTER COLUMN:
-- ALTER TABLE notificaciones ALTER COLUMN leida TYPE BOOLEAN;
-- ALTER TABLE notificaciones ALTER COLUMN leida SET DEFAULT FALSE;
-- ALTER TABLE notificaciones ALTER COLUMN leida SET NOT NULL;

