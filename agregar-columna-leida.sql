-- Script para agregar la columna 'leida' a la tabla notificaciones
-- Basado en el esquema actual que muestra: 8 columnas sin 'leida'

-- 1. Verificar estructura actual (ya lo hiciste, pero lo dejamos para referencia)
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'notificaciones'
ORDER BY ordinal_position;

-- 2. Agregar la columna 'leida' como BOOLEAN
ALTER TABLE notificaciones 
ADD COLUMN IF NOT EXISTS leida BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Verificar que la columna se creó correctamente
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

-- 4. Actualizar valores NULL si existen (aunque no deberían porque tiene DEFAULT)
UPDATE notificaciones 
SET leida = FALSE 
WHERE leida IS NULL;

-- 5. Verificar que no hay valores NULL
SELECT 
    COUNT(*) as total_notificaciones,
    COUNT(leida) as notificaciones_con_leida,
    COUNT(*) FILTER (WHERE leida = TRUE) as leidas,
    COUNT(*) FILTER (WHERE leida = FALSE) as no_leidas,
    COUNT(*) FILTER (WHERE leida IS NULL) as con_null
FROM notificaciones;

-- 6. Aumentar el tamaño de tipo_notificacion (NECESARIO)
-- Actualmente es VARCHAR(20), pero algunos tipos son más largos:
-- - "Cita Programada" = 16 caracteres ✅
-- - "Asignación de Orden" = 18 caracteres ✅
-- - "Nueva Orden Creada" = 19 caracteres ✅
-- - "Servicio Confirmado por Cliente" = 30 caracteres ❌ (muy largo - necesita más espacio)
-- - "Orden Validada" = 14 caracteres ✅
-- - "Orden Rechazada" = 15 caracteres ✅

-- Aumentar a VARCHAR(100) para permitir tipos más largos
ALTER TABLE notificaciones 
ALTER COLUMN tipo_notificacion TYPE VARCHAR(100);

-- 7. Verificar estructura final
SELECT 
    'Columnas en notificaciones:' as info,
    COUNT(*) as total_columnas
FROM information_schema.columns
WHERE table_name = 'notificaciones';

-- NOTA IMPORTANTE:
-- Después de ejecutar este script, DEBES refrescar el schema cache de Supabase:
-- 1. Ve a Settings > API en tu proyecto de Supabase
-- 2. Haz clic en "Reload schema cache" 
-- 3. O espera 2-3 minutos para que se actualice automáticamente
-- 
-- Si no refrescas el cache, seguirás viendo el error PGRST204

