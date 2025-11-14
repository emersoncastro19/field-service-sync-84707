-- Script para encontrar y eliminar el CHECK constraint de tipo_notificacion

-- 1. Buscar TODOS los CHECK constraints relacionados con tipo_notificacion
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'notificaciones'::regclass
  AND contype = 'c'
  AND (pg_get_constraintdef(oid) LIKE '%tipo_notificacion%'
       OR conname LIKE '%tipo_notificacion%');

-- 2. Si el paso 1 no devuelve nada, ver TODOS los CHECK constraints (para ver si hay alguno más abajo)
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'notificaciones'::regclass
  AND contype = 'c'
ORDER BY conname;

-- 3. ELIMINAR el constraint (intenta con todos los nombres posibles)
ALTER TABLE notificaciones 
DROP CONSTRAINT IF EXISTS notificaciones_tipo_notificacion_check;

ALTER TABLE notificaciones 
DROP CONSTRAINT IF EXISTS tipo_notificacion_check;

ALTER TABLE notificaciones 
DROP CONSTRAINT IF EXISTS check_tipo_notificacion;

-- 4. Verificar que se eliminó (debe devolver 0 filas si se eliminó correctamente)
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'notificaciones'::regclass
  AND contype = 'c'
  AND (pg_get_constraintdef(oid) LIKE '%tipo_notificacion%'
       OR conname LIKE '%tipo_notificacion%');

-- 5. Listar TODOS los CHECK constraints restantes
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'notificaciones'::regclass
  AND contype = 'c'
ORDER BY conname;

