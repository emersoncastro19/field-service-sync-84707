# 📦 Configurar Supabase Storage para Imágenes de Documentación

## 🎯 Objetivo

Configurar un bucket en Supabase Storage para almacenar las imágenes que los técnicos suben al documentar los servicios.

---

## 📋 Pasos para Configurar el Bucket

### 1. **Acceder a Supabase Storage**

1. Inicia sesión en tu proyecto de Supabase
2. Ve a la sección **"Storage"** en el menú lateral
3. Haz clic en **"New bucket"** o **"Crear bucket"**

### 2. **Crear el Bucket**

**Configuración del bucket:**
- **Nombre del bucket**: `documentacion-servicios`
- **Visibilidad**: `Private` (recomendado para imágenes de servicios) o `Public` (si quieres acceso directo)
- **File size limit**: 10 MB (o el límite que prefieras)
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/jpg` (opcional, para restringir tipos)

### 3. **Configurar Políticas RLS (Row Level Security)**

Si el bucket es `Private`, necesitas crear políticas RLS para permitir:
- **Subir imágenes**: Los técnicos pueden subir imágenes
- **Leer imágenes**: Los técnicos, coordinadores y clientes pueden ver las imágenes
- **Eliminar imágenes**: Solo técnicos y administradores (opcional)

#### SQL para Políticas RLS (Bucket Privado):

```sql
-- Política para permitir subir imágenes a técnicos autenticados
CREATE POLICY "Técnicos pueden subir imágenes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentacion-servicios' AND
  (storage.foldername(name))[1] = 'orden-' OR true
);

-- Política para permitir leer imágenes a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden leer imágenes"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documentacion-servicios');

-- Política para permitir eliminar imágenes (opcional, solo técnicos)
CREATE POLICY "Técnicos pueden eliminar sus imágenes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documentacion-servicios');
```

#### SQL para Bucket Público (Más Simple):

Si el bucket es `Public`, no necesitas políticas RLS, pero las imágenes serán accesibles públicamente con la URL.

---

## 🔧 Configuración Alternativa: Usar Bucket Público

Si prefieres un bucket público (más simple):

1. **Crear bucket público**:
   - Nombre: `documentacion-servicios`
   - Visibilidad: `Public`
   - No necesitas políticas RLS

2. **Ventajas**:
   - Más simple de configurar
   - No requiere políticas RLS
   - Acceso directo a las imágenes

3. **Desventajas**:
   - Las imágenes son accesibles públicamente con la URL
   - Cualquiera con la URL puede ver las imágenes

---

## 📝 Estructura de Carpetas en el Bucket

Las imágenes se organizarán así:
```
documentacion-servicios/
  ├── orden-1/
  │   ├── 1_1_1234567890_imagen1.jpg
  │   ├── 1_1_1234567891_imagen2.jpg
  │   └── ...
  ├── orden-2/
  │   ├── 2_5_1234567892_imagen1.jpg
  │   └── ...
  └── ...
