# Guía Paso a Paso: Crear Política de Storage

## 📋 Opción Recomendada: "Get started quickly"

### Paso 1: Seleccionar la Plantilla

1. **Click en "Get started quickly"** (la primera opción con el ícono de cuadrícula)
2. Esto te llevará a una pantalla con plantillas predefinidas

### Paso 2: Seleccionar la Plantilla Correcta

Busca y selecciona una de estas plantillas:

- **"Allow public uploads"** o **"Permitir subidas públicas"** (si existe)
- **"Allow authenticated uploads"** o **"Permitir subidas autenticadas"**
- Si no hay una plantilla específica, busca **"Allow INSERT"** o **"Permitir INSERT"**

### Paso 3: Configurar la Política

Si usas una plantilla, deberías ver campos como:

- **Policy name:** `Permitir subir archivos` (o el nombre que prefieras)
- **Allowed operation:** `INSERT` (debe estar seleccionado)
- **Target roles:** 
  - Si usas autenticación Supabase: selecciona `authenticated`
  - Si NO usas autenticación Supabase: selecciona `anon`
- **Bucket:** Debe estar seleccionado `documentacion-servicios`

### Paso 4: Guardar la Política

1. Click en **"Save"** o **"Guardar"**
2. La política debería aparecer en la lista

---

## 🔧 Opción Alternativa: "For full customization"

Si prefieres crear desde cero o la plantilla no funciona:

### Paso 1: Seleccionar "For full customization"

1. **Click en "For full customization"** (la segunda opción con el ícono de lápiz)
2. Esto te llevará a un editor de SQL

### Paso 2: Configurar la Política

En el editor, deberías ver algo como:

```sql
CREATE POLICY "nombre_de_la_politica"
ON storage.objects
FOR INSERT
TO authenticated  -- o 'anon' si no usas autenticación
USING (bucket_id = 'documentacion-servicios')
WITH CHECK (bucket_id = 'documentacion-servicios');
```

### Paso 3: Personalizar

1. **Policy name:** Cambia `nombre_de_la_politica` por `Permitir subir archivos`
2. **Operation:** Asegúrate de que diga `INSERT`
3. **Target roles:** 
   - Si usas autenticación Supabase: `authenticated`
   - Si NO usas autenticación: `anon`
4. **Bucket ID:** Debe ser `documentacion-servicios`

### Paso 4: Guardar

1. Click en **"Save"** o **"Guardar"**
2. La política debería crearse

---

## ✅ Verificar que Funcionó

Después de crear la política:

1. **Deberías ver la política en la lista** de políticas del bucket
2. **Intenta subir una imagen** en la aplicación
3. **Revisa la consola del navegador** - deberías ver:
   - `✅ X imagen(es) subida(s) correctamente`
   - `✅ URLs de imágenes guardadas en la tabla imagenes_servicio`

---

## 🔍 Si Necesitas Crear una Segunda Política (para leer archivos)

Repite el proceso pero esta vez:

- **Policy name:** `Permitir leer archivos`
- **Allowed operation:** `SELECT`
- **Target roles:** `authenticated`, `anon` (ambos)

---

## 📝 Nota Importante

**¿Usas autenticación de Supabase o solo localStorage?**

- **Si usas autenticación de Supabase:** Usa `authenticated` en las políticas
- **Si solo usas localStorage (sin Supabase Auth):** Usa `anon` en las políticas

Para verificar, revisa tu código en `src/backend/config/supabaseClient.ts`. Si solo usas `supabaseAnonKey` y no hay sesión de Supabase Auth, usa `anon`.






