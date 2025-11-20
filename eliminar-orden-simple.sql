-- ============================================
-- ELIMINACIÓN SIMPLE DE ORDEN ORD-20251120-5132
-- ============================================
-- ADVERTENCIA: Este script elimina permanentemente los datos
-- Basado en el esquema real de tu base de datos

-- Eliminar en orden de dependencias (de hijos a padres)

-- 1. Imágenes de servicio
DELETE FROM imagenes_servicio 
WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- 2. Logs de auditoría
DELETE FROM logs_auditoria 
WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- 3. Notificaciones
DELETE FROM notificaciones 
WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- 4. Impedimentos
DELETE FROM impedimentos 
WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- 5. Ejecuciones de servicio  
DELETE FROM ejecuciones_servicio 
WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- 6. Citas
DELETE FROM citas 
WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- 7. Orden principal
DELETE FROM ordenes_servicio 
WHERE numero_orden = 'ORD-20251120-5132';

-- Verificar que se eliminó
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Orden eliminada exitosamente'
        ELSE '❌ ERROR: La orden aún existe'
    END as resultado
FROM ordenes_servicio 
WHERE numero_orden = 'ORD-20251120-5132';