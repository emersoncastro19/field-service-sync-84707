# Solución al Problema de Notificaciones

## Problemas Identificados

### Problema 1: Columnas Faltantes
Error: `PGRST204: Could not find the 'leida' column of 'notificaciones' in the schema cache`
- La columna `leida` no existe en la tabla `notificaciones`
- El código intenta insertar `leida: false` pero la columna no existe

### Problema 2: Políticas RLS
Las notificaciones no están apareciendo en los módulos correspondientes (campana de notificaciones, panel de admin, etc.).

**Causa Raíz**: El sistema **NO usa Supabase Auth directamente**, sino que maneja la autenticación a nivel de aplicación con localStorage y la tabla `usuarios`. Por lo tanto, las políticas RLS (Row Level Security) en Supabase no pueden usar `auth.uid()` para identificar al usuario actual, lo que bloquea el acceso a las notificaciones.

## Solución

### Paso 1: Crear Columnas Faltantes (IMPORTANTE - Hacer primero)
Ejecuta el script `verificar-y-crear-columnas-notificaciones.sql` en el SQL Editor de Supabase. Este script:
1. **Verifica todas las columnas necesarias** en la tabla `notificaciones`
2. **Crea la columna `leida`** si no existe (tipo BOOLEAN, DEFAULT FALSE)
3. **Crea otras columnas faltantes** si es necesario
4. **Verifica que la estructura sea correcta**

**⚠️ MUY IMPORTANTE**: Después de ejecutar este script, puede que necesites refrescar el schema cache de Supabase:
- Ve a Settings > API en tu proyecto de Supabase
- Haz clic en "Reload schema cache" o espera unos minutos
- Esto actualiza el cache y Supabase reconocerá la nueva columna

### Paso 2: Corregir Políticas RLS
Ejecuta el script `fix-notificaciones-rls.sql` en el SQL Editor de Supabase. Este script:

1. **Deshabilita RLS en la tabla `notificaciones`** (Opción recomendada)
   - Como la seguridad se maneja a nivel de aplicación, no necesitamos RLS
   - Esto permite que todas las consultas funcionen correctamente

2. Alternativamente, crea políticas permisivas si prefieres mantener RLS habilitado

### Paso 3: Verificar que las Notificaciones se Están Creando
Usa el script `verificar-agentes-notificaciones.sql` para verificar:
- Si hay agentes en la base de datos
- Si se están creando notificaciones
- Si los `id_destinatario` son válidos

### Paso 4: Verificar en la Consola del Navegador
Después de ejecutar el script SQL, abre la consola del navegador (F12) y:
1. Intenta crear una orden nueva como cliente
2. Observa los logs en la consola - deberías ver mensajes como:
   - `🔔 Cargando notificaciones para usuario: X`
   - `📬 Notificaciones encontradas: Y`
   - Si hay errores, verás: `❌ Error en query de notificaciones`

### Mejoras Implementadas

1. **Mejor logging en `NotificationBell.tsx`**:
   - Verifica sesión de Supabase
   - Detecta errores de permisos RLS
   - Muestra mensajes claros en consola

2. **Manejo de errores mejorado**:
   - Detecta específicamente errores de permisos
   - Muestra mensajes útiles para debugging

## Verificación

Después de ejecutar ambos scripts SQL, verifica que:

1. ✅ La columna `leida` existe en la tabla `notificaciones`:
   ```sql
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_name = 'notificaciones' AND column_name = 'leida';
   -- Debe retornar: leida | boolean | false
   ```

2. ✅ Puedes insertar notificaciones sin error:
   ```sql
   INSERT INTO notificaciones (id_destinatario, tipo_notificacion, mensaje, fecha_enviada, leida)
   VALUES (1, 'Test', 'Mensaje de prueba', NOW(), FALSE);
   -- Debe insertar sin error
   ```

4. ✅ Puedes leer notificaciones:
   ```sql
   SELECT COUNT(*) FROM notificaciones;
   -- Debe retornar el número de notificaciones sin error
   ```

5. ✅ Las notificaciones aparecen en la campana cuando:
   - Un cliente crea una orden → los agentes reciben notificación
   - Un agente valida/rechaza una orden → el cliente recibe notificación
   - Un coordinador asigna técnico → cliente y técnico reciben notificación
   - Un técnico completa trabajo → cliente y coordinador reciben notificación
   - Un cliente confirma/rechaza servicio → técnico y coordinador reciben notificación

## Notas Importantes

- El script SQL **deshabilita RLS completamente** en la tabla `notificaciones`
- Esto es seguro porque:
  - La autenticación se maneja en el frontend/backend
  - Las consultas ya filtran por `id_destinatario` en el código
  - Solo usuarios autenticados pueden acceder a la aplicación

- Si prefieres mantener RLS habilitado, puedes usar las políticas permisivas comentadas en el script

## Siguiente Paso

Si después de ejecutar el script SQL las notificaciones aún no aparecen:

1. Revisa la consola del navegador para errores específicos
2. Verifica que las notificaciones se están insertando en la base de datos
3. Verifica que los `id_destinatario` en las notificaciones coinciden con los `id_usuario` de los usuarios

