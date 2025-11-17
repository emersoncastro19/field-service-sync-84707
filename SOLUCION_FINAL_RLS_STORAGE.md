# Solución Final: Error RLS en Storage Persiste

## 🔴 Problema

Aunque el bucket está configurado como público, el error persiste:
```
StorageApiError: new row violates row-level security policy
```

## ✅ Soluciones Adicionales

### Solución 1: Verificar y Crear Políticas desde el Dashboard

Aunque el bucket es público, Supabase puede requerir políticas explícitas para operaciones INSERT:

1. **Ve a Supabase → Storage → Buckets → `documentacion-servicios`**
2. **Click en la pestaña "Policies"**
3. **Verifica si hay políticas existentes**
4. **Si NO hay políticas, crea una nueva:**

   - **Policy name:** `Permitir subir archivos`
   - **Allowed operation:** `INSERT`
   - **Target roles:** `authenticated` (o `anon` si no usas autenticación)
   - **Policy definition:**
     ```sql
     (bucket_id = 'documentacion-servicios')
     ```
   - **Policy check:**
     ```sql
     (bucket_id = 'documentacion-servicios')
     ```

5. **Crea otra política para SELECT (leer):**
   - **Policy name:** `Permitir leer archivos`
   - **Allowed operation:** `SELECT`
   - **Target roles:** `authenticated`, `anon`
   - **Policy definition:**
     ```sql
     (bucket_id = 'documentacion-servicios')
     ```
   - **Policy check:**
     ```sql
     (bucket_id = 'documentacion-servicios')
     ```

### Solución 2: Deshabilitar RLS Completamente (Solo Desarrollo)

Si estás en desarrollo y quieres una solución rápida:

1. **Ve a Supabase → Storage → Buckets → `documentacion-servicios`**
2. **En la configuración del bucket, busca "RLS" o "Row Level Security"**
3. **Deshabilita RLS temporalmente** (si la opción está disponible)

**⚠️ ADVERTENCIA:** Esto solo es para desarrollo. En producción, usa políticas específicas.

### Solución 3: Verificar Autenticación

El error puede ocurrir si el usuario no está autenticado correctamente. Verifica:

1. **Abre la consola del navegador (F12)**
2. **Ve a la pestaña "Application" o "Aplicación"**
3. **Busca "Local Storage" o "Session Storage"**
4. **Verifica que hay una sesión de Supabase activa**

Si no hay sesión, el problema es de autenticación, no de Storage.

### Solución 4: Usar Service Role Key (Solo Backend)

Si el problema persiste, puedes crear una función Edge Function que use Service Role Key para subir las imágenes. Esto requiere:

1. Crear una Edge Function en Supabase
2. Usar Service Role Key (nunca en el frontend)
3. Llamar a la función desde el frontend

**Nota:** Esta es una solución más compleja y solo debería usarse si las otras no funcionan.

## 🔍 Verificar Estado Actual

Ejecuta este query para verificar el estado completo del bucket:

```sql
SELECT 
    name,
    id,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at,
    updated_at
FROM storage.buckets
WHERE name = 'documentacion-servicios';
```

## 📝 Pasos Recomendados

1. **Primero:** Intenta la Solución 1 (crear políticas desde Dashboard)
2. **Si no funciona:** Verifica la autenticación (Solución 3)
3. **Si aún no funciona:** Considera la Solución 4 (Edge Function)

## 🐛 Debug Adicional

Agrega este código temporalmente en `GestionarEjecucion.tsx` para ver más detalles del error:

```typescript
catch (err: any) {
  console.error('Error subiendo imagen:', err);
  console.error('Error completo:', JSON.stringify(err, null, 2));
  console.error('Mensaje:', err.message);
  console.error('Status:', err.status);
  console.error('Status Text:', err.statusText);
  erroresSubida++;
}
```

Esto te dará más información sobre qué está fallando exactamente.






