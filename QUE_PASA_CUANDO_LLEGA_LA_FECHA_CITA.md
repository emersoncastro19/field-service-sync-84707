# 📅 ¿Qué Hace el Sistema Cuando Llega la Fecha de la Cita?

## 🔍 Estado Actual del Sistema

### ✅ Lo que SÍ hace el sistema actualmente:

1. **Al Programar la Cita:**
   - Crea un registro en la tabla `citas` con:
     - `fecha_programada`: Fecha y hora seleccionadas
     - `estado_cita`: "Programada"
   - Crea notificaciones para:
     - Cliente: "Se ha programado una cita para tu orden..."
     - Técnico: "Se te ha asignado la orden... Cita programada para el..."

2. **Visualización de Citas:**
   - El técnico puede ver sus citas en el módulo "Citas"
   - El cliente puede ver sus citas en el módulo "Citas"
   - Las citas se muestran con fecha, hora y estado

3. **Gestión Manual:**
   - El técnico puede iniciar el trabajo manualmente cuando llegue al lugar
   - El cliente puede ver cuándo es su cita programada

---

## ❌ Lo que NO hace el sistema actualmente (Funcionalidad Faltante):

### 1. **Recordatorios Automáticos**
   - ❌ No envía recordatorios 24 horas antes de la cita
   - ❌ No envía recordatorios el día de la cita
   - ❌ No envía recordatorios 1 hora antes de la cita

### 2. **Notificaciones en el Día de la Cita**
   - ❌ No notifica automáticamente al técnico el día de la cita
   - ❌ No notifica automáticamente al cliente el día de la cita
   - ❌ No muestra alertas especiales para citas del día

### 3. **Cambios Automáticos de Estado**
   - ❌ No cambia el estado de la cita automáticamente cuando llega la fecha
   - ❌ No marca citas como "Vencidas" si pasó la fecha sin iniciar el trabajo
   - ❌ No actualiza el estado de la orden si la cita pasó sin atención

### 4. **Alertas y Seguimiento**
   - ❌ No alerta al coordinador si una cita pasó sin iniciar el trabajo
   - ❌ No genera reportes de citas vencidas
   - ❌ No notifica si el técnico no inició el trabajo después de la fecha programada

---

## 🎯 ¿Qué DEBERÍA Hacer el Sistema?

### Opción 1: **Sistema Reactivo (Recomendado para implementar)**

El sistema debería:

1. **Recordatorios Automáticos:**
   - Enviar notificación al técnico 24 horas antes de la cita
   - Enviar notificación al cliente 24 horas antes de la cita
   - Enviar notificación 1 hora antes de la cita (opcional)

2. **Notificaciones el Día de la Cita:**
   - Notificar al técnico cuando es el día de su cita
   - Notificar al cliente cuando es el día de su cita
   - Mostrar alertas especiales en el dashboard del técnico

3. **Seguimiento Post-Cita:**
   - Si pasan 2 horas después de la fecha programada y el trabajo no se inició:
     - Notificar al coordinador
     - Cambiar estado de la cita a "Pendiente de Seguimiento"
   - Si pasa 1 día después de la fecha programada y el trabajo no se inició:
     - Notificar al coordinador
     - Cambiar estado de la cita a "Vencida"
     - Permitir al coordinador reprogramar la cita

4. **Visualización Mejorada:**
   - Destacar citas del día en el dashboard del técnico
   - Mostrar citas próximas (próximas 24 horas) de manera prominente
   - Filtrar citas por "Hoy", "Esta Semana", "Próximas"

---

## 🛠️ Implementación Sugerida

### A. **Recordatorios Automáticos (Cron Job o Tarea Programada)**

**Opción 1: Edge Function de Supabase (Recomendado)**
- Crear una Edge Function que se ejecute cada hora
- Verificar citas programadas para las próximas 24 horas
- Crear notificaciones automáticas

**Opción 2: Tarea Programada en el Cliente (Menos Confiable)**
- Usar `setInterval` en el cliente para verificar citas
- Solo funciona cuando el usuario tiene el sistema abierto
- No es confiable para notificaciones críticas

**Opción 3: Servicio Externo (Cron Job)**
- Usar un servicio como Vercel Cron, GitHub Actions, o un servidor propio
- Ejecutar scripts periódicamente para verificar y crear notificaciones

### B. **Verificación al Cargar el Sistema**

Cuando un usuario inicia sesión:
1. Verificar si tiene citas programadas para hoy
2. Mostrar notificación o alerta si tiene citas del día
3. Resaltar citas próximas en el dashboard

### C. **Seguimiento de Citas Vencidas**