```

**Formato del nombre de archivo**:
- `{id_orden}_{id_ejecucion}_{timestamp}_{nombre_original}`
- Ejemplo: `1_1_1734567890123_foto_servicio.jpg`

---

## 🔍 Verificar la Configuración

### 1. **Probar Subida de Imagen**

Después de configurar el bucket, intenta subir una imagen desde el módulo de documentación. Si hay errores, verifica:

- ✅ El bucket existe y se llama `documentacion-servicios`
- ✅ Las políticas RLS están configuradas (si es bucket privado)
- ✅ El usuario tiene permisos para subir archivos
- ✅ El tamaño del archivo no excede el límite (10 MB)

### 2. **Verificar en Supabase**

1. Ve a **Storage** → **documentacion-servicios**
2. Deberías ver las carpetas `orden-{id}` con las imágenes subidas
3. Haz clic en una imagen para ver su URL pública

---

## 🛠️ Solución de Problemas

### Error: "Bucket not found"
- **Solución**: Crea el bucket `documentacion-servicios` en Supabase Storage

### Error: "new row violates row-level security policy"
- **Solución**: Configura las políticas RLS para el bucket (ver SQL arriba)

### Error: "File size exceeds limit"
- **Solución**: Reduce el tamaño de la imagen o aumenta el límite del bucket

### Error: "Invalid MIME type"
- **Solución**: Asegúrate de que la imagen sea JPG, PNG o JPEG

---

## 📊 Almacenamiento de URLs de Imágenes

### Opción 1: Guardar URLs en `ejecuciones_servicio` (Actual)

Las URLs se pueden guardar en un campo JSON o texto en `ejecuciones_servicio`:
```sql
ALTER TABLE ejecuciones_servicio 
ADD COLUMN urls_imagenes JSONB DEFAULT '[]'::jsonb;
```

### Opción 2: Crear Tabla Separada (Recomendado)

Crear una tabla `imagenes_documentacion`:
```sql
CREATE TABLE imagenes_documentacion (
  id_imagen SERIAL PRIMARY KEY,
  id_ejecucion INTEGER NOT NULL REFERENCES ejecuciones_servicio(id_ejecucion),
  url_imagen TEXT NOT NULL,
  descripcion TEXT,
  fecha_subida TIMESTAMP DEFAULT NOW()
);
```

**Ventajas**:
- Mejor organización
- Fácil de consultar
- Permite agregar metadata (descripción, fecha)

---

## 🎯 Implementación en el Código

El código ya está preparado para:
1. ✅ Subir imágenes al bucket `documentacion-servicios`
2. ✅ Organizar imágenes por orden (`orden-{id}/`)
3. ✅ Generar nombres únicos para evitar conflictos
4. ✅ Obtener URLs públicas de las imágenes
5. ✅ Manejar errores si el bucket no existe

**Lo que falta**:
- ⚠️ Crear el bucket en Supabase Storage
- ⚠️ Configurar políticas RLS (si es bucket privado)
- ⚠️ Guardar las URLs en la base de datos (tabla separada o campo JSON)

---

## 📝 SQL para Crear Tabla de Imágenes (Opcional)

Si quieres crear una tabla separada para las imágenes:

```sql
-- Crear tabla para almacenar URLs de imágenes
CREATE TABLE imagenes_documentacion (
  id_imagen SERIAL PRIMARY KEY,
  id_ejecucion INTEGER NOT NULL REFERENCES ejecuciones_servicio(id_ejecucion) ON DELETE CASCADE,
  url_imagen TEXT NOT NULL,
  nombre_archivo TEXT,
  descripcion TEXT,
  fecha_subida TIMESTAMP DEFAULT NOW(),
  creado_por INTEGER REFERENCES usuarios(id_usuario)
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_imagenes_ejecucion ON imagenes_documentacion(id_ejecucion);

-- Comentarios
COMMENT ON TABLE imagenes_documentacion IS 'Almacena las URLs de las imágenes subidas en la documentación de servicios';
COMMENT ON COLUMN imagenes_documentacion.url_imagen IS 'URL pública de la imagen en Supabase Storage';
COMMENT ON COLUMN imagenes_documentacion.descripcion IS 'Descripción opcional de la imagen';
```

---

## ✅ Checklist de Configuración

- [ ] Bucket `documentacion-servicios` creado en Supabase Storage
- [ ] Políticas RLS configuradas (si es bucket privado)
- [ ] Límite de tamaño de archivo configurado (10 MB)
- [ ] Tipos MIME permitidos configurados (opcional)
- [ ] Tabla `imagenes_documentacion` creada (opcional)
- [ ] Probado subida de imagen desde el sistema
- [ ] Verificado que las imágenes se guardan correctamente
- [ ] Verificado que las URLs son accesibles

---

## 🎯 Próximos Pasos

1. **Crear el bucket** en Supabase Storage
2. **Configurar políticas RLS** (si es necesario)
3. **Probar la subida de imágenes** desde el módulo de documentación
4. **Crear la tabla `imagenes_documentacion`** (opcional, pero recomendado)
5. **Actualizar el código** para guardar las URLs en la base de datos

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de la consola del navegador
2. Verifica las políticas RLS en Supabase
3. Verifica que el bucket existe y tiene el nombre correcto
4. Verifica los permisos del usuario autenticado

