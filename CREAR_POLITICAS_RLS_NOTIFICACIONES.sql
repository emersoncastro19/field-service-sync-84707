-- ============================================================
-- SCRIPT PARA CREAR POLÍTICAS RLS PARA LA TABLA NOTIFICACIONES
-- ============================================================
-- Este script crea las políticas necesarias para que las notificaciones
-- se puedan insertar y leer correctamente en Supabase.
--
-- IMPORTANTE: Ejecuta este script en el SQL Editor de Supabase
-- ============================================================

-- Paso 1: Verificar las políticas existentes
-- Ejecuta esto primero para ver qué políticas ya existen
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'notificaciones';

-- Paso 2: Ya no es necesario, las políticas se eliminan automáticamente antes de crearlas

-- ============================================================
-- OPCIÓN 1: Políticas Permisivas (RECOMENDADO PARA DESARROLLO)
-- ============================================================
-- Estas políticas permiten que cualquier usuario autenticado
-- pueda insertar y ver notificaciones. Útil para desarrollo.

-- PASO 1: Eliminar políticas existentes si existen (para evitar errores)
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
-- (En producción, deberías restringir esto para que solo vean sus propias notificaciones)
CREATE POLICY "Permitir ver todas las notificaciones (desarrollo)"
ON notificaciones
FOR SELECT
TO authenticated
USING (true);

-- Política para UPDATE: Permitir que los usuarios autenticados actualicen cualquier notificación
-- (En producción, deberías restringir esto para que solo actualicen sus propias notificaciones)
CREATE POLICY "Permitir actualizar todas las notificaciones (desarrollo)"
ON notificaciones
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================
-- OPCIÓN 2: Políticas Restrictivas (PARA PRODUCCIÓN)
-- ============================================================
-- Estas políticas son más seguras y solo permiten que los usuarios
-- vean y actualicen sus propias notificaciones.
-- COMENTA LA OPCIÓN 1 Y DESCOMENTA ESTA SI QUIERES USAR ESTA OPCIÓN

/*
-- PASO 1: Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Permitir insertar notificaciones para usuarios autenticados" ON notificaciones;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias notificaciones" ON notificaciones;

-- PASO 2: Crear las políticas restrictivas para producción

-- Política para INSERT: Permitir que cualquier usuario autenticado inserte notificaciones
CREATE POLICY "Permitir insertar notificaciones para usuarios autenticados"
ON notificaciones
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para SELECT: Permitir que los usuarios vean solo sus propias notificaciones
-- NOTA: Esto asume que usas auth.uid() de Supabase Auth
-- Si no usas Supabase Auth, necesitarás ajustar esta política
CREATE POLICY "Usuarios pueden ver sus propias notificaciones"
ON notificaciones
FOR SELECT
TO authenticated
USING (
    id_destinatario IN (
        SELECT id_usuario::integer 
        FROM usuarios 
        WHERE id_usuario::text = auth.uid()::text
    )
    OR
    -- También permitir si el id_destinatario coincide directamente con auth.uid()
    id_destinatario::text = auth.uid()::text
);

-- Política para UPDATE: Permitir que los usuarios actualicen solo sus propias notificaciones
CREATE POLICY "Usuarios pueden actualizar sus propias notificaciones"
ON notificaciones
FOR UPDATE
TO authenticated
USING (
    id_destinatario IN (
        SELECT id_usuario::integer 
        FROM usuarios 
        WHERE id_usuario::text = auth.uid()::text
    )
    OR
    id_destinatario::text = auth.uid()::text
)
WITH CHECK (
    id_destinatario IN (
        SELECT id_usuario::integer 
        FROM usuarios 
        WHERE id_usuario::text = auth.uid()::text
    )
    OR
    id_destinatario::text = auth.uid()::text
);
*/

-- ============================================================
-- OPCIÓN 3: Deshabilitar RLS (SOLO PARA DESARROLLO/TESTING)
-- ============================================================
-- ⚠️ ADVERTENCIA: Solo usa esto en desarrollo, NUNCA en producción
-- Esto deshabilita completamente RLS para la tabla notificaciones
/*
ALTER TABLE notificaciones DISABLE ROW LEVEL SECURITY;
*/

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
-- Después de ejecutar las políticas, verifica que se hayan creado correctamente:

SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'Tiene condición USING'
        ELSE 'Sin condición USING'
    END as using_condition,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Tiene condición WITH CHECK'
        ELSE 'Sin condición WITH CHECK'
    END as with_check_condition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'notificaciones'
ORDER BY cmd, policyname;

-- ============================================================
-- PRUEBA DE INSERCIÓN
-- ============================================================
-- Prueba insertar una notificación para verificar que las políticas funcionen
-- NOTA: Ajusta los valores según tus datos reales

/*
INSERT INTO notificaciones (
    id_orden,
    id_destinatario,
    tipo_notificacion,
    canal,
    mensaje,
    fecha_enviada,
    leida
) VALUES (
    1,  -- id_orden (cambiar por un id_orden real o NULL)
    1,  -- id_destinatario (cambiar por un id_usuario real)
    'Prueba RLS',
    'Sistema_Interno',
    'Esta es una notificación de prueba para verificar RLS',
    NOW(),
    false
);

-- Verificar que se insertó
SELECT * FROM notificaciones WHERE tipo_notificacion = 'Prueba RLS';

-- Limpiar la prueba (opcional)
-- DELETE FROM notificaciones WHERE tipo_notificacion = 'Prueba RLS';
*/

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================
-- 1. Si usas Supabase Auth (auth.uid()), las políticas restrictivas funcionarán
--    correctamente. Si no usas Supabase Auth, usa la OPCIÓN 1 (permisiva).
--
-- 2. Para desarrollo, es recomendable usar la OPCIÓN 1 (políticas permisivas)
--    para evitar problemas mientras desarrollas.
--
-- 3. Para producción, usa la OPCIÓN 2 (políticas restrictivas) para mayor seguridad.
--
-- 4. Si después de crear las políticas las notificaciones aún no se insertan,
--    verifica:
--    - Que el usuario esté autenticado correctamente
--    - Que los tipos de datos sean correctos (id_destinatario debe ser integer)
--    - Que no haya errores en la consola del navegador
--    - Que la conexión a Supabase esté funcionando correctamente

