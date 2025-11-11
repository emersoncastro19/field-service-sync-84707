-- ============================================================
-- CORRECCIÓN: Constraint estado_resultado en ejecuciones_servicio
-- ============================================================
-- Este script corrige el constraint CHECK que está bloqueando
-- la inserción de ejecuciones de servicio
-- ============================================================

-- PASO 1: Ver el constraint actual
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c'
AND conname LIKE '%estado_resultado%';

-- PASO 2: Eliminar el constraint existente
ALTER TABLE ejecuciones_servicio
DROP CONSTRAINT IF EXISTS ejecuciones_servicio_estado_resultado_check;

-- PASO 3: Crear nuevo constraint que permite NULL y valores válidos
ALTER TABLE ejecuciones_servicio
ADD CONSTRAINT ejecuciones_servicio_estado_resultado_check
CHECK (
    estado_resultado IS NULL 
    OR estado_resultado = 'Pendiente'
    OR estado_resultado = 'Completado'
    OR estado_resultado = 'Completada'
    OR estado_resultado = 'Cancelado'
    OR estado_resultado = 'Cancelada'
);

-- PASO 4: Verificar que el constraint se creó correctamente
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c'
AND conname LIKE '%estado_resultado%';

-- ============================================================
-- LISTO! Ahora puedes insertar ejecuciones con:
-- - estado_resultado = NULL (al inicio)
-- - estado_resultado = 'Pendiente' (al inicio)
-- - estado_resultado = 'Completado' (al finalizar)
-- ============================================================


