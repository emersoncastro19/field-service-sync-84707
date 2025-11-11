-- ============================================================
-- SCRIPT SIMPLE: Crear Constraint estado_resultado
-- ============================================================
-- Ejecuta TODO este script en Supabase SQL Editor
-- ============================================================

-- PASO 1: Eliminar constraint si existe
ALTER TABLE ejecuciones_servicio
DROP CONSTRAINT IF EXISTS ejecuciones_servicio_estado_resultado_check;

-- PASO 2: Crear nuevo constraint
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

-- PASO 3: Ver TODOS los constraints de la tabla para verificar
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c'
ORDER BY conname;

-- ============================================================
-- RESULTADO ESPERADO:
-- Deberías ver al menos 1 fila con:
-- constraint_name: ejecuciones_servicio_estado_resultado_check
-- constraint_definition: CHECK ((estado_resultado IS NULL) OR ...)
-- ============================================================


