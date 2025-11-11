-- Script para eliminar la columna id_coordinador_asignador (que no se necesita)
-- y asegurarse de que se use id_coordinador_supervisor (que ya existe)

-- IMPORTANTE: La tabla ordenes_servicio ya tiene la columna id_coordinador_supervisor
-- que es la que debemos usar para guardar el ID del coordinador que asigna la orden.

-- Opcional: Eliminar id_coordinador_asignador si no se va a usar
-- (Solo ejecuta esto si estás seguro de que no necesitas esa columna)

-- DO $$ 
-- BEGIN
--     -- Verificar si la columna id_coordinador_asignador existe
--     IF EXISTS (
--         SELECT 1 
--         FROM information_schema.columns 
--         WHERE table_name = 'ordenes_servicio' 
--         AND column_name = 'id_coordinador_asignador'
--     ) THEN
--         -- Eliminar el índice primero
--         DROP INDEX IF EXISTS idx_ordenes_servicio_id_coordinador_asignador;
--         
--         -- Eliminar la columna
--         ALTER TABLE ordenes_servicio 
--         DROP COLUMN id_coordinador_asignador;
--         
--         RAISE NOTICE 'Columna id_coordinador_asignador eliminada exitosamente';
--     ELSE
--         RAISE NOTICE 'La columna id_coordinador_asignador no existe';
--     END IF;
-- END $$;

-- Verificar la estructura de la tabla ordenes_servicio
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'ordenes_servicio'
    AND column_name IN ('id_coordinador_supervisor', 'id_coordinador_asignador', 'id_tecnico_asignado')
ORDER BY ordinal_position;

-- Verificar que id_coordinador_supervisor existe y puede almacenar el ID del coordinador
SELECT 
    'id_coordinador_supervisor' as campo,
    data_type,
    is_nullable,
    'Este es el campo que se debe usar para guardar el ID del coordinador que asigna la orden' as descripcion
FROM information_schema.columns
WHERE table_name = 'ordenes_servicio'
    AND column_name = 'id_coordinador_supervisor';

