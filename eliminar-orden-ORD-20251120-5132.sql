-- ============================================
-- SCRIPT CORREGIDO PARA ELIMINAR ORDEN ORD-20251120-5132
-- ============================================
-- IMPORTANTE: Ejecuta este script paso a paso en Supabase
-- Basado en el esquema real de la base de datos

-- PASO 1: Verificar que la orden existe y obtener información
SELECT 
    id_orden,
    numero_orden,
    estado,
    tipo_servicio,
    fecha_solicitud,
    id_cliente,
    id_tecnico_asignado
FROM ordenes_servicio 
WHERE numero_orden = 'ORD-20251120-5132';

-- PASO 2: Ver todos los registros relacionados ANTES de eliminar
SELECT 'REGISTROS QUE SE VAN A ELIMINAR:' as info;

-- Ver imágenes de servicio relacionadas
SELECT 'imagenes_servicio' as tabla, COUNT(*) as cantidad
FROM imagenes_servicio 
WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- Ver logs de auditoría relacionados
SELECT 'logs_auditoria' as tabla, COUNT(*) as cantidad
FROM logs_auditoria 
WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- Ver notificaciones relacionadas
SELECT 'notificaciones' as tabla, COUNT(*) as cantidad
FROM notificaciones 
WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- Ver impedimentos relacionados
SELECT 'impedimentos' as tabla, COUNT(*) as cantidad
FROM impedimentos 
WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- Ver ejecuciones de servicio relacionadas
SELECT 'ejecuciones_servicio' as tabla, COUNT(*) as cantidad
FROM ejecuciones_servicio 
WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- Ver citas relacionadas
SELECT 'citas' as tabla, COUNT(*) as cantidad
FROM citas 
WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- PASO 3: Eliminar registros relacionados en orden correcto de dependencias

-- 3.1 Eliminar imágenes de servicio (dependen de ejecuciones y órdenes)
DELETE FROM imagenes_servicio 
WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- 3.2 Eliminar logs de auditoría relacionados con esta orden
DELETE FROM logs_auditoria 
WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- 3.3 Eliminar notificaciones relacionadas con esta orden
DELETE FROM notificaciones 
WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- 3.4 Eliminar impedimentos relacionados con esta orden
DELETE FROM impedimentos 
WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- 3.5 Eliminar ejecuciones de servicio relacionadas
DELETE FROM ejecuciones_servicio 
WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- 3.6 Eliminar citas relacionadas con esta orden
DELETE FROM citas 
WHERE id_orden = (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- PASO 4: Eliminar la orden principal
DELETE FROM ordenes_servicio 
WHERE numero_orden = 'ORD-20251120-5132';

-- PASO 5: Verificar que todo se eliminó correctamente
SELECT 'VERIFICACIÓN FINAL - Todos deben ser 0:' as info;

SELECT 
    'ordenes_servicio' as tabla,
    COUNT(*) as registros_restantes
FROM ordenes_servicio 
WHERE numero_orden = 'ORD-20251120-5132'

UNION ALL

SELECT 
    'citas' as tabla,
    COUNT(*) as registros_restantes
FROM citas 
WHERE id_orden IN (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132')

UNION ALL

SELECT 
    'ejecuciones_servicio' as tabla,
    COUNT(*) as registros_restantes
FROM ejecuciones_servicio 
WHERE id_orden IN (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132')

UNION ALL

SELECT 
    'impedimentos' as tabla,
    COUNT(*) as registros_restantes
FROM impedimentos 
WHERE id_orden IN (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132')

UNION ALL

SELECT 
    'notificaciones' as tabla,
    COUNT(*) as registros_restantes
FROM notificaciones 
WHERE id_orden IN (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132')

UNION ALL

SELECT 
    'logs_auditoria' as tabla,
    COUNT(*) as registros_restantes
FROM logs_auditoria 
WHERE id_orden IN (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132')

UNION ALL

SELECT 
    'imagenes_servicio' as tabla,
    COUNT(*) as registros_restantes
FROM imagenes_servicio 
WHERE id_orden IN (SELECT id_orden FROM ordenes_servicio WHERE numero_orden = 'ORD-20251120-5132');

-- ============================================
-- INSTRUCCIONES DE USO:
-- ============================================
-- 1. Ejecuta el PASO 1 para verificar que la orden existe
-- 2. Ejecuta el PASO 2 para ver qué se va a eliminar
-- 3. Ejecuta cada comando del PASO 3 uno por uno
-- 4. Ejecuta el PASO 4 para eliminar la orden principal
-- 5. Ejecuta el PASO 5 para verificar - todos deben ser 0
-- ============================================