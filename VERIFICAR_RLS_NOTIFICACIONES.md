# Verificación de Políticas RLS para Notificaciones

## Problema
Las notificaciones no se están insertando en la base de datos. Esto puede ser causado por políticas RLS (Row Level Security) que bloquean la inserción.

## Solución

### 1. Verificar si RLS está habilitado en la tabla `notificaciones`

Ejecuta en Supabase SQL Editor:

```sql
-- Verificar si RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'notificaciones';
```

Si `rowsecurity` es `false`, RLS no está habilitado y las políticas no deberían bloquear las inserciones.

### 2. Verificar las políticas existentes

```sql
-- Ver todas las políticas de la tabla notificaciones
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
```

### 3. Crear políticas RLS si no existen

Si no hay políticas o las políticas existentes bloquean las inserciones, ejecuta:

```sql
-- Habilitar RLS en la tabla notificaciones
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Política para INSERT: Permitir que cualquier usuario autenticado inserte notificaciones
CREATE POLICY "Permitir insertar notificaciones para usuarios autenticados"
ON notificaciones
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para SELECT: Permitir que los usuarios vean solo sus propias notificaciones
CREATE POLICY "Usuarios pueden ver sus propias notificaciones"
ON notificaciones
FOR SELECT
TO authenticated
USING (id_destinatario = (SELECT id_usuario FROM usuarios WHERE id_usuario = auth.uid()::text));

-- Política para UPDATE: Permitir que los usuarios actualicen solo sus propias notificaciones
CREATE POLICY "Usuarios pueden actualizar sus propias notificaciones"
ON notificaciones
FOR UPDATE
TO authenticated
USING (id_destinatario = (SELECT id_usuario FROM usuarios WHERE id_usuario = auth.uid()::text))
WITH CHECK (id_destinatario = (SELECT id_usuario FROM usuarios WHERE id_usuario = auth.uid()::text));
```

### 4. Alternativa: Si no usas autenticación de Supabase Auth

Si tu sistema no usa `auth.uid()` de Supabase, puedes usar una política más permisiva temporalmente:

```sql
-- Política permisiva para INSERT (solo para desarrollo)
CREATE POLICY "Permitir insertar notificaciones (desarrollo)"
ON notificaciones
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política permisiva para SELECT (solo para desarrollo)
CREATE POLICY "Permitir ver todas las notificaciones (desarrollo)"
ON notificaciones
FOR SELECT
TO authenticated
USING (true);
```

### 5. Verificar la estructura de la tabla

Asegúrate de que la tabla `notificaciones` tenga la estructura correcta:

```sql
-- Ver la estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'notificaciones'
ORDER BY ordinal_position;
```

La tabla debe tener al menos estas columnas:
- `id_notificacion` (serial/primary key)
- `id_orden` (integer, nullable)
- `id_destinatario` (integer, not null)
- `tipo_notificacion` (varchar/text, not null)
- `canal` (varchar/text, not null)
- `mensaje` (text, not null)
- `fecha_enviada` (timestamp, not null)
- `leida` (boolean, default false)

### 6. Probar la inserción manualmente

```sql
-- Probar insertar una notificación de prueba
INSERT INTO notificaciones (
    id_orden,
    id_destinatario,
    tipo_notificacion,
    canal,
    mensaje,
    fecha_enviada,
    leida
) VALUES (
    1,  -- id_orden (cambiar por un id_orden real)
    1,  -- id_destinatario (cambiar por un id_usuario real)
    'Prueba',
    'Sistema_Interno',
    'Esta es una notificación de prueba',
    NOW(),
    false
);

-- Verificar que se insertó
SELECT * FROM notificaciones WHERE tipo_notificacion = 'Prueba';
```

### 7. Verificar los logs en la consola del navegador

Cuando intentas crear una notificación desde el sistema, revisa la consola del navegador (F12). Debes ver:

- Si hay errores de RLS, verás un código de error `PGRST116` o un mensaje que menciona "permission" o "RLS"
- Los logs mostrarán los datos que se intentan insertar
- Los logs mostrarán el error completo de Supabase

### 8. Solución temporal: Deshabilitar RLS (solo para desarrollo)

⚠️ **ADVERTENCIA**: Solo haz esto en desarrollo, nunca en producción.

```sql
-- Deshabilitar RLS temporalmente (solo para desarrollo)
ALTER TABLE notificaciones DISABLE ROW LEVEL SECURITY;
```

### 9. Verificar que el usuario tenga los permisos correctos

Si usas autenticación de Supabase, verifica que el usuario esté autenticado correctamente:

```sql
-- Ver el usuario actual (si usas Supabase Auth)
SELECT auth.uid(), auth.role();
```

## Pasos a seguir

1. Ejecuta las consultas SQL de verificación (pasos 1-3)
2. Si no hay políticas o están incorrectas, crea las políticas correctas (paso 3 o 4)
3. Prueba insertar una notificación manualmente (paso 6)
4. Si la inserción manual funciona pero la del sistema no, revisa los logs de la consola (paso 7)
5. Si todo lo anterior falla, verifica la estructura de la tabla (paso 5)

## Contacto

Si después de seguir estos pasos las notificaciones siguen sin insertarse, verifica:
- Los logs de la consola del navegador
- Los logs de Supabase (Dashboard > Logs)
- Que los `id_usuario` del cliente y técnico sean correctos
- Que la conexión a Supabase esté funcionando correctamente

