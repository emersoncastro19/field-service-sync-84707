-- Script SIMPLE para deshabilitar RLS en la tabla notificaciones
-- Este script resuelve el error: 42501: new row violates row-level security policy

-- 1. Verificar estado actual de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'notificaciones';

-- 2. Verificar políticas RLS existentes
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'notificaciones';

-- 3. ELIMINAR TODAS las políticas RLS existentes
DROP POLICY IF EXISTS "Usuarios pueden leer sus propias notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Lectura simple de notificaciones propias" ON notificaciones;
DROP POLICY IF EXISTS "Los usuarios pueden leer sus propias notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Los usuarios pueden insertar notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propias notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Usuarios pueden leer sus notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Permitir insertar notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Permitir actualizar notificaciones propias" ON notificaciones;
DROP POLICY IF EXISTS "Permitir lectura de notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Permitir inserción de notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Permitir actualización de notificaciones" ON notificaciones;

-- 4. DESHABILITAR RLS en la tabla notificaciones
ALTER TABLE notificaciones DISABLE ROW LEVEL SECURITY;

-- 5. Verificar que RLS está deshabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'notificaciones';
-- Debe retornar: rls_enabled = false

-- 6. Verificar que no hay políticas RLS
SELECT COUNT(*) as total_politicas
FROM pg_policies
WHERE tablename = 'notificaciones';
-- Debe retornar: 0

-- 7. Test: Intentar insertar una notificación de prueba (opcional)
-- IMPORTANTE: Cambia el id_destinatario por uno válido de tu tabla usuarios
-- INSERT INTO notificaciones (
--     id_destinatario, 
--     tipo_notificacion, 
--     mensaje, 
--     fecha_enviada, 
--     leida
-- ) VALUES (
--     1, -- CAMBIA por un id_usuario válido
--     'Test RLS',
--     'Prueba de inserción después de deshabilitar RLS',
--     NOW(),
--     false
-- );

-- Si la inserción anterior funcionó, puedes borrarla:
-- DELETE FROM notificaciones WHERE tipo_notificacion = 'Test RLS';

-- NOTA IMPORTANTE:
-- Después de ejecutar este script:
-- 1. Cierra y vuelve a abrir tu aplicación (Ctrl+C y npm run dev)
-- 2. Intenta asignar una orden nuevamente
-- 3. Debería funcionar sin el error 42501

