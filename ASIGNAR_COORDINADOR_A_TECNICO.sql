-- Script para verificar que el campo id_coordinador_supervisor existe en la tabla tecnicos
-- y asignar coordinadores a técnicos basados en la zona

-- Verificar estructura de la tabla tecnicos
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tecnicos'
    AND column_name IN ('id_tecnico', 'id_usuario', 'id_coordinador_supervisor', 'zona_cobertura', 'disponibilidad')
ORDER BY ordinal_position;

-- Asignar coordinadores a técnicos existentes basados en la zona
-- Esto actualiza los técnicos que no tienen coordinador asignado
UPDATE tecnicos t
SET id_coordinador_supervisor = (
    SELECT c.id_coordinador
    FROM coordinadores_campo c
    WHERE c.zona_responsabilidad = t.zona_cobertura
    LIMIT 1
)
WHERE t.id_coordinador_supervisor IS NULL
    AND t.zona_cobertura IS NOT NULL
    AND t.zona_cobertura != 'Por asignar'
    AND EXISTS (
        SELECT 1
        FROM coordinadores_campo c
        WHERE c.zona_responsabilidad = t.zona_cobertura
    );

-- Verificar técnicos con coordinador asignado
SELECT 
    t.id_tecnico,
    u.nombre_completo as tecnico_nombre,
    t.zona_cobertura,
    t.id_coordinador_supervisor,
    c.zona_responsabilidad,
    u2.nombre_completo as coordinador_nombre
FROM tecnicos t
INNER JOIN usuarios u ON t.id_usuario = u.id_usuario
LEFT JOIN coordinadores_campo c ON t.id_coordinador_supervisor = c.id_coordinador
LEFT JOIN usuarios u2 ON c.id_usuario = u2.id_usuario
ORDER BY t.id_tecnico;

