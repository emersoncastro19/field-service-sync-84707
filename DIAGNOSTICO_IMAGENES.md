# Diagnóstico: Las Imágenes No Aparecen

## 📊 Resultado del Paso 6

El paso 6 mostró que hay **0 imágenes** en ambos lugares:
- `imagenes_servicio`: 0 imágenes
- `ejecuciones_servicio.imagenes_urls`: 0 imágenes

Esto significa que:
✅ La estructura de la base de datos está correcta
❌ No hay imágenes guardadas aún

## 🔍 Pasos para Diagnosticar

### Paso 1: Verificar Ejecuciones con Trabajo Finalizado

Ejecuta este query en Supabase SQL Editor:

```sql
SELECT 
    id_ejecucion,
    id_orden,
    fecha_inicio,
    fecha_fin,
    trabajo_realizado IS NOT NULL AS tiene_documentacion,
    CASE 
        WHEN imagenes_urls IS NOT NULL THEN jsonb_array_length(imagenes_urls)
        ELSE 0
    END AS cantidad_imagenes_json
FROM ejecuciones_servicio
WHERE fecha_fin IS NOT NULL
ORDER BY fecha_fin DESC
LIMIT 10;
```

**¿Qué buscar?**
- Si hay ejecuciones con `fecha_fin` no null → El técnico finalizó el trabajo
- Si `tiene_documentacion` es `true` → Hay documentación guardada
- Si `cantidad_imagenes_json` es 0 → No hay imágenes en el JSON

### Paso 2: Verificar Supabase Storage

1. Ve a tu proyecto en Supabase
2. Navega a **Storage** → **Buckets**
3. Busca el bucket `documentacion-servicios`
4. Si no existe, créalo:
   - Click en "New bucket"
   - Nombre: `documentacion-servicios`
   - Marca como **público** (Public bucket)
   - Crea el bucket

5. Si el bucket existe, revisa si hay archivos dentro:
   - Abre el bucket
   - Deberías ver carpetas como `orden-{id_orden}/` con archivos de imágenes

### Paso 3: Probar Subir una Imagen

1. **Abre la aplicación** en el navegador
2. **Abre la consola del navegador** (F12 → Console)
3. Ve a **"Gestionar Ejecución"** como técnico
4. Selecciona una orden con trabajo iniciado
5. Ve a la pestaña **"Documentar"**
6. **Sube una imagen** (si el campo está habilitado)
7. **Finaliza el trabajo** (si aún no está finalizado)

### Paso 4: Revisar los Logs en la Consola

Cuando subas una imagen o finalices el trabajo, busca estos mensajes en la consola:

#### ✅ Mensajes de Éxito:
- `✅ X imagen(es) subida(s) correctamente`
- `✅ URLs de imágenes guardadas en la tabla imagenes_servicio`
- `✅ URLs de imágenes guardadas en ejecuciones_servicio.imagenes_urls`

#### ⚠️ Mensajes de Advertencia:
- `⚠️ Bucket no encontrado` → El bucket no existe en Storage
- `⚠️ No se pudieron guardar las URLs en imagenes_servicio` → Error al guardar en BD
- `⚠️ Error cargando desde imagenes_servicio` → Error al cargar desde BD

#### ❌ Mensajes de Error:
- `❌ Error obteniendo ejecución` → Error al obtener datos de la ejecución
- `❌ Error guardando en imagenes_urls` → Error al guardar en el campo JSON

### Paso 5: Verificar Después de Subir

Después de subir una imagen y finalizar el trabajo, ejecuta este query:

```sql
-- Verificar si se guardaron imágenes
SELECT 
    'imagenes_servicio' AS fuente,
    COUNT(*) AS total_imagenes
FROM imagenes_servicio
UNION ALL
SELECT 
    'ejecuciones_servicio.imagenes_urls' AS fuente,
    COUNT(*) AS total_imagenes
FROM ejecuciones_servicio
WHERE imagenes_urls IS NOT NULL 
AND jsonb_array_length(imagenes_urls) > 0;
```

Si ahora muestra imágenes, el problema era que simplemente no se habían subido aún.

## 🐛 Problemas Comunes y Soluciones

### Problema 1: "Bucket not found"

**Solución:**
1. Ve a Supabase → Storage → Buckets
2. Crea el bucket `documentacion-servicios`
3. Configúralo como **público**

### Problema 2: Las imágenes se suben a Storage pero no se guardan en BD

**Solución:**
1. Revisa los logs de la consola para ver el error específico
2. Verifica que la tabla `imagenes_servicio` existe (paso 1-3 del script)
3. Verifica que el campo `imagenes_urls` existe (paso 4-5 del script)

### Problema 3: Las imágenes se guardan pero no se muestran

**Solución:**
1. Verifica que las URLs de las imágenes son públicas y accesibles
2. Abre una URL directamente en el navegador para verificar
3. Revisa los logs de carga en la consola (`🔍 Buscando imágenes...`)

### Problema 4: El técnico no puede subir imágenes

**Solución:**
1. Verifica que el trabajo está iniciado (`fecha_inicio` no null)
2. Verifica que el trabajo NO está finalizado (`fecha_fin` es null)
3. Verifica que el modo edición está activo

## 📝 Próximos Pasos

1. Ejecuta el query del **Paso 1** para ver si hay ejecuciones finalizadas
2. Verifica **Storage** para ver si el bucket existe y tiene archivos
3. Prueba **subir una imagen** y revisa los logs
4. Ejecuta el query del **Paso 5** después de subir para verificar

Si después de seguir estos pasos las imágenes aún no aparecen, comparte:
- Los logs de la consola cuando subes una imagen
- El resultado del query del Paso 1
- Si el bucket existe en Storage






