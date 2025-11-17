# Completar el Formulario de Política

## Paso a Paso para Crear la Política

### 1. Policy name (Nombre de la política)
- **Escribe:** `Permitir subir archivos`
- Este es el nombre que identificará la política

### 2. Allowed operation (Operación permitida)
- **Marca la casilla:** `INSERT` ✅
- Esta es la operación que permite subir archivos
- Puedes dejar las otras (SELECT, UPDATE, DELETE) sin marcar por ahora

### 3. Target roles (Roles objetivo)
- **Click en el dropdown** que dice "Defaults to all (public) roles if none selected"
- **Selecciona:** `anon` (si NO usas autenticación Supabase)
- **O selecciona:** `authenticated` (si SÍ usas autenticación Supabase)

**¿Cómo saber cuál usar?**
- Si tu sistema solo usa localStorage (sin Supabase Auth), usa `anon`
- Si tu sistema usa Supabase Auth para autenticación, usa `authenticated`

### 4. Policy definition (Definición de la política)
El código actual muestra:
```sql
bucket_id = 'documentacion-servicios'
```

**Reemplázalo completamente con este código:**

```sql
bucket_id = 'documentacion-servicios' AND auth.role() = 'anon'
```

**O si usas autenticación Supabase, usa:**
```sql
bucket_id = 'documentacion-servicios' AND auth.role() = 'authenticated'
```

### 5. Guardar
- **Click en el botón verde "Review"** (o "Revisar")
- Esto te llevará a una pantalla de revisión
- **Confirma y guarda** la política

## ✅ Verificación

Después de crear la política:

1. **Deberías ver la política en la lista** de políticas del bucket
2. **Intenta subir una imagen** en la aplicación
3. **Revisa la consola del navegador** - deberías ver:
   - `✅ X imagen(es) subida(s) correctamente`
   - `✅ URLs de imágenes guardadas en la tabla imagenes_servicio`

## 📝 Resumen de Configuración

- **Policy name:** `Permitir subir archivos`
- **Allowed operation:** `INSERT` ✅
- **Target roles:** `anon` (o `authenticated` según tu caso)
- **Policy definition:** `bucket_id = 'documentacion-servicios' AND auth.role() = 'anon'`