Cuando se carga el módulo de citas:
1. Verificar si hay citas con fecha pasada y estado "Programada"
2. Cambiar estado a "Vencida" automáticamente
3. Notificar al coordinador si hay citas vencidas

---

## 📋 Ejemplo de Flujo Completo

### Escenario: Cita programada para el 15 de enero de 2025 a las 10:00 AM

**14 de enero (24 horas antes):**
- ✅ Sistema envía notificación al técnico: "Tienes una cita mañana a las 10:00 AM"
- ✅ Sistema envía notificación al cliente: "Tu cita está programada para mañana a las 10:00 AM"

**15 de enero (día de la cita):**
- ✅ Sistema muestra alerta en el dashboard del técnico: "Tienes 1 cita programada para hoy"
- ✅ Sistema muestra notificación al cliente: "Tu cita es hoy a las 10:00 AM"
- ✅ La cita aparece destacada en el módulo "Citas"

**15 de enero, 10:00 AM (hora de la cita):**
- ✅ Sistema muestra recordatorio: "Es hora de tu cita"
- ✅ El técnico puede iniciar el trabajo desde "Gestionar Ejecución"

**15 de enero, 12:00 PM (2 horas después, si no se inició):**
- ⚠️ Sistema notifica al coordinador: "La cita de la orden X no se ha iniciado"
- ⚠️ Estado de la cita cambia a "Pendiente de Seguimiento"

**16 de enero (1 día después, si no se inició):**
- ❌ Sistema notifica al coordinador: "La cita de la orden X está vencida"
- ❌ Estado de la cita cambia a "Vencida"
- ❌ Coordinador puede reprogramar la cita

---

## 🔧 Funcionalidad que Podemos Implementar AHORA

### 1. **Verificación al Cargar el Sistema (Fácil de Implementar)**
- Cuando el técnico inicia sesión, verificar citas del día
- Mostrar alerta si tiene citas programadas para hoy
- Resaltar citas próximas en el dashboard

### 2. **Seguimiento de Citas Vencidas (Fácil de Implementar)**
- Al cargar el módulo de citas, verificar citas con fecha pasada
- Cambiar estado automáticamente a "Vencida"
- Notificar al coordinador

### 3. **Recordatorios Manuales (Medio de Implementar)**
- Crear un componente que verifique citas próximas
- Mostrar notificaciones cuando el usuario está en el sistema
- Usar `setInterval` para verificar cada hora (solo cuando el sistema está abierto)

### 4. **Recordatorios Automáticos con Edge Functions (Avanzado)**
- Crear una Edge Function en Supabase
- Configurar un cron job para ejecutarla cada hora
- Verificar citas y crear notificaciones automáticamente

---

## 💡 Recomendación

**Implementar PRIMERO:**
1. ✅ Verificación al cargar el sistema (fácil, impacto inmediato)
2. ✅ Seguimiento de citas vencidas (fácil, importante para el flujo)
3. ✅ Resaltar citas del día en el dashboard (fácil, mejora UX)

**Implementar DESPUÉS:**
4. ⚠️ Recordatorios automáticos con Edge Functions (avanzado, requiere configuración)
5. ⚠️ Notificaciones push (avanzado, requiere servicio externo)

---

## ❓ Preguntas para el Usuario

1. **¿Quieres que implemente la verificación al cargar el sistema?** (Mostrar alertas cuando hay citas del día)
2. **¿Quieres que implemente el seguimiento de citas vencidas?** (Cambiar estado automáticamente si pasó la fecha)
3. **¿Quieres recordatorios automáticos?** (Requiere Edge Functions o servicio externo)
4. **¿Qué tan importante es que el sistema notifique automáticamente?** (Determina la prioridad de implementación)

---

## 📝 Notas Técnicas

- Las citas se guardan en UTC en la base de datos
- Se convierten a hora local al mostrarse
- Las notificaciones se crean en la tabla `notificaciones`
- Los estados de cita son: "Programada", "Confirmada", "Reprogramada", "Completada", "Cancelada"
- Podríamos agregar: "Vencida", "Pendiente de Seguimiento"

---

## 🎯 Conclusión

**Actualmente, el sistema NO hace nada automáticamente cuando llega la fecha de la cita.** Todo es manual:
- El técnico debe recordar revisar sus citas
- El cliente debe recordar revisar sus citas
- No hay recordatorios automáticos
- No hay seguimiento de citas vencidas

**Podemos implementar funcionalidades para:**
- Mostrar alertas cuando hay citas del día
- Seguimiento automático de citas vencidas
- Recordatorios (requiere configuración adicional)

¿Quieres que implemente alguna de estas funcionalidades?

