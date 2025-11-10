-- ============================================================
-- SOLUCIÓN SIMPLE: Crear Políticas RLS para Notificaciones
-- ============================================================
-- Ejecuta este script completo en el SQL Editor de Supabase
-- ============================================================

-- PASO 1: Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Permitir insertar notificaciones (desarrollo)" ON notificaciones;
DROP POLICY IF EXISTS "Permitir ver todas las notificaciones (desarrollo)" ON notificaciones;
DROP POLICY IF EXISTS "Permitir actualizar todas las notificaciones (desarrollo)" ON notificaciones;
DROP POLICY IF EXISTS "Permitir insertar notificaciones para usuarios autenticados" ON notificaciones;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias notificaciones" ON notificaciones;

-- PASO 2: Crear las políticas permisivas para desarrollo

-- Política para INSERT: Permitir que cualquier usuario autenticado inserte notificaciones
CREATE POLICY "Permitir insertar notificaciones (desarrollo)"
ON notificaciones
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para SELECT: Permitir que los usuarios autenticados vean todas las notificaciones
CREATE POLICY "Permitir ver todas las notificaciones (desarrollo)"
ON notificaciones
FOR SELECT
TO authenticated
USING (true);

-- Política para UPDATE: Permitir que los usuarios autenticados actualicen cualquier notificación
CREATE POLICY "Permitir actualizar todas las notificaciones (desarrollo)"
ON notificaciones
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================
-- VERIFICACIÓN: Ver las políticas creadas
-- ============================================================
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'notificaciones'
ORDER BY cmd, policyname;

-- ============================================================
-- LISTO! Ahora las notificaciones deberían funcionar correctamente
-- ============================================================

