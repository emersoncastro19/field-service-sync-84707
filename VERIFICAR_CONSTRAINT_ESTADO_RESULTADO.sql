-- ============================================================
-- VERIFICAR CONSTRAINT estado_resultado - PASO A PASO
-- ============================================================

-- PASO 1: Ver TODOS los constraints de la tabla ejecuciones_servicio
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
ORDER BY conname;

-- PASO 2: Ver la estructura de la columna estado_resultado
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

-- PASO 3: Ver si hay datos en la tabla y qué valores tienen
SELECT DISTINCT estado_resultado, COUNT(*) as cantidad
FROM ejecuciones_servicio
GROUP BY estado_resultado
ORDER BY estado_resultado;

-- PASO 4: Ver TODOS los constraints CHECK de la tabla (no solo los de estado_resultado)
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c';

-- ============================================================
-- SOLUCIÓN: Crear el constraint correcto
-- ============================================================
-- Si no existe ningún constraint, o si el constraint actual es muy restrictivo,
-- ejecuta esto para crear uno permisivo:

-- Eliminar cualquier constraint existente relacionado con estado_resultado
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'ejecuciones_servicio'::regclass 
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%estado_resultado%'
    ) LOOP
        EXECUTE 'ALTER TABLE ejecuciones_servicio DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Crear nuevo constraint permisivo
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

-- Verificar que se creó
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c'
AND conname = 'ejecuciones_servicio_estado_resultado_check';

-- ============================================================
-- PRUEBA: Insertar una ejecución de prueba
-- ============================================================
-- Después de crear el constraint, prueba insertar una ejecución:

/*
INSERT INTO ejecuciones_servicio (
    id_orden,
    id_tecnico,
    fecha_inicio,
    trabajo_realizado,
    estado_resultado
) VALUES (
    1,  -- Cambiar por un id_orden real
    1,  -- Cambiar por un id_tecnico real
    NOW(),
    NULL,
    NULL  -- O 'Pendiente'
);

-- Verificar que se insertó
SELECT * FROM ejecuciones_servicio ORDER BY fecha_inicio DESC LIMIT 1;

-- Limpiar la prueba (opcional)
-- DELETE FROM ejecuciones_servicio WHERE id_ejecucion = [id de la ejecución de prueba];
*/


