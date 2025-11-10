# Probar el Sistema de Notificaciones

## ✅ Políticas RLS Configuradas Correctamente

Ahora tienes las 3 políticas correctas:
- ✅ INSERT - Para insertar notificaciones
- ✅ SELECT - Para ver notificaciones
- ✅ UPDATE - Para actualizar notificaciones

Todas con rol `{authenticated}`, que es lo correcto para tu aplicación.

## Pasos para Probar

### 1. Prueba Asignar un Técnico

1. **Inicia sesión como Coordinador** en tu aplicación
2. Ve al módulo **"Asignar o Reasignar Órdenes"**
3. Selecciona una orden con estado **"Validada"**
4. Selecciona un técnico disponible
5. Ingresa una fecha y hora para la cita
6. Haz clic en **"Asignar Técnico"**

### 2. Revisa la Consola del Navegador

1. Abre la **consola del navegador** (presiona F12)
2. Ve a la pestaña **"Console"**
3. Busca los logs relacionados con notificaciones:
   - Deberías ver: `✅ Notificación X insertada exitosamente`
   - O si hay errores: `❌ ERROR insertando notificación`

### 3. Verifica en Supabase

Ejecuta esta consulta en el SQL Editor de Supabase:

```sql
SELECT 
    id_notificacion,
    id_orden,
    id_destinatario,
    tipo_notificacion,
    mensaje,
    fecha_enviada,
    leida
FROM notificaciones
ORDER BY fecha_enviada DESC
LIMIT 10;
```

Deberías ver las notificaciones recién creadas.

### 4. Verifica la Campana de Notificaciones

1. **Inicia sesión como Cliente** (el cliente que recibió la notificación)
2. Haz clic en la **campana de notificaciones** (icono de campana)
3. Deberías ver la notificación: "Se ha programado una cita para tu orden..."

4. **Inicia sesión como Técnico** (el técnico asignado)
5. Haz clic en la **campana de notificaciones**
6. Deberías ver la notificación: "Se te ha asignado la orden..."

## Qué Esperar

### Si Todo Funciona Correctamente:

✅ **Al asignar un técnico:**
- Se crean 2 notificaciones: una para el cliente y otra para el técnico
- Las notificaciones aparecen en la tabla `notificaciones` en Supabase
- Las notificaciones aparecen en la campana de notificaciones del sistema
- Los logs en la consola muestran: `✅ Notificación insertada exitosamente`

### Si Hay Problemas:

❌ **Si las notificaciones no se insertan:**
- Revisa la consola del navegador para ver errores específicos
- Verifica que los `id_usuario` del cliente y técnico sean correctos
- Verifica que los usuarios estén autenticados correctamente

❌ **Si las notificaciones se insertan pero no aparecen en la campana:**
- Verifica que el componente `NotificationBell` esté cargando las notificaciones
- Revisa los logs en la consola del navegador
- Verifica que el `id_destinatario` en las notificaciones coincida con el `id_usuario` del usuario logueado

## Logs Esperados en la Consola

Cuando asignas un técnico, deberías ver logs como estos:

```
🔍 Buscando cliente con id_cliente: X
✅ Cliente encontrado: {id_cliente: X, id_usuario: Y}
🔍 Buscando técnico con id_tecnico: Z
✅ Técnico encontrado: {id_tecnico: Z, id_usuario: W}
📝 === NOTIFICACIÓN 1/2 ===
📤 Objeto a insertar: {...}
✅ Notificación 1 insertada exitosamente: {...}
📝 === NOTIFICACIÓN 2/2 ===
📤 Objeto a insertar: {...}
✅ Notificación 2 insertada exitosamente: {...}
📊 === RESUMEN DE NOTIFICACIONES ===
✅ Exitosas: 2
❌ Fallidas: 0
```

## Solución de Problemas

### Problema: "No se pudieron crear las notificaciones"

**Solución:**
1. Revisa la consola del navegador para ver el error específico
2. Verifica que los `id_usuario` del cliente y técnico sean números válidos
3. Verifica que las políticas RLS estén activas (ya las tienes configuradas ✅)

### Problema: "Las notificaciones se insertan pero no aparecen en la campana"

**Solución:**
1. Verifica que el componente `NotificationBell` esté cargando las notificaciones
2. Revisa que el `id_destinatario` en las notificaciones coincida con el `id_usuario` del usuario
3. Verifica que la consulta en `NotificationBell` esté filtrando correctamente por `id_destinatario`

### Problema: "Error de permisos RLS"

**Solución:**
- Ya tienes las políticas correctas configuradas ✅
- Si aún hay errores, verifica que el usuario esté autenticado correctamente
- Verifica que la sesión no haya expirado

## Próximos Pasos

1. ✅ **Políticas RLS configuradas** - COMPLETADO
2. 🔄 **Probar asignar un técnico** - EN PROCESO
3. ⏳ **Verificar notificaciones en Supabase** - PENDIENTE
4. ⏳ **Verificar notificaciones en la campana** - PENDIENTE

## Nota Final

Con las políticas RLS correctamente configuradas, las notificaciones deberían funcionar correctamente. Si encuentras algún problema, revisa los logs en la consola del navegador para identificar el error específico.

¡Prueba el sistema y cuéntame cómo va!

