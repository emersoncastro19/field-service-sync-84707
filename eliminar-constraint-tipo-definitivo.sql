-- Script DEFINITIVO para eliminar el CHECK constraint de tipo_notificacion
-- El constraint existe pero no aparece en las consultas normales

-- 1. Buscar el constraint de TODAS las formas posibles
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition,
    conrelid::regclass AS table_name
FROM pg_constraint
WHERE conrelid = 'notificaciones'::regclass
  AND contype = 'c'
ORDER BY conname;

-- 2. Buscar en information_schema también
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'notificaciones'
  AND tc.constraint_type = 'CHECK';

-- 3. INTENTAR ELIMINAR directamente (aunque no aparezca)
-- Ejecuta estos comandos aunque el constraint no aparezca en las consultas anteriores
ALTER TABLE notificaciones 
DROP CONSTRAINT IF EXISTS notificaciones_tipo_notificacion_check CASCADE;

-- 4. También intentar con diferentes variaciones del nombre
ALTER TABLE notificaciones 
DROP CONSTRAINT IF EXISTS tipo_notificacion_check CASCADE;

ALTER TABLE notificaciones 
DROP CONSTRAINT IF EXISTS check_tipo_notificacion CASCADE;

ALTER TABLE notificaciones 
DROP CONSTRAINT IF EXISTS notificaciones_tipo_check CASCADE;

-- 5. Ver la definición completa de la columna tipo_notificacion
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable,
    character_set_name,
    collation_name
FROM information_schema.columns
WHERE table_name = 'notificaciones'
  AND column_name = 'tipo_notificacion';

-- 6. Verificar si el constraint se eliminó
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'notificaciones'::regclass
  AND contype = 'c'
  AND (pg_get_constraintdef(oid) LIKE '%tipo_notificacion%'
       OR conname LIKE '%tipo_notificacion%'
       OR conname LIKE '%tipo%');

-- 7. Test: Intentar insertar una notificación de prueba
-- IMPORTANTE: Cambia el id_destinatario por uno válido
-- Descomenta las siguientes líneas para probar:
/*
INSERT INTO notificaciones (
    id_destinatario, 
    tipo_notificacion, 
    mensaje, 
    fecha_enviada, 
    leida
) VALUES (
    1, -- CAMBIA por un id_usuario válido
    'Cita Programada', -- Este es el valor que estaba fallando
    'Prueba después de eliminar constraint',
    NOW(),
    false
);
*/

-- Si la inserción anterior funcionó, puedes borrarla:
-- DELETE FROM notificaciones WHERE mensaje LIKE 'Prueba después de eliminar constraint%';

-- NOTA: Si después de ejecutar esto el error persiste, puede ser cache de PostgreSQL.
-- Intenta reiniciar la aplicación y probar de nuevo.










