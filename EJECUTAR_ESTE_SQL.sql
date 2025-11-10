-- ============================================================
-- EJECUTA ESTE SQL COMPLETO EN SUPABASE
-- ============================================================
-- Este script elimina cualquier constraint existente y crea uno nuevo
-- ============================================================

-- PASO 1: Eliminar constraint existente (busca por nombre o definición)
DO $$ 
DECLARE
    constraint_name_var TEXT;
BEGIN
    -- Buscar cualquier constraint CHECK que mencione estado_resultado
    FOR constraint_name_var IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'ejecuciones_servicio'::regclass 
        AND contype = 'c'
        AND (
            pg_get_constraintdef(oid) LIKE '%estado_resultado%'
            OR conname LIKE '%estado_resultado%'
            OR pg_get_constraintdef(oid) LIKE '%estado%resultado%'
        )
    ) LOOP
        EXECUTE 'ALTER TABLE ejecuciones_servicio DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name_var);
        RAISE NOTICE 'Constraint eliminado: %', constraint_name_var;
    END LOOP;
END $$;

-- PASO 2: Crear el nuevo constraint permisivo
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

-- PASO 3: Verificar que se creó
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c'
AND conname = 'ejecuciones_servicio_estado_resultado_check';

-- Si no aparece, verifica TODOS los constraints de la tabla:
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c'
ORDER BY conname;

-- ============================================================
-- RESULTADO ESPERADO:
-- Deberías ver UNA fila con:
-- constraint_name: ejecuciones_servicio_estado_resultado_check
-- constraint_definition: CHECK ((estado_resultado IS NULL) OR ...)
-- ============================================================

