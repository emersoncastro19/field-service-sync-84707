-- ============================================================
-- SOLUCIÓN: Verificar y Corregir Valores de estado_resultado
-- ============================================================
-- El error indica que 'En Proceso' no es un valor válido para estado_resultado
-- Este script ayuda a identificar los valores válidos y corregir el constraint
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

-- PASO 3: OPCIÓN A - Si el constraint es muy restrictivo, podemos:
-- Eliminar el constraint actual y crear uno más permisivo
-- (Solo ejecuta esto si es necesario)

/*
-- Eliminar constraint existente
ALTER TABLE ejecuciones_servicio
DROP CONSTRAINT IF EXISTS ejecuciones_servicio_estado_resultado_check;

-- Crear nuevo constraint más permisivo
ALTER TABLE ejecuciones_servicio
ADD CONSTRAINT ejecuciones_servicio_estado_resultado_check
CHECK (estado_resultado IS NULL OR estado_resultado IN (
    'Pendiente',
    'En Proceso',
    'En_Proceso',
    'Completado',
    'Completada',
    'Cancelado',
    'Cancelada'
));
*/

-- PASO 4: OPCIÓN B - Si queremos permitir NULL al inicio (RECOMENDADO)
-- Permitir que estado_resultado sea NULL cuando se crea la ejecución
-- y luego se actualiza cuando se finaliza el trabajo

/*
-- Eliminar constraint existente
ALTER TABLE ejecuciones_servicio
DROP CONSTRAINT IF EXISTS ejecuciones_servicio_estado_resultado_check;

-- Crear nuevo constraint que permite NULL y valores válidos
ALTER TABLE ejecuciones_servicio
ADD CONSTRAINT ejecuciones_servicio_estado_resultado_check
CHECK (
    estado_resultado IS NULL 
    OR estado_resultado = 'Pendiente'
    OR estado_resultado = 'Completado'
    OR estado_resultado = 'Cancelado'
);
*/

-- PASO 5: OPCIÓN C - Si los valores deben ser específicos (ej: 'Pendiente', 'Completado')
-- Verificar primero qué valores acepta actualmente

-- ============================================================
-- RECOMENDACIÓN
-- ============================================================
-- Ejecuta primero el PASO 1 y PASO 2 para ver qué valores acepta
-- Luego, si es necesario, usa la OPCIÓN B (permitir NULL)
-- Esto es más flexible y permite que el estado se establezca cuando se finaliza el trabajo
-- ============================================================

