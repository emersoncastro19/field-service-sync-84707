-- ============================================================
-- SOLUCIÓN DEFINITIVA: Corregir estado_resultado
-- ============================================================
-- Este script elimina TODOS los constraints CHECK relacionados
-- con estado_resultado y crea uno nuevo permisivo
-- ============================================================

-- PASO 1: Eliminar TODOS los constraints CHECK relacionados con estado_resultado
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'ejecuciones_servicio'::regclass 
        AND contype = 'c'
        AND (
            pg_get_constraintdef(oid) LIKE '%estado_resultado%'
            OR conname LIKE '%estado_resultado%'
        )
    ) LOOP
        EXECUTE 'ALTER TABLE ejecuciones_servicio DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
        RAISE NOTICE 'Eliminado constraint: %', r.conname;
    END LOOP;
END $$;

-- PASO 2: Crear nuevo constraint permisivo
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

-- PASO 3: Verificar que se creó correctamente
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c'
AND conname = 'ejecuciones_servicio_estado_resultado_check';

-- ============================================================
-- RESULTADO ESPERADO:
-- Deberías ver un constraint con:
-- CHECK (estado_resultado IS NULL OR estado_resultado = 'Pendiente' OR ...)
-- ============================================================

