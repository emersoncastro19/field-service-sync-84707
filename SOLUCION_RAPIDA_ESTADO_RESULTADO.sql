-- ============================================================
-- SOLUCIÓN RÁPIDA: Verificar y Corregir estado_resultado
-- ============================================================
-- Ejecuta este script para ver qué valores acepta estado_resultado
-- y corregir el constraint si es necesario
-- ============================================================

-- PASO 1: Ver el constraint CHECK actual
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c'
AND conname LIKE '%estado_resultado%';

-- PASO 2: Ver valores existentes en la tabla (si hay datos)
SELECT DISTINCT estado_resultado, COUNT(*) as cantidad
FROM ejecuciones_servicio
GROUP BY estado_resultado
ORDER BY estado_resultado;

-- ============================================================
-- SOLUCIÓN: Permitir NULL y valores comunes
-- ============================================================
-- Si el constraint es muy restrictivo, ejecuta esto:

-- Eliminar constraint existente
ALTER TABLE ejecuciones_servicio
DROP CONSTRAINT IF EXISTS ejecuciones_servicio_estado_resultado_check;

-- Crear nuevo constraint que permite NULL y valores comunes
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

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Verificar que el constraint se creó correctamente
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

