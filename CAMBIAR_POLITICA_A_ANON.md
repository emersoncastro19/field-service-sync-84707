# Cambiar la Política de "authenticated" a "anon"

## 🔴 Problema

La política está configurada para `authenticated`, pero tu sistema no usa autenticación Supabase (solo localStorage). Por eso sigue dando el error de RLS.

## ✅ Solución: Cambiar la Política

### Paso 1: Editar la Política Existente

1. **En Supabase, ve a Storage → Buckets → `documentacion-servicios`**
2. **En la lista de políticas, encuentra "Permitir subir archivos"**
3. **Click en los tres puntos (⋮) al final de la fila**
4. **Selecciona "Edit" o "Editar"**

### Paso 2: Cambiar Target Roles

1. **En el campo "Target roles"**, cambia de `authenticated` a `anon`
2. **En "Policy definition"**, asegúrate de que diga:
   ```sql
   bucket_id = 'documentacion-servicios' AND auth.role() = 'anon'
   ```
3. **Guarda los cambios**

### Paso 3: Verificar

Después de cambiar:

1. **Intenta subir una imagen nuevamente**
2. **Revisa la consola** - deberías ver:
   - `✅ X imagen(es) subida(s) correctamente`
   - `✅ URLs de imágenes guardadas en la tabla imagenes_servicio`

## 📝 Nota

Si prefieres crear una nueva política en lugar de editar:

1. **Crea una nueva política** con:
   - **Policy name:** `Permitir subir archivos anon`
   - **Allowed operation:** `INSERT`
   - **Target roles:** `anon`
   - **Policy definition:** `bucket_id = 'documentacion-servicios' AND auth.role() = 'anon'`

2. **Elimina la política antigua** (la que dice `authenticated`)

## 🔍 Verificar que Funcionó

Después de cambiar a `anon`, intenta subir una imagen. El error de RLS debería desaparecer.






