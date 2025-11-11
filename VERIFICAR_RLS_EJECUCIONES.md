# Verificar Políticas RLS para Ejecuciones de Servicio

## Problema

El error "No se pudo iniciar el trabajo" puede ser causado por políticas RLS (Row Level Security) que bloquean la inserción en la tabla `ejecuciones_servicio`.

## Solución

### 1. Verificar si RLS está habilitado

Ejecuta en Supabase SQL Editor:

```sql
-- Verificar si RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'ejecuciones_servicio';
```

### 2. Verificar las políticas existentes

```sql
-- Ver todas las políticas de la tabla ejecuciones_servicio
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'ejecuciones_servicio';
```

### 3. Crear políticas RLS si no existen

Si no hay políticas o las políticas existentes bloquean las inserciones, ejecuta:

```sql
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Permitir insertar ejecuciones (desarrollo)" ON ejecuciones_servicio;
DROP POLICY IF EXISTS "Permitir ver ejecuciones (desarrollo)" ON ejecuciones_servicio;
DROP POLICY IF EXISTS "Permitir actualizar ejecuciones (desarrollo)" ON ejecuciones_servicio;

-- Habilitar RLS en la tabla ejecuciones_servicio
ALTER TABLE ejecuciones_servicio ENABLE ROW LEVEL SECURITY;

-- Política para INSERT: Permitir que usuarios autenticados inserten ejecuciones
CREATE POLICY "Permitir insertar ejecuciones (desarrollo)"
ON ejecuciones_servicio
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para SELECT: Permitir que usuarios autenticados vean ejecuciones
CREATE POLICY "Permitir ver ejecuciones (desarrollo)"
ON ejecuciones_servicio
FOR SELECT
TO authenticated
USING (true);

-- Política para UPDATE: Permitir que usuarios autenticados actualicen ejecuciones
CREATE POLICY "Permitir actualizar ejecuciones (desarrollo)"
ON ejecuciones_servicio
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

### 4. Verificar la estructura de la tabla

Asegúrate de que la tabla `ejecuciones_servicio` tenga la estructura correcta:

```sql
-- Ver la estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'ejecuciones_servicio'
ORDER BY ordinal_position;
```

La tabla debe tener al menos estas columnas:
- `id_ejecucion` (serial/primary key)
- `id_orden` (integer, not null)
- `fecha_inicio` (timestamp, nullable)
- `fecha_fin` (timestamp, nullable)
- `trabajo_realizado` (text, nullable)
- `estado_resultado` (varchar/text, nullable)
- `confirmacion_cliente` (varchar/text, nullable)

### 5. Probar la inserción manualmente

```sql
-- Probar insertar una ejecución de prueba
INSERT INTO ejecuciones_servicio (
    id_orden,
    fecha_inicio,
    estado_resultado,
    trabajo_realizado
) VALUES (
    1,  -- id_orden (cambiar por un id_orden real)
    NOW(),
    'En Proceso',
    NULL
);

-- Verificar que se insertó
SELECT * FROM ejecuciones_servicio WHERE estado_resultado = 'En Proceso' ORDER BY fecha_inicio DESC LIMIT 5;
```

## Pasos a Seguir

1. Ejecuta las consultas SQL de verificación (pasos 1-2)
2. Si no hay políticas o están incorrectas, crea las políticas correctas (paso 3)
3. Prueba insertar una ejecución manualmente (paso 5)
4. Si la inserción manual funciona pero la del sistema no, revisa los logs de la consola del navegador (F12)
5. Verifica que el usuario técnico esté autenticado correctamente

## Notas Importantes

- Las políticas con rol `{authenticated}` son las correctas para usuarios autenticados
- Si usas Supabase Auth, las políticas funcionarán automáticamente
- Si no usas Supabase Auth, puede que necesites ajustar las políticas

## Archivos Relacionados

- `src/frontend/pages/tecnico/GestionarEjecucion.tsx` - Código mejorado con logging detallado
- `VERIFICAR_RLS_EJECUCIONES.md` - Este archivo


