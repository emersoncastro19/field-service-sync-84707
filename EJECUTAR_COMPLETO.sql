-- ============================================================
-- EJECUTA TODO ESTE SCRIPT EN SUPABASE (NO SOLO EL SELECT)
-- ============================================================
-- IMPORTANTE: Ejecuta TODAS las líneas, no solo la verificación
-- ============================================================

-- PARTE 1: Eliminar cualquier constraint existente relacionado con estado_resultado
DO $$ 
DECLARE
    constraint_name_var TEXT;
BEGIN
    FOR constraint_name_var IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'ejecuciones_servicio'::regclass 
        AND contype = 'c'
        AND (
            pg_get_constraintdef(oid) LIKE '%estado_resultado%'
            OR conname LIKE '%estado_resultado%'
        )
    ) LOOP
        EXECUTE 'ALTER TABLE ejecuciones_servicio DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name_var);
        RAISE NOTICE 'Constraint eliminado: %', constraint_name_var;
    END LOOP;
END $$;

-- PARTE 2: CREAR EL NUEVO CONSTRAINT (ESTA ES LA PARTE IMPORTANTE)
-- Ejecuta esta línea para crear el constraint
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

-- PARTE 3: Verificar que se creó correctamente
-- Después de ejecutar las partes 1 y 2, ejecuta esto para verificar:
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c'
AND conname = 'ejecuciones_servicio_estado_resultado_check';

-- ============================================================
-- RESULTADO ESPERADO EN LA PARTE 3:
-- Deberías ver 1 fila con:
-- constraint_name: ejecuciones_servicio_estado_resultado_check
-- constraint_definition: CHECK ((estado_resultado IS NULL) OR ...)
-- ============================================================


