# Seleccionar la Plantilla Correcta

## ❌ NO uses la plantilla seleccionada

La plantilla "Allow access to JPG images in a public folder to anonymous users" es **demasiado restrictiva** porque:
- Solo permite archivos JPG
- Solo permite acceso a la carpeta 'public'
- Necesitamos subir cualquier tipo de imagen (PNG, JPG, etc.)
- Necesitamos subir a cualquier carpeta dentro del bucket

## ✅ Opción 1: Buscar una Plantilla Mejor

En la lista de plantillas, busca una que diga algo como:
- **"Give users access to a folder only to authenticated users"** (y modifícala)
- **"Give access to a file to a user"** (y modifícala)
- Cualquier plantilla que NO restrinja por tipo de archivo o carpeta específica

## ✅ Opción 2: Usar "For full customization" (Recomendado)

1. **Click en "Cancel" o la X** para cerrar esta pantalla
2. **Vuelve a hacer click en "New Policy"**
3. **Selecciona "For full customization"** (la segunda opción)
4. **Usa este código SQL:**

```sql
CREATE POLICY "Permitir subir archivos"
ON storage.objects
FOR INSERT
TO anon
USING (bucket_id = 'documentacion-servicios')
WITH CHECK (bucket_id = 'documentacion-servicios');
```

5. **Guarda la política**

## ✅ Opción 3: Modificar la Plantilla Actual (Si quieres usarla)

Si quieres usar la plantilla actual pero hacerla más general:

1. **Click en "Use this template"**
2. **Modifica el código SQL** para que sea:

```sql
CREATE POLICY "Permitir subir archivos"
ON storage.objects FOR INSERT
USING (
    -- restrict bucket
    bucket_id = 'documentacion-servicios'
    -- to anonymous users
    AND auth.role() = 'anon'
)
WITH CHECK (
    -- restrict bucket
    bucket_id = 'documentacion-servicios'
    -- to anonymous users
    AND auth.role() = 'anon'
);
```

3. **Elimina las restricciones de:**
   - `storage."extension"(name) = 'jpg'` (permite cualquier tipo de archivo)
   - `LOWER((storage.foldername(name))[1]) = 'public'` (permite cualquier carpeta)

4. **Guarda la política**

## 📝 Nota Importante

**¿Usas autenticación de Supabase?**

- **Si NO usas autenticación Supabase (solo localStorage):** Usa `anon` en el código
- **Si usas autenticación Supabase:** Cambia `anon` por `authenticated`

Para verificar, revisa tu código. Si solo usas `supabaseAnonKey` sin sesión de Supabase Auth, usa `anon`.






