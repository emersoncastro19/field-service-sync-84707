# Configurar Storage desde el Dashboard de Supabase

## ⚠️ Importante

Las políticas de Storage en Supabase **NO se pueden gestionar directamente desde SQL**. Debes usar el Dashboard de Supabase.

## ✅ Solución: Configurar desde el Dashboard

### Paso 1: Hacer el Bucket Público (Solución Más Simple)

1. **Ve a tu proyecto en Supabase**
2. **Navega a Storage → Buckets**
3. **Busca el bucket `documentacion-servicios`**
4. **Click en el bucket para abrirlo**
5. **En la sección "Settings" o "Configuración":**
   - Marca la opción **"Public bucket"** ✅
   - Click en **"Save"** o **"Guardar"**

**Esto hará que:**
- ✅ Cualquier usuario autenticado pueda subir archivos
- ✅ Cualquier usuario pueda leer (ver) los archivos
- ✅ No necesitas configurar políticas RLS manualmente

### Paso 2: Si Necesitas Políticas Más Restrictivas

Si quieres controlar quién puede subir/leer archivos, puedes crear políticas desde el Dashboard:

1. **Ve a Storage → Buckets → `documentacion-servicios`**
2. **Click en la pestaña "Policies"**
3. **Click en "New Policy"**
4. **Crea las siguientes políticas:**

#### Política 1: Permitir INSERT (Subir archivos)
- **Policy name:** `Permitir subir archivos`
- **Allowed operation:** `INSERT`
- **Policy definition:**
  ```sql
  (bucket_id = 'documentacion-servicios')
  ```
- **Policy check:**
  ```sql
  (bucket_id = 'documentacion-servicios')
  ```

#### Política 2: Permitir SELECT (Leer archivos)
- **Policy name:** `Permitir leer archivos`
- **Allowed operation:** `SELECT`
- **Policy definition:**
  ```sql
  (bucket_id = 'documentacion-servicios')
  ```
- **Policy check:**
  ```sql
  (bucket_id = 'documentacion-servicios')
  ```

## 🔍 Verificar que Funciona

Después de hacer el bucket público:

1. **Ejecuta este query en SQL Editor:**
   ```sql
   SELECT 
       name,
       public,
       CASE 
           WHEN public THEN '✅ Bucket es público'
           ELSE '❌ Bucket es privado'
       END AS estado
   FROM storage.buckets
   WHERE name = 'documentacion-servicios';
   ```

2. **Debería mostrar:** `✅ Bucket es público`

3. **Intenta subir una imagen en la aplicación**

4. **Revisa la consola del navegador** - deberías ver:
   - `✅ X imagen(es) subida(s) correctamente`
   - `✅ URLs de imágenes guardadas en la tabla imagenes_servicio`

## 📝 Notas

- **Para desarrollo:** Hacer el bucket público es la solución más simple
- **Para producción:** Considera usar políticas RLS más restrictivas
- Las políticas de Storage son diferentes a las políticas de las tablas SQL

## 🐛 Si Aún No Funciona

1. **Verifica que el bucket existe:**
   ```sql
   SELECT name, id, public 
   FROM storage.buckets 
   WHERE name = 'documentacion-servicios';
   ```

2. **Si el bucket no existe, créalo:**
   - Ve a Storage → Buckets → "New bucket"
   - Nombre: `documentacion-servicios`
   - Marca "Public bucket"
   - Crea el bucket

3. **Verifica que el usuario está autenticado** en la aplicación






