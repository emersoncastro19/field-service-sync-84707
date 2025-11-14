# Sistema de Notificaciones - Situaciones y Destinatarios

## 1. FLUJO DE ÓRDENES

### 1.1. Cliente crea nueva orden
**Destinatario:** Agente
**Tipo:** "Nueva Orden Creada"
**Mensaje:** "Se ha creado una nueva orden de servicio [NUMERO_ORDEN] por el cliente [NOMBRE_CLIENTE]. Tipo: [TIPO_SERVICIO]."
**Estado actual:** ✅ IMPLEMENTADO

### 1.2. Agente valida/acepta orden
**Destinatario:** Cliente, Coordinador
**Tipo:** "Orden Validada"
**Mensaje Cliente:** "Tu orden [NUMERO_ORDEN] ha sido validada y está en proceso de asignación."
**Mensaje Coordinador:** "Nueva orden [NUMERO_ORDEN] validada y lista para asignación."
**Estado actual:** ✅ IMPLEMENTADO

### 1.3. Agente rechaza orden
**Destinatario:** Cliente
**Tipo:** "Orden Rechazada"
**Mensaje:** "Tu orden [NUMERO_ORDEN] ha sido rechazada. Motivo: [MOTIVO]."
**Estado actual:** ✅ IMPLEMENTADO

## 2. FLUJO DE ASIGNACIÓN

### 2.1. Coordinador asigna orden a técnico y programa cita
**Destinatarios:** Cliente, Técnico
**Tipo Cliente:** "Cita Programada"
**Mensaje Cliente:** "Se ha programado una cita para tu orden [NUMERO_ORDEN] el [FECHA] a las [HORA]. Por favor, confirma si esta fecha te parece bien o solicita una reprogramación."
**Tipo Técnico:** "Asignación de Orden"
**Mensaje Técnico:** "Se te ha asignado la orden [NUMERO_ORDEN]. Cita programada para el [FECHA] a las [HORA]."
**Estado actual:** ✅ IMPLEMENTADO

### 2.2. Coordinador aprueba reprogramación solicitada por cliente
**Destinatarios:** Cliente, Técnico
**Tipo Cliente:** "Reprogramación Aprobada"
**Mensaje Cliente:** "Tu solicitud de reprogramación ha sido aprobada. Nueva fecha: [FECHA] a las [HORA]."
**Tipo Técnico:** "Cita Reprogramada"
**Mensaje Técnico:** "La cita para la orden [NUMERO_ORDEN] ha sido reprogramada. Nueva fecha: [FECHA] a las [HORA]."
**Estado actual:** ❌ NO IMPLEMENTADO

### 2.3. Coordinador rechaza reprogramación solicitada por cliente
**Destinatario:** Cliente
**Tipo:** "Reprogramación Rechazada"
**Mensaje:** "Tu solicitud de reprogramación para la orden [NUMERO_ORDEN] ha sido rechazada. La fecha original se mantiene: [FECHA] a las [HORA]."
**Estado actual:** ❌ NO IMPLEMENTADO

## 3. FLUJO DE CITAS

### 3.1. Cliente confirma cita programada
**Destinatario:** Técnico
**Tipo:** "Cita Confirmada por Cliente"
**Mensaje:** "El cliente ha confirmado la cita para la orden [NUMERO_ORDEN]. La fecha programada es [FECHA] a las [HORA]."
**Estado actual:** ✅ IMPLEMENTADO

### 3.2. Cliente solicita reprogramación
**Destinatario:** Coordinador
**Tipo:** "Solicitud de Reprogramación"
**Mensaje:** "El cliente ha solicitado reprogramar la cita de la orden [NUMERO_ORDEN]. Nueva fecha solicitada: [FECHA] a las [HORA]. Motivo: [MOTIVO]."
**Estado actual:** ✅ IMPLEMENTADO

### 3.3. Técnico inicia trabajo (llega a la ubicación)
**Destinatario:** Cliente
**Tipo:** "Técnico en Lugar"
**Mensaje:** "El técnico ha llegado a tu ubicación y está iniciando el trabajo en la orden [NUMERO_ORDEN]."
**Estado actual:** ❌ NO IMPLEMENTADO (se removió la confirmación del técnico)

## 4. FLUJO DE EJECUCIÓN DEL SERVICIO

### 4.1. Técnico inicia trabajo
**Destinatario:** Cliente, Coordinador
**Tipo Cliente:** "Trabajo Iniciado"
**Mensaje Cliente:** "El técnico ha iniciado el trabajo en tu orden [NUMERO_ORDEN]."
**Tipo Coordinador:** "Trabajo Iniciado"
**Mensaje Coordinador:** "El técnico [NOMBRE_TECNICO] ha iniciado el trabajo en la orden [NUMERO_ORDEN]."
**Estado actual:** ✅ IMPLEMENTADO

### 4.2. Técnico reporta impedimento
**Destinatario:** Coordinador
**Tipo:** "Impedimento Reportado"
**Mensaje:** "El técnico [NOMBRE_TECNICO] ha reportado un impedimento en la orden [NUMERO_ORDEN]. Tipo: [TIPO_IMPEDIMENTO]. Descripción: [DESCRIPCION]."
**Estado actual:** ❌ NO IMPLEMENTADO

