-- ========================================================
-- FIX 1: Permitir que id_agente_creador sea NULL
-- (Cuando el cliente crea la orden directamente)
-- ========================================================

ALTER TABLE ordenes_servicio 
ALTER COLUMN id_agente_creador DROP NOT NULL;

-- Agregar comentario explicativo
COMMENT ON COLUMN ordenes_servicio.id_agente_creador IS 
'NULL = Orden creada por el cliente directamente. Si tiene valor = Orden creada por un agente';


