-- Script para forzar la actualización del schema cache de Supabase
-- Ejecutar esto puede ayudar a que Supabase reconozca los cambios

-- 1. Verificar que la columna 'leida' existe (esto fuerza una consulta al schema)
SELECT 
    column_name, 
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'notificaciones' 
  AND column_name = 'leida';

-- 2. Hacer una consulta simple a la tabla para activar el schema
SELECT COUNT(*) 
FROM notificaciones 
WHERE leida = false 
   OR leida = true 
   OR leida IS NOT NULL;

-- 3. Intentar un INSERT de prueba (luego puedes borrarlo)
-- Esto fuerza a Supabase a reconocer la estructura actualizada
-- IMPORTANTE: Usa un id_destinatario que exista en tu tabla usuarios
-- INSERT INTO notificaciones (
--     id_destinatario, 
--     tipo_notificacion, 
--     mensaje, 
--     fecha_enviada, 
--     leida
-- ) VALUES (
--     1, -- CAMBIA ESTE NÚMERO por un id_usuario válido de tu tabla usuarios
--     'Test de Schema',
--     'Esta es una notificación de prueba para actualizar el cache',
--     NOW(),
--     false
-- );

-- Si la inserción anterior funcionó, puedes borrarla con:
-- DELETE FROM notificaciones WHERE tipo_notificacion = 'Test de Schema';

-- 4. Verificar estructura final
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default
FROM information_schema.columns
WHERE table_name = 'notificaciones'
ORDER BY ordinal_position;