### 4.3. Técnico finaliza trabajo
**Destinatario:** Cliente
**Tipo:** "Servicio Completado"
**Mensaje:** "El técnico ha completado el trabajo en tu orden [NUMERO_ORDEN]. Por favor confirma si el servicio fue realizado satisfactoriamente."
**Estado actual:** ✅ IMPLEMENTADO

## 5. FLUJO DE CONFIRMACIÓN DEL CLIENTE

### 5.1. Cliente confirma servicio completado
**Destinatarios:** Técnico, Coordinador
**Tipo Técnico:** "Servicio Confirmado por Cliente"
**Mensaje Técnico:** "El cliente ha confirmado que el servicio de la orden [NUMERO_ORDEN] fue realizado satisfactoriamente."
**Tipo Coordinador:** "Servicio Confirmado"
**Mensaje Coordinador:** "El cliente ha confirmado el servicio completado en la orden [NUMERO_ORDEN]."
**Estado actual:** ✅ IMPLEMENTADO

### 5.2. Cliente rechaza servicio
**Destinatarios:** Técnico, Coordinador
**Tipo Técnico:** "Servicio Rechazado"
**Mensaje Técnico:** "El cliente ha rechazado el servicio de la orden [NUMERO_ORDEN]."
**Tipo Coordinador:** "Servicio Rechazado"
**Mensaje Coordinador:** "El cliente ha rechazado el servicio de la orden [NUMERO_ORDEN]. Se requiere revisión."
**Estado actual:** ✅ IMPLEMENTADO

## 6. FLUJO DE IMPEDIMENTOS

### 6.1. Técnico reporta impedimento
**Destinatario:** Coordinador
**Tipo:** "Impedimento Reportado"
**Mensaje:** "Impedimento reportado en la orden [NUMERO_ORDEN]. Tipo: [TIPO]. Descripción: [DESCRIPCION]."
**Estado actual:** ❌ NO IMPLEMENTADO

### 6.2. Coordinador resuelve impedimento
**Destinatarios:** Técnico, Cliente
**Tipo Técnico:** "Impedimento Resuelto"
**Mensaje Técnico:** "El impedimento en la orden [NUMERO_ORDEN] ha sido resuelto. Puedes continuar con el trabajo."
**Tipo Cliente:** "Actualización de Orden"
**Mensaje Cliente:** "Se ha resuelto un impedimento en tu orden [NUMERO_ORDEN]. El servicio continuará normalmente."
**Estado actual:** ❌ NO IMPLEMENTADO

## 7. FLUJO DE CANCELACIONES

### 7.1. Cliente cancela orden
**Destinatarios:** Coordinador, Técnico (si está asignado), Agente
**Tipo:** "Orden Cancelada por Cliente"
**Mensaje:** "El cliente ha cancelado la orden [NUMERO_ORDEN]. Motivo: [MOTIVO]."
**Estado actual:** ❌ NO IMPLEMENTADO

### 7.2. Agente cancela orden
**Destinatarios:** Cliente, Coordinador, Técnico (si está asignado)
**Tipo:** "Orden Cancelada"
**Mensaje:** "La orden [NUMERO_ORDEN] ha sido cancelada. Motivo: [MOTIVO]."
**Estado actual:** ❌ NO IMPLEMENTADO

### 7.3. Coordinador cancela orden
**Destinatarios:** Cliente, Técnico (si está asignado), Agente
**Tipo:** "Orden Cancelada"
**Mensaje:** "La orden [NUMERO_ORDEN] ha sido cancelada por el coordinador."
**Estado actual:** ❌ NO IMPLEMENTADO

## 8. NOTIFICACIONES ADMINISTRATIVAS

### 8.1. Recordatorio de cita (24 horas antes)
**Destinatarios:** Cliente, Técnico
**Tipo:** "Recordatorio de Cita"
**Mensaje:** "Recordatorio: Tienes una cita programada mañana a las [HORA] para la orden [NUMERO_ORDEN]."
**Estado actual:** ❌ NO IMPLEMENTADO (requiere sistema de programación/cron)

### 8.2. Orden vencida (sin actualización en X días)
**Destinatarios:** Coordinador, Técnico (si está asignado)
**Tipo:** "Orden Vencida"
**Mensaje:** "La orden [NUMERO_ORDEN] no ha tenido actualizaciones en los últimos [X] días. Requiere atención."
**Estado actual:** ❌ NO IMPLEMENTADO

## RESUMEN DE ESTADO

- ✅ **Implementadas:** 9 situaciones
- ❌ **No implementadas:** 13+ situaciones

## PRIORIDADES DE IMPLEMENTACIÓN

### Alta Prioridad:
1. Cliente confirma servicio completado → Técnico y Coordinador
2. Cliente cancela orden → Coordinador, Técnico, Agente
3. Técnico inicia trabajo → Cliente y Coordinador
4. Técnico reporta impedimento → Coordinador
5. Agente valida/acepta orden → Cliente y Coordinador

### Media Prioridad:
1. Coordinador aprueba/rechaza reprogramación → Cliente y Técnico
2. Coordinador resuelve impedimento → Técnico y Cliente
3. Cliente crea nueva orden → Agente

### Baja Prioridad:
1. Recordatorios automáticos
2. Notificaciones de órdenes vencidas
3. Notificaciones administrativas generales

