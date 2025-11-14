-- EJECUTA ESTE SCRIPT COMPLETO - Pasos 3 y 4 para deshabilitar RLS

-- PASO 3: ELIMINAR TODAS las políticas RLS existentes
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

-- PASO 4: DESHABILITAR RLS en la tabla notificaciones
ALTER TABLE notificaciones DISABLE ROW LEVEL SECURITY;

-- VERIFICACIÓN: Verificar que RLS está deshabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'notificaciones';
-- Debe retornar: rls_enabled = false

-- VERIFICACIÓN: Verificar que no hay políticas RLS
SELECT COUNT(*) as total_politicas
FROM pg_policies
WHERE tablename = 'notificaciones';
-- Debe retornar: 0

