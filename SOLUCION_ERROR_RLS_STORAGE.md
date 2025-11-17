# Solución: Error RLS en Supabase Storage

## 🔴 Error Encontrado

```
StorageApiError: new row violates row-level security policy
```

Este error indica que las **políticas RLS (Row Level Security)** del bucket de Storage están bloqueando la subida de archivos.

## ✅ Solución: Configurar Políticas RLS

### Opción 1: Desde el Dashboard de Supabase (Recomendado)

1. **Ve a tu proyecto en Supabase**
2. **Navega a Storage → Buckets**
3. **Busca el bucket `documentacion-servicios`**
4. **Click en el bucket para abrirlo**
5. **Ve a la pestaña "Policies"**
6. **Crea las siguientes políticas:**

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

#### Política 3: Permitir UPDATE (Actualizar archivos)
- **Policy name:** `Permitir actualizar archivos`
- **Allowed operation:** `UPDATE`
- **Policy definition:**
  ```sql
  (bucket_id = 'documentacion-servicios')
  ```
- **Policy check:**
  ```sql
  (bucket_id = 'documentacion-servicios')
  ```

#### Política 4: Permitir DELETE (Eliminar archivos)
- **Policy name:** `Permitir eliminar archivos`
- **Allowed operation:** `DELETE`
- **Policy definition:**
  ```sql
  (bucket_id = 'documentacion-servicios')
  ```
- **Policy check:**
  ```sql
  (bucket_id = 'documentacion-servicios')
  ```

### Opción 2: Desde SQL Editor (Si tienes permisos de administrador)

1. **Ve a SQL Editor en Supabase**
2. **Ejecuta el script `configurar-storage-rls.sql`**
3. **Verifica que las políticas se crearon correctamente**

### Opción 3: Hacer el Bucket Público (Solo para desarrollo)

Si estás en desarrollo y quieres una solución rápida:

1. **Ve a Storage → Buckets**
2. **Click en `documentacion-servicios`**
3. **Marca la opción "Public bucket"**
4. **Guarda los cambios**

**⚠️ ADVERTENCIA:** Esto hace que todos los archivos sean públicos. Solo úsalo en desarrollo.

## 🔍 Verificar que Funciona

Después de configurar las políticas:

1. **Abre la aplicación**
2. **Abre la consola del navegador (F12)**
3. **Intenta subir una imagen nuevamente**
4. **Deberías ver:**
   - `✅ X imagen(es) subida(s) correctamente`
   - `✅ URLs de imágenes guardadas en la tabla imagenes_servicio`

## 📝 Notas Importantes

- Las políticas RLS en Storage son diferentes a las políticas RLS de las tablas
- Si usas autenticación personalizada (no Supabase Auth), puede que necesites ajustar las políticas
- Para producción, considera políticas más restrictivas que solo permitan subir archivos a usuarios específicos

## 🐛 Si Aún No Funciona

1. **Verifica que el bucket existe:**
   ```sql
   SELECT name, id, public 
   FROM storage.buckets 
   WHERE name = 'documentacion-servicios';
   ```

2. **Verifica las políticas creadas:**
   ```sql
   SELECT id, name, bucket_id, operation
   FROM storage.policies
   WHERE bucket_id = 'documentacion-servicios';
   ```

3. **Revisa los logs de la consola** para ver si hay otros errores

4. **Verifica que el usuario está autenticado** (si usas autenticación personalizada, puede que necesites usar Service Role Key)






