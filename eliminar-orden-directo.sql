-- ELIMINACIÓN DIRECTA - COPIA Y PEGA TODO JUNTO
-- Elimina la orden ORD-20251120-5132 y todos sus registros relacionados

DELETE FROM imagenes_servicio WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');
DELETE FROM logs_auditoria WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');
DELETE FROM notificaciones WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');
DELETE FROM impedimentos WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');
DELETE FROM ejecuciones_servicio WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');
DELETE FROM citas WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');
DELETE FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132';

-- Verificar eliminación
SELECT CASE WHEN COUNT(*) = 0 THEN '✅ ELIMINADO CORRECTAMENTE' ELSE '❌ ERROR' END as resultado FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132';