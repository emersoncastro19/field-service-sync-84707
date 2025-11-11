-- Script para agregar el campo id_coordinador_asignador en la tabla ordenes_servicio
-- Este campo almacenará el ID del coordinador que asignó la orden

-- Verificar si la columna ya existe antes de agregarla
DO $$ 
BEGIN
    -- Verificar si la columna id_coordinador_asignador existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ordenes_servicio' 
        AND column_name = 'id_coordinador_asignador'
    ) THEN
        -- Agregar la columna id_coordinador_asignador
        ALTER TABLE ordenes_servicio 
        ADD COLUMN id_coordinador_asignador INTEGER;

        -- Agregar comentario a la columna
        COMMENT ON COLUMN ordenes_servicio.id_coordinador_asignador IS 
        'ID del coordinador de campo que asignó el técnico a esta orden';

        -- Crear índice para mejorar las consultas
        CREATE INDEX IF NOT EXISTS idx_ordenes_servicio_id_coordinador_asignador 
        ON ordenes_servicio(id_coordinador_asignador);

        -- Agregar foreign key constraint si es necesario (opcional)
        -- ALTER TABLE ordenes_servicio 
        -- ADD CONSTRAINT fk_ordenes_servicio_coordinador_asignador 
        -- FOREIGN KEY (id_coordinador_asignador) 
        -- REFERENCES coordinadores_campo(id_coordinador);

        RAISE NOTICE 'Columna id_coordinador_asignador agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna id_coordinador_asignador ya existe';
    END IF;
END $$;

-- Verificar la estructura de la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'ordenes_servicio'
ORDER BY ordinal_position;

