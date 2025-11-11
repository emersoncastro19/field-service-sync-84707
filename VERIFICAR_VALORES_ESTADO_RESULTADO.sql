-- ============================================================
-- VERIFICAR VALORES VÁLIDOS PARA estado_resultado
-- ============================================================
-- Este script verifica qué valores acepta la columna estado_resultado
-- en la tabla ejecuciones_servicio
-- ============================================================

-- 1. Ver la estructura de la tabla y el constraint CHECK
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c';

-- 2. Ver la definición de la columna estado_resultado
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'ejecuciones_servicio'
AND column_name = 'estado_resultado';

-- 3. Ver si hay valores existentes en la tabla (para referencia)
SELECT DISTINCT estado_resultado
FROM ejecuciones_servicio
ORDER BY estado_resultado;

-- ============================================================
-- VALORES COMUNES PARA estado_resultado
-- ============================================================
-- Basado en el constraint CHECK, los valores válidos podrían ser:
-- - 'Pendiente'
-- - 'En Proceso' (con espacio) - PERO ESTE DA ERROR
-- - 'En_Proceso' (con guión bajo)
-- - 'Completado'
-- - 'Completada'
-- - O simplemente NULL al inicio
-- ============================================================


