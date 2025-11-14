-- Script para solucionar el CHECK constraint en tipo_notificacion
-- El constraint está bloqueando valores como "Cita Programada" y "Asignación de Orden"

-- 1. Verificar qué CHECK constraint existe
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'notificaciones'::regclass
  AND contype = 'c';

-- 2. Verificar todos los constraints de la tabla
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'notificaciones'
  AND tc.constraint_type = 'CHECK';

-- 3. ELIMINAR el CHECK constraint que limita tipo_notificacion
-- (Probablemente se llama "notificaciones_tipo_notificacion_check")
ALTER TABLE notificaciones 
DROP CONSTRAINT IF EXISTS notificaciones_tipo_notificacion_check;

-- También intentar otros nombres posibles
ALTER TABLE notificaciones 
DROP CONSTRAINT IF EXISTS tipo_notificacion_check;

ALTER TABLE notificaciones 
DROP CONSTRAINT IF EXISTS check_tipo_notificacion;

-- 4. Verificar que se eliminó el constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'notificaciones'::regclass
  AND contype = 'c';

-- 5. Si el constraint todavía existe, listar todos los constraints para ver el nombre exacto
SELECT 
    conname,
    pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'notificaciones'::regclass;

-- 6. Test: Intentar insertar una notificación de prueba (opcional)
-- IMPORTANTE: Cambia el id_destinatario por uno válido
/*
INSERT INTO notificaciones (
    id_destinatario, 
    tipo_notificacion, 
    mensaje, 
    fecha_enviada, 
    leida
) VALUES (
    1, -- CAMBIA por un id_usuario válido
    'Cita Programada', -- Este es uno de los valores que estaba fallando
    'Prueba de inserción después de eliminar constraint',
    NOW(),
    false
);
*/

-- Si la inserción anterior funcionó, puedes borrarla:
-- DELETE FROM notificaciones WHERE mensaje LIKE 'Prueba de inserción%';

-- NOTA: Después de ejecutar este script, reinicia tu aplicación
-- y prueba asignar una orden nuevamente.

