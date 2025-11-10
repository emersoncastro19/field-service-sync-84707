-- ============================================================
-- CREAR CONSTRAINT estado_resultado - SCRIPT COMPLETO
-- ============================================================
-- Este script verifica, elimina y crea el constraint correctamente
-- ============================================================

-- PASO 1: Ver TODOS los constraints CHECK de la tabla
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c'
ORDER BY conname;

-- PASO 2: Eliminar constraint existente (si existe con cualquier nombre)
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
    
    -- Si no se encontró ningún constraint, informar
    IF NOT FOUND THEN
        RAISE NOTICE 'No se encontraron constraints relacionados con estado_resultado';
    END IF;
END $$;

-- PASO 3: Crear el nuevo constraint
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

-- PASO 4: Verificar que se creó correctamente
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c'
AND conname = 'ejecuciones_servicio_estado_resultado_check';

-- ============================================================
-- RESULTADO ESPERADO:
-- Deberías ver:
-- constraint_name: ejecuciones_servicio_estado_resultado_check
-- constraint_definition: CHECK ((estado_resultado IS NULL) OR (estado_resultado = 'Pendiente'::text) OR ...)
-- ============================================================

-- PASO 5 (OPCIONAL): Probar insertar una ejecución de prueba
-- Descomenta y ajusta los valores según tus datos:
/*
INSERT INTO ejecuciones_servicio (
    id_orden,
    id_tecnico,
    fecha_inicio,
    trabajo_realizado,
    estado_resultado
) VALUES (
    1,  -- Cambiar por un id_orden real de tu base de datos
    1,  -- Cambiar por un id_tecnico real de tu base de datos
    NOW(),
    NULL,
    NULL  -- Probar con NULL
);

-- Verificar que se insertó
SELECT * FROM ejecuciones_servicio ORDER BY fecha_inicio DESC LIMIT 1;

-- Eliminar la prueba
-- DELETE FROM ejecuciones_servicio WHERE id_ejecucion = [id de la ejecución insertada];
*/

