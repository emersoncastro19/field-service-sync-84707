# Solución Rápida: RLS Habilitado en Notificaciones

## Problema Identificado

Has ejecutado la consulta y el resultado muestra que **RLS está habilitado** (`rowsecurity = true`). Esto significa que **necesitas crear políticas RLS** para que las notificaciones se puedan insertar.

## Solución Rápida (3 pasos)

### Paso 1: Ejecuta el Script SQL

1. Abre el **SQL Editor** en Supabase
2. Abre el archivo `CREAR_POLITICAS_RLS_NOTIFICACIONES.sql`
3. **Ejecuta la OPCIÓN 1** (Políticas Permisivas para Desarrollo)
4. Esto creará las políticas necesarias para insertar y leer notificaciones

### Paso 2: Verifica que las Políticas se Crearon

Ejecuta esta consulta en el SQL Editor:

```sql
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'notificaciones';
```

Deberías ver al menos estas políticas:
- `Permitir insertar notificaciones (desarrollo)` - cmd: INSERT
- `Permitir ver todas las notificaciones (desarrollo)` - cmd: SELECT
- `Permitir actualizar todas las notificaciones (desarrollo)` - cmd: UPDATE

### Paso 3: Prueba la Inserción

1. Intenta asignar un técnico desde el sistema
2. Abre la consola del navegador (F12)
3. Revisa los logs para ver si las notificaciones se insertan correctamente
4. Verifica en Supabase que las notificaciones aparezcan:

```sql
SELECT * FROM notificaciones ORDER BY fecha_enviada DESC LIMIT 10;
```

## ¿Qué Hace el Script?

El script crea **3 políticas RLS**:

1. **INSERT**: Permite que cualquier usuario autenticado inserte notificaciones
2. **SELECT**: Permite que cualquier usuario autenticado vea todas las notificaciones
3. **UPDATE**: Permite que cualquier usuario autenticado actualice notificaciones

Estas políticas son **permisivas** y son adecuadas para desarrollo. En producción, deberías usar políticas más restrictivas (ver OPCIÓN 2 en el script).

## Si Sigue Sin Funcionar

1. **Verifica que el usuario esté autenticado:**
   - Asegúrate de estar logueado en el sistema
   - Verifica que la sesión no haya expirado

2. **Revisa los logs de la consola:**
   - Abre la consola del navegador (F12)
   - Busca errores relacionados con RLS o permisos
   - Los errores de RLS suelen tener código `PGRST116` o mencionar "permission"

3. **Verifica la estructura de la tabla:**
   ```sql
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'notificaciones';
   ```

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

## Archivos de Referencia

- `CREAR_POLITICAS_RLS_NOTIFICACIONES.sql` - Script completo con opciones
- `VERIFICAR_RLS_NOTIFICACIONES.md` - Guía detallada de verificación
- `RESUMEN_CAMBIOS_NOTIFICACIONES.md` - Resumen de todos los cambios

## Próximos Pasos

1. ✅ Ejecuta el script SQL (OPCIÓN 1)
2. ✅ Verifica que las políticas se crearon
3. ✅ Prueba asignar un técnico desde el sistema
4. ✅ Verifica que las notificaciones aparezcan en Supabase
5. ✅ Revisa la campana de notificaciones en el sistema

## Nota Importante

Si después de ejecutar el script las notificaciones **aún no se insertan**, el problema podría ser:

1. **El usuario no está autenticado correctamente** - Verifica la sesión
2. **Los tipos de datos son incorrectos** - Verifica que `id_destinatario` sea un número
3. **Hay errores en la aplicación** - Revisa la consola del navegador
4. **La conexión a Supabase falla** - Verifica la configuración de Supabase

En todos los casos, los logs detallados en la consola te ayudarán a identificar el problema exacto.

