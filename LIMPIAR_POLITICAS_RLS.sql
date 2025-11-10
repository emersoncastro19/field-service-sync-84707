-- ============================================================
-- LIMPIAR POLÍTICAS RLS DUPLICADAS
-- ============================================================
-- Este script elimina las políticas antiguas con rol {public}
-- y deja solo las políticas correctas con rol {authenticated}
-- ============================================================

-- Eliminar las políticas antiguas con rol {public} (no funcionan correctamente)
DROP POLICY IF EXISTS "Permitir inserción de notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Permitir lectura de notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Permitir actualización de notificaciones" ON notificaciones;

-- Las políticas con rol {authenticated} ya están creadas y son las correctas:
-- - "Permitir insertar notificaciones (desarrollo)" - INSERT - {authenticated}
-- - "Permitir ver todas las notificaciones (desarrollo)" - SELECT - {authenticated}
-- - "Permitir actualizar todas las notificaciones (desarrollo)" - UPDATE - {authenticated}

-- ============================================================
-- VERIFICACIÓN: Ver las políticas que quedan
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
-- RESULTADO ESPERADO:
-- Deberías ver solo 3 políticas, todas con rol {authenticated}:
-- 1. "Permitir insertar notificaciones (desarrollo)" - INSERT
-- 2. "Permitir ver todas las notificaciones (desarrollo)" - SELECT
-- 3. "Permitir actualizar todas las notificaciones (desarrollo)" - UPDATE
-- ============================================================

