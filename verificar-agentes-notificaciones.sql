-- Script para verificar el problema de notificaciones
-- Ejecuta estos queries en Supabase SQL Editor

-- 1. Verificar si hay agentes en la tabla
SELECT 
    id_agente,
    id_usuario,
    estado,
    fecha_creacion
FROM agentes_servicio
ORDER BY id_agente;

-- 2. Verificar si los agentes tienen id_usuario válido
SELECT 
    COUNT(*) as total_agentes,
    COUNT(id_usuario) as agentes_con_usuario,
    COUNT(*) - COUNT(id_usuario) as agentes_sin_usuario
FROM agentes_servicio;

-- 3. Ver notificaciones recientes
SELECT 
    id_notificacion,
    id_orden,
    id_destinatario,
    tipo_notificacion,
    mensaje,
    fecha_enviada,
    leida
FROM notificaciones
ORDER BY fecha_enviada DESC
LIMIT 10;

-- 4. Verificar políticas RLS en agentes_servicio (para SELECT)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'agentes_servicio';

-- 5. Verificar políticas RLS en notificaciones (para INSERT)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'notificaciones';

-- 6. Si no hay agentes, puedes crear uno de prueba (AJUSTA EL id_usuario según tu usuario agente)
-- INSERT INTO agentes_servicio (id_usuario, estado, fecha_creacion)
-- VALUES (
--     (SELECT id_usuario FROM usuarios WHERE tipo_usuario = 'Agente' LIMIT 1),
--     'Activo',
--     NOW()
-- );


