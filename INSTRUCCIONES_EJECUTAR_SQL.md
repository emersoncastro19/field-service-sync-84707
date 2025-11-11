# Instrucciones para Ejecutar el SQL Correcto

## Problema

El error `syntax error at or near "NOT"` ocurre porque PostgreSQL no soporta `CREATE POLICY IF NOT EXISTS`. 

## Solución

He creado un archivo SQL corregido: **`SOLUCION_SIMPLE_RLS.sql`**

## Pasos para Ejecutar

### 1. Abre el SQL Editor en Supabase

1. Ve a tu proyecto en Supabase
2. Haz clic en **SQL Editor** en el menú lateral
3. Haz clic en **New Query**

### 2. Copia y Pega el SQL

Abre el archivo **`SOLUCION_SIMPLE_RLS.sql`** y copia todo su contenido, luego pégalo en el SQL Editor.

**O directamente copia esto:**

```sql
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Permitir insertar notificaciones (desarrollo)" ON notificaciones;
DROP POLICY IF EXISTS "Permitir ver todas las notificaciones (desarrollo)" ON notificaciones;
DROP POLICY IF EXISTS "Permitir actualizar todas las notificaciones (desarrollo)" ON notificaciones;
DROP POLICY IF EXISTS "Permitir insertar notificaciones para usuarios autenticados" ON notificaciones;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias notificaciones" ON notificaciones;

-- Crear las políticas permisivas para desarrollo

-- Política para INSERT
CREATE POLICY "Permitir insertar notificaciones (desarrollo)"
ON notificaciones
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para SELECT
CREATE POLICY "Permitir ver todas las notificaciones (desarrollo)"
ON notificaciones
FOR SELECT
TO authenticated
USING (true);

-- Política para UPDATE
CREATE POLICY "Permitir actualizar todas las notificaciones (desarrollo)"
ON notificaciones
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

### 3. Ejecuta el SQL

1. Haz clic en el botón **Run** (o presiona `Ctrl+Enter`)
2. Deberías ver un mensaje de éxito

### 4. Verifica que las Políticas se Crearon

Ejecuta esta consulta para verificar:

```sql
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'notificaciones'
ORDER BY cmd, policyname;
```

Deberías ver 3 políticas:
- `Permitir insertar notificaciones (desarrollo)` - cmd: INSERT
- `Permitir ver todas las notificaciones (desarrollo)` - cmd: SELECT  
- `Permitir actualizar todas las notificaciones (desarrollo)` - cmd: UPDATE

### 5. Prueba el Sistema

1. Ve a tu aplicación
2. Intenta asignar un técnico desde el módulo de coordinador
3. Abre la consola del navegador (F12) y revisa los logs
4. Verifica en Supabase que las notificaciones se hayan insertado:

```sql
SELECT * FROM notificaciones ORDER BY fecha_enviada DESC LIMIT 10;
```

## ¿Qué Hace Este Script?

1. **Elimina políticas existentes** (si las hay) para evitar conflictos
2. **Crea 3 políticas nuevas**:
   - **INSERT**: Permite insertar notificaciones a usuarios autenticados
   - **SELECT**: Permite ver todas las notificaciones a usuarios autenticados
   - **UPDATE**: Permite actualizar notificaciones a usuarios autenticados

Estas políticas son **permisivas** y son adecuadas para desarrollo. Permiten que cualquier usuario autenticado pueda insertar, ver y actualizar notificaciones.

## Si Sigue Sin Funcionar

1. **Verifica que las políticas se crearon correctamente:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'notificaciones';
   ```

2. **Revisa la consola del navegador:**
   - Abre F12 en tu navegador
   - Busca errores relacionados con RLS o permisos
   - Los errores de RLS suelen tener código `PGRST116`

3. **Verifica que el usuario esté autenticado:**
   - Asegúrate de estar logueado en el sistema
   - Verifica que la sesión no haya expirado

4. **Prueba insertar manualmente:**
   ```sql
   INSERT INTO notificaciones (
       id_orden,
       id_destinatario,
       tipo_notificacion,
       canal,
       mensaje,
       fecha_enviada,
       leida
   ) VALUES (
       1,  -- Cambiar por un id_orden real o NULL
       1,  -- Cambiar por un id_usuario real
       'Prueba',
       'Sistema_Interno',
       'Notificación de prueba',
       NOW(),
       false
   );
   ```

## Archivos Disponibles

- **`SOLUCION_SIMPLE_RLS.sql`** - Script SQL corregido y listo para usar
- **`CREAR_POLITICAS_RLS_NOTIFICACIONES.sql`** - Script completo con opciones (también corregido)
- **`SOLUCION_RAPIDA_RLS.md`** - Guía rápida de solución
- **`VERIFICAR_RLS_NOTIFICACIONES.md`** - Guía detallada de verificación

## Nota Importante

Después de ejecutar el script, las notificaciones deberían funcionar correctamente. Si aún hay problemas, revisa los logs de la consola del navegador para identificar el error exacto.


