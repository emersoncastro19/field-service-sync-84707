-- Script completo para verificar y crear todas las columnas necesarias en notificaciones
-- Este script asegura que la tabla tenga todas las columnas que el código espera

-- 1. Verificar estructura ACTUAL de la tabla notificaciones
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    column_default,
    is_nullable,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'notificaciones'
ORDER BY ordinal_position;

-- 2. Verificar si la tabla existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notificaciones'
) AS tabla_existe;

-- 3. Crear la columna 'leida' si no existe
DO $$
BEGIN
    -- Verificar y crear columna 'leida'
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'notificaciones' 
        AND column_name = 'leida'
    ) THEN
        ALTER TABLE notificaciones 
        ADD COLUMN leida BOOLEAN NOT NULL DEFAULT FALSE;
        
        RAISE NOTICE '✅ Columna "leida" creada exitosamente';
    ELSE
        RAISE NOTICE 'ℹ️ La columna "leida" ya existe';
    END IF;
END $$;

-- 4. Verificar y crear otras columnas comunes si no existen
-- Estas son las columnas que el código espera:

-- id_notificacion (normalmente es PRIMARY KEY y auto-increment)
-- Si no existe, crear la tabla completa
DO $$
BEGIN
    -- Si la tabla no existe, crearla con todas las columnas
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notificaciones'
    ) THEN
        CREATE TABLE notificaciones (
            id_notificacion SERIAL PRIMARY KEY,
            id_orden INTEGER,
            id_destinatario INTEGER NOT NULL,
            tipo_notificacion VARCHAR(255) NOT NULL,
            canal VARCHAR(100),
            mensaje TEXT NOT NULL,
            fecha_enviada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            leida BOOLEAN NOT NULL DEFAULT FALSE,
            FOREIGN KEY (id_orden) REFERENCES ordenes_servicio(id_orden) ON DELETE CASCADE,
            FOREIGN KEY (id_destinatario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
        );
        
        RAISE NOTICE '✅ Tabla "notificaciones" creada exitosamente con todas las columnas';
    END IF;
    
    -- Verificar y agregar columnas faltantes si la tabla ya existe
    
    -- Columna 'canal' (puede no existir en versiones anteriores)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'notificaciones' 
        AND column_name = 'canal'
    ) THEN
        ALTER TABLE notificaciones 
        ADD COLUMN canal VARCHAR(100) DEFAULT 'Sistema_Interno';
        
        RAISE NOTICE '✅ Columna "canal" creada exitosamente';
    END IF;
    
    -- Verificar que 'leida' tenga el tipo correcto
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'notificaciones' 
        AND column_name = 'leida'
        AND data_type != 'boolean'
    ) THEN
        -- Si existe pero tiene otro tipo, convertirla a boolean
        ALTER TABLE notificaciones 
        ALTER COLUMN leida TYPE BOOLEAN 
        USING CASE 
            WHEN leida::text = 'true' OR leida::text = 't' OR leida::text = '1' THEN TRUE 
            ELSE FALSE 
        END;
        
        ALTER TABLE notificaciones 
        ALTER COLUMN leida SET DEFAULT FALSE;
        
        ALTER TABLE notificaciones 
        ALTER COLUMN leida SET NOT NULL;
        
        RAISE NOTICE '✅ Columna "leida" convertida a BOOLEAN';
    END IF;
    
END $$;

-- 5. Actualizar valores NULL en 'leida' si existen
UPDATE notificaciones 
SET leida = FALSE 
WHERE leida IS NULL;

-- 6. Verificar estructura FINAL después de todas las modificaciones
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'notificaciones'
ORDER BY ordinal_position;

-- 7. Verificar que todas las columnas requeridas existen
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notificaciones' AND column_name = 'id_notificacion'
    ) THEN '✅' ELSE '❌' END AS id_notificacion,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notificaciones' AND column_name = 'id_orden'
    ) THEN '✅' ELSE '❌' END AS id_orden,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notificaciones' AND column_name = 'id_destinatario'
    ) THEN '✅' ELSE '❌' END AS id_destinatario,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notificaciones' AND column_name = 'tipo_notificacion'
    ) THEN '✅' ELSE '❌' END AS tipo_notificacion,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notificaciones' AND column_name = 'canal'
    ) THEN '✅' ELSE '❌' END AS canal,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notificaciones' AND column_name = 'mensaje'
    ) THEN '✅' ELSE '❌' END AS mensaje,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notificaciones' AND column_name = 'fecha_enviada'
    ) THEN '✅' ELSE '❌' END AS fecha_enviada,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notificaciones' AND column_name = 'leida'
    ) THEN '✅' ELSE '❌' END AS leida;

-- 8. Estadísticas de la tabla
SELECT 
    COUNT(*) as total_notificaciones,
    COUNT(*) FILTER (WHERE leida = TRUE) as notificaciones_leidas,
    COUNT(*) FILTER (WHERE leida = FALSE) as notificaciones_no_leidas,
    COUNT(*) FILTER (WHERE leida IS NULL) as notificaciones_sin_leida
FROM notificaciones;

-- NOTA IMPORTANTE:
-- Después de ejecutar este script, puede que necesites refrescar el schema cache de Supabase
-- Para hacerlo, ve a Settings > API en tu proyecto de Supabase y haz clic en "Reload schema cache"
-- O simplemente espera unos minutos y el cache se actualizará automáticamente

