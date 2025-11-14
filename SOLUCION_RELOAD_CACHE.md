# Solución: Actualizar Schema Cache de Supabase

## Problema
No encuentras el botón "Reload schema cache" en Supabase o no está disponible en tu versión.

## Soluciones Alternativas

### Opción 1: Esperar (MÁS SIMPLE)
El cache de Supabase se actualiza automáticamente cada 2-5 minutos.
1. **Espera 3-5 minutos** después de ejecutar el script SQL
2. **Cierra y vuelve a abrir** tu aplicación
3. **Prueba** asignar una orden en el módulo del coordinador

### Opción 2: Forzar Actualización con SQL
Ejecuta el script `forzar-actualizacion-cache.sql`:
- Hace consultas que fuerzan a Supabase a reconocer el nuevo schema
- Puedes hacer un INSERT de prueba (luego lo borras)

### Opción 3: Reiniciar la Conexión
1. **Cierra completamente** tu aplicación (Ctrl+C en la terminal si está corriendo)
2. **Espera 30 segundos**
3. **Vuelve a iniciar** con `npm run dev`
4. Esto fuerza una nueva conexión a Supabase con el schema actualizado

### Opción 4: Verificar en Supabase Dashboard (Si tienes acceso)
1. Ve a tu proyecto en Supabase
2. **Table Editor** → busca la tabla `notificaciones`
3. Si ves la columna `leida` en la interfaz, el cache ya se actualizó
4. Si no la ves, espera unos minutos más

### Opción 5: Limpiar Cache del Navegador
1. Abre las **DevTools** (F12)
2. Ve a la pestaña **Application** (o **Almacenamiento**)
3. **Clear storage** → **Clear site data**
4. O simplemente **Ctrl + Shift + R** para hard refresh

## Verificación Final

Después de probar cualquiera de las opciones anteriores:

1. **Abre la consola del navegador** (F12)
2. **Intenta asignar una orden** en el módulo del coordinador
3. **Verifica los logs**:
   - ✅ Si ves `✅ Notificación insertada exitosamente` → **¡Funciona!**
   - ❌ Si ves `PGRST204` o `Could not find the 'leida' column` → Espera más tiempo o prueba otra opción

## Nota Importante

El error `PGRST204` es específico del cache de PostgREST (el API de Supabase). Este cache se actualiza automáticamente, pero puede tardar unos minutos. Si después de **5-10 minutos** sigues viendo el error, puede ser un problema diferente.

## Si Nada Funciona

Si después de 10-15 minutos sigues viendo el error:

1. **Verifica en Supabase** que la columna existe:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'notificaciones' AND column_name = 'leida';
   ```
   Si esto devuelve un resultado, la columna existe y el problema es solo del cache.

2. **Contacta con Soporte de Supabase** o verifica si hay alguna actualización pendiente en tu proyecto.

3. **Como última opción**, puedes intentar crear la columna nuevamente con un nombre temporal diferente para forzar la actualización.

