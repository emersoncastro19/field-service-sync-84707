# Solución: Políticas RLS Duplicadas

## Problema Identificado

Tienes **6 políticas RLS** en la tabla `notificaciones`, pero hay **duplicados**:

### Políticas con rol `{public}` (INCORRECTAS - Eliminar)
1. "Permitir inserción de notificaciones" - INSERT
2. "Permitir lectura de notificaciones" - SELECT
3. "Permitir actualización de notificaciones" - UPDATE

### Políticas con rol `{authenticated}` (CORRECTAS - Mantener)
1. "Permitir insertar notificaciones (desarrollo)" - INSERT
2. "Permitir ver todas las notificaciones (desarrollo)" - SELECT
3. "Permitir actualizar todas las notificaciones (desarrollo)" - UPDATE

## ¿Por qué eliminar las de `{public}`?

- El rol `{public}` en Supabase se refiere a usuarios **no autenticados** o anónimos
- Tu aplicación usa usuarios **autenticados**, por lo que necesitas políticas con rol `{authenticated}`
- Las políticas con `{public}` pueden causar conflictos y no funcionar correctamente

## Solución

### Paso 1: Ejecuta el Script de Limpieza

Ejecuta el archivo **`LIMPIAR_POLITICAS_RLS.sql`** en el SQL Editor de Supabase.

**O copia y pega esto directamente:**

```sql
-- Eliminar las políticas antiguas con rol {public}
DROP POLICY IF EXISTS "Permitir inserción de notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Permitir lectura de notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Permitir actualización de notificaciones" ON notificaciones;
```

### Paso 2: Verifica que Solo Quedan las Políticas Correctas

Ejecuta esta consulta:

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

**Resultado esperado:** Deberías ver solo **3 políticas**, todas con rol `{authenticated}`:
- "Permitir insertar notificaciones (desarrollo)" - INSERT
- "Permitir ver todas las notificaciones (desarrollo)" - SELECT
- "Permitir actualizar todas las notificaciones (desarrollo)" - UPDATE

### Paso 3: Prueba el Sistema

1. Ve a tu aplicación
2. Intenta asignar un técnico desde el módulo de coordinador
3. Abre la consola del navegador (F12) y revisa los logs
4. Verifica en Supabase que las notificaciones se hayan insertado:

```sql
SELECT * FROM notificaciones ORDER BY fecha_enviada DESC LIMIT 10;
```

## ¿Qué Hace el Script?

El script elimina las 3 políticas antiguas con rol `{public}` y deja solo las 3 políticas correctas con rol `{authenticated}`.

## Si Sigue Sin Funcionar

1. **Verifica que las políticas se eliminaron correctamente:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'notificaciones';
   ```
   Deberías ver solo 3 políticas, todas con `roles = {authenticated}`

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

- **`LIMPIAR_POLITICAS_RLS.sql`** - Script para eliminar políticas duplicadas
- **`SOLUCION_SIMPLE_RLS.sql`** - Script para crear políticas correctas (ya ejecutado)
- **`SOLUCION_POLITICAS_DUPLICADAS.md`** - Este archivo

## Nota Importante

Después de eliminar las políticas duplicadas, las notificaciones deberían funcionar correctamente porque:
- Las políticas con rol `{authenticated}` son las correctas para tu aplicación
- No hay conflictos entre políticas duplicadas
- Los usuarios autenticados pueden insertar, leer y actualizar notificaciones

## Resumen

✅ **Problema:** Políticas duplicadas (3 con `{public}` y 3 con `{authenticated}`)
✅ **Solución:** Eliminar las 3 políticas con `{public}`
✅ **Resultado:** Solo quedan las 3 políticas correctas con `{authenticated}`

Ejecuta el script de limpieza y prueba el sistema. Las notificaciones deberían funcionar correctamente ahora.

