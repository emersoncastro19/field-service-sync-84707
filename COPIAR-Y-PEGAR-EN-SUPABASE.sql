-- ============================================
-- COPIA Y PEGA TODO ESTE SCRIPT EN SUPABASE
-- ============================================
-- Ejecuta TODO desde aquí hasta el final

-- PASO 1: Eliminar todas las políticas RLS
DROP POLICY IF EXISTS "Permitir actualizar todas las notificaciones (desarrollo)" ON notificaciones;
DROP POLICY IF EXISTS "Permitir insertar notificaciones (desarrollo)" ON notificaciones;
DROP POLICY IF EXISTS "Permitir insertar notificaciones para usuarios autenticados" ON notificaciones;
DROP POLICY IF EXISTS "Permitir ver todas las notificaciones (desarrollo)" ON notificaciones;
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

-- PASO 2: Deshabilitar RLS
ALTER TABLE notificaciones DISABLE ROW LEVEL SECURITY;

-- PASO 3: Verificar que funcionó (esto solo muestra el resultado, no hace cambios)
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'notificaciones';

-- PASO 4: Verificar que no hay políticas (esto solo muestra el resultado, no hace cambios)
SELECT COUNT(*) as total_politicas
FROM pg_policies
WHERE tablename = 'notificaciones';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- Después de ejecutar, deberías ver:
-- - rls_enabled = false
-- - total_politicas = 0










