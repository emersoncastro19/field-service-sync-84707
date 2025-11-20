-- ============================================
-- SCRIPT SEGURO PARA ELIMINAR ORDEN ORD-20251120-5132
-- CON BACKUP DE DATOS
-- ============================================

-- PASO 1: CREAR BACKUP DE LOS DATOS ANTES DE ELIMINAR
-- (Opcional pero recomendado)

-- Backup de la orden principal
CREATE TABLE IF NOT EXISTS backup_ordenes_eliminadas AS
SELECT *, NOW() as fecha_eliminacion
FROM ordenes_servicio 
WHERE 1=0; -- Crear estructura vacía

INSERT INTO backup_ordenes_eliminadas
SELECT *, NOW() as fecha_eliminacion
FROM ordenes_servicio 
WHERE numero_orden = 'ORD-20251120-5132';

-- Backup de citas relacionadas
CREATE TABLE IF NOT EXISTS backup_citas_eliminadas AS
SELECT *, NOW() as fecha_eliminacion
FROM citas 
WHERE 1=0; -- Crear estructura vacía

INSERT INTO backup_citas_eliminadas
SELECT c.*, NOW() as fecha_eliminacion
FROM citas c
JOIN ordenes_servicio o ON c.id_orden = o.id_orden
WHERE o.numero_orden = 'ORD-20251120-5132';

-- PASO 2: MOSTRAR QUÉ SE VA A ELIMINAR
SELECT 'DATOS QUE SE VAN A ELIMINAR:' as info;

SELECT 
    'Orden Principal' as tipo,
    numero_orden,
    estado,
    tipo_servicio,
    fecha_solicitud
FROM ordenes_servicio 
WHERE numero_orden = 'ORD-20251120-5132';

SELECT 
    'Citas Relacionadas' as tipo,
    c.id_cita,
    c.fecha_programada,
    c.estado as estado_cita
FROM citas c
JOIN ordenes_servicio o ON c.id_orden = o.id_orden
WHERE o.numero_orden = 'ORD-20251120-5132';

SELECT 
    'Ejecuciones Relacionadas' as tipo,
    e.id_ejecucion,
    e.fecha_inicio,
    e.estado_resultado
FROM ejecuciones_servicio e
JOIN ordenes_servicio o ON e.id_orden = o.id_orden
WHERE o.numero_orden = 'ORD-20251120-5132';

SELECT 
    'Impedimentos Relacionados' as tipo,
    i.id_impedimento,
    i.tipo_impedimento,
    i.estado_resolucion
FROM impedimentos i
JOIN ordenes_servicio o ON i.id_orden = o.id_orden
WHERE o.numero_orden = 'ORD-20251120-5132';

-- PASO 3: ELIMINACIÓN REAL (Ejecutar solo después de revisar el PASO 2)

-- 3.1 Eliminar impedimentos
DELETE FROM impedimentos 
WHERE id_orden IN (
    SELECT id_orden 
    FROM ordenes_servicio 
    WHERE numero_orden = 'ORD-20251120-5132'
);

-- 3.2 Eliminar ejecuciones de servicio
DELETE FROM ejecuciones_servicio 
WHERE id_orden IN (
    SELECT id_orden 
    FROM ordenes_servicio 
    WHERE numero_orden = 'ORD-20251120-5132'
);

-- 3.3 Eliminar notificaciones relacionadas
DELETE FROM notificaciones 
WHERE mensaje LIKE '%ORD-20251120-5132%' 
   OR titulo LIKE '%ORD-20251120-5132%'
   OR datos_adicionales::text LIKE '%ORD-20251120-5132%';

-- 3.4 Eliminar citas
DELETE FROM citas 
WHERE id_orden IN (
    SELECT id_orden 
    FROM ordenes_servicio 
    WHERE numero_orden = 'ORD-20251120-5132'
);

-- 3.5 Eliminar la orden principal
DELETE FROM ordenes_servicio 
WHERE numero_orden = 'ORD-20251120-5132';

-- PASO 4: VERIFICACIÓN FINAL
SELECT 'VERIFICACIÓN POST-ELIMINACIÓN:' as info;

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Orden eliminada correctamente'
        ELSE '❌ ERROR: La orden aún existe'
    END as resultado
FROM ordenes_servicio 
WHERE numero_orden = 'ORD-20251120-5132';

-- PASO 5: LIMPIAR CACHE Y REFRESCAR VISTAS (Opcional)
-- Si tienes vistas materializadas o cache, puedes refrescarlas aquí
-- REFRESH MATERIALIZED VIEW IF EXISTS vista_reportes;

-- ============================================
-- INSTRUCCIONES:
-- ============================================
-- 1. Ejecuta PASO 1 para crear backup
-- 2. Ejecuta PASO 2 para ver qué se va a eliminar
-- 3. Revisa los resultados del PASO 2 cuidadosamente
-- 4. Si todo está correcto, ejecuta PASO 3
-- 5. Ejecuta PASO 4 para verificar
-- 6. Los datos de backup quedan en las tablas backup_*
-- ============================================