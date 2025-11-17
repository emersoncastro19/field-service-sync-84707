# Instrucciones para Verificar y Configurar el Almacenamiento de Imágenes

## 📍 Dónde se Almacenan las Imágenes

El sistema intenta guardar las imágenes en **dos lugares** (en orden de prioridad):

1. **Tabla `imagenes_servicio`** (preferido)
   - Estructura: `id_imagen`, `id_ejecucion`, `id_orden`, `url_imagen`, `descripcion`, `fecha_subida`
   - Una fila por cada imagen

2. **Campo JSON `imagenes_urls` en `ejecuciones_servicio`** (fallback)
   - Campo tipo JSONB que almacena un array de URLs
   - Se usa si la tabla `imagenes_servicio` no existe o hay un error

## 🔍 Verificar la Estructura en Supabase

### Paso 1: Ejecutar el Script SQL

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Copia y pega el contenido del archivo `verificar-estructura-imagenes.sql`
4. Ejecuta el script

Este script:
- Verifica si existe la tabla `imagenes_servicio`
- La crea si no existe
- Verifica si existe el campo `imagenes_urls` en `ejecuciones_servicio`
- Lo crea si no existe
- Muestra ejemplos de datos existentes

### Paso 2: Verificar en la Consola del Navegador

Cuando subas imágenes o cargues una orden con imágenes, revisa la consola del navegador (F12) para ver los logs:

- `✅ URLs de imágenes guardadas en la tabla imagenes_servicio` - Se guardó correctamente
- `✅ URLs de imágenes guardadas en ejecuciones_servicio.imagenes_urls` - Se guardó en el fallback
- `⚠️ Error...` - Hubo un problema al guardar
- `✅ X imagen(es) cargada(s) desde imagenes_servicio` - Se cargaron desde la tabla
- `✅ Imágenes cargadas desde imagenes_urls (JSON)` - Se cargaron desde el JSON

### Paso 3: Verificar en Supabase

#### Verificar la tabla `imagenes_servicio`:
```sql
SELECT * FROM imagenes_servicio 
ORDER BY fecha_subida DESC 
LIMIT 10;
```

#### Verificar el campo `imagenes_urls`:
```sql
SELECT 
    id_ejecucion,
    id_orden,
    imagenes_urls,
    jsonb_array_length(imagenes_urls) AS cantidad_imagenes
FROM ejecuciones_servicio
WHERE imagenes_urls IS NOT NULL 
AND jsonb_array_length(imagenes_urls) > 0
ORDER BY id_ejecucion DESC
LIMIT 10;
```

## 🐛 Solución de Problemas

### Las imágenes no aparecen

1. **Verifica que el bucket de Storage existe:**
   - Ve a Supabase → Storage
   - Debe existir un bucket llamado `documentacion-servicios`
   - Si no existe, créalo y configura los permisos públicos

2. **Verifica que las imágenes se están guardando:**
   - Revisa la consola del navegador cuando subas imágenes
   - Busca mensajes de error o advertencia
   - Verifica en la base de datos usando los queries de arriba

3. **Verifica que las imágenes se están cargando:**
   - Abre la consola del navegador (F12)
   - Navega a una orden con imágenes
   - Busca los logs que empiezan con `🔍`, `✅`, o `⚠️`

4. **Verifica las URLs de las imágenes:**
   - Las URLs deben ser públicas y accesibles
   - Si usas Supabase Storage, las URLs deben tener el formato correcto
   - Prueba abrir una URL directamente en el navegador

### La tabla `imagenes_servicio` no existe

Ejecuta este SQL en Supabase:

```sql
CREATE TABLE IF NOT EXISTS imagenes_servicio (
    id_imagen SERIAL PRIMARY KEY,
    id_ejecucion INTEGER NOT NULL REFERENCES ejecuciones_servicio(id_ejecucion) ON DELETE CASCADE,
    id_orden INTEGER NOT NULL REFERENCES ordenes_servicio(id_orden) ON DELETE CASCADE,
    url_imagen TEXT NOT NULL,
    descripcion TEXT,
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_imagenes_ejecucion ON imagenes_servicio(id_ejecucion);
CREATE INDEX IF NOT EXISTS idx_imagenes_orden ON imagenes_servicio(id_orden);
```

### El campo `imagenes_urls` no existe

Ejecuta este SQL en Supabase:

```sql
ALTER TABLE ejecuciones_servicio 
ADD COLUMN IF NOT EXISTS imagenes_urls JSONB DEFAULT '[]'::jsonb;
```

## 📝 Notas Importantes

- Las imágenes se suben a Supabase Storage en el bucket `documentacion-servicios`
- Las URLs públicas se guardan en la base de datos
- El sistema intenta primero usar la tabla `imagenes_servicio`, y si falla, usa el campo JSON
- Al cargar, el sistema busca en ambos lugares y muestra las que encuentre






