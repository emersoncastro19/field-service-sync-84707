-- Script para corregir las políticas RLS de la tabla notificaciones
-- IMPORTANTE: Este sistema NO usa Supabase Auth directamente, usa autenticación personalizada
-- Por lo tanto, necesitamos políticas permisivas para anon o deshabilitar RLS

-- 1. Verificar estructura de la tabla notificaciones
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'notificaciones'
ORDER BY ordinal_position;

-- 2. Verificar políticas RLS actuales
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

-- 3. Eliminar TODAS las políticas existentes para empezar limpio
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

-- 4. OPCIÓN 1: Deshabilitar RLS completamente (MÁS SIMPLE - RECOMENDADO si no necesitas seguridad por fila)
-- Si tu aplicación maneja la seguridad a nivel de aplicación, puedes deshabilitar RLS
ALTER TABLE notificaciones DISABLE ROW LEVEL SECURITY;

-- Si deshabilitaste RLS, las siguientes políticas NO son necesarias
-- Solo continúa si quieres mantener RLS habilitado

-- 5. OPCIÓN 2: Habilitar RLS pero con políticas permisivas (Si prefieres mantener RLS habilitado)
-- Descomenta estas líneas si quieres usar RLS en lugar de deshabilitarlo
-- ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- 6. Política permisiva para SELECT (permitir leer todas las notificaciones)
-- IMPORTANTE: Como no usamos Supabase Auth, permitimos acceso a anon
-- Si quieres restringir, puedes filtrar por alguna condición en el frontend
/*
CREATE POLICY "Permitir lectura de notificaciones"
ON notificaciones
FOR SELECT
TO anon, authenticated
USING (true); -- Permitir leer todas las notificaciones
*/

-- 7. Política permisiva para INSERT (permitir insertar notificaciones)
/*
CREATE POLICY "Permitir inserción de notificaciones"
ON notificaciones
FOR INSERT
TO anon, authenticated
WITH CHECK (true); -- Permitir insertar notificaciones
*/

-- 8. Política permisiva para UPDATE (permitir actualizar notificaciones - marcar como leídas)
/*
CREATE POLICY "Permitir actualización de notificaciones"
ON notificaciones
FOR UPDATE
TO anon, authenticated
USING (true) -- Permitir actualizar cualquier notificación
WITH CHECK (true); -- Permitir actualizar a cualquier valor
*/

-- 9. Verificar que las políticas se crearon correctamente (si usaste la opción 2)
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'notificaciones';

-- 10. Verificar el estado de RLS en la tabla
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'notificaciones';

-- 11. Test: Verificar que se pueden leer notificaciones
SELECT COUNT(*) as total_notificaciones
FROM notificaciones;

-- 12. Verificar notificaciones recientes
SELECT 
    id_notificacion,
    id_destinatario,
    tipo_notificacion,
    mensaje,
    fecha_enviada,
    leida
FROM notificaciones
ORDER BY fecha_enviada DESC
LIMIT 10;

-- 13. Verificar que los usuarios destinatarios existen
SELECT 
    n.id_notificacion,
    n.id_destinatario,
    n.tipo_notificacion,
    u.id_usuario,
    u.nombre_completo,
    u.tipo_usuario
FROM notificaciones n
LEFT JOIN usuarios u ON u.id_usuario = n.id_destinatario
ORDER BY n.fecha_enviada DESC
LIMIT 10;

-- NOTA FINAL:
-- Si eliges la OPCIÓN 1 (deshabilitar RLS), la tabla notificaciones será accesible
-- sin restricciones de seguridad a nivel de fila. La seguridad debe manejarse
-- a nivel de aplicación en el frontend y backend.
--
-- Si eliges la OPCIÓN 2 (políticas permisivas), tendrás RLS habilitado pero con
-- políticas que permiten todas las operaciones. Esto es útil si en el futuro
-- quieres restringir el acceso agregando condiciones a las políticas.
--
-- RECOMENDACIÓN: Usa la OPCIÓN 1 (deshabilitar RLS) ya que tu sistema maneja
-- la autenticación a nivel de aplicación y no usa Supabase Auth directamente.
