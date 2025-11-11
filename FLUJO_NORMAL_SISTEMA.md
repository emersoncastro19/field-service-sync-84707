# Flujo Normal del Sistema de Gestión de Servicios Técnicos

## Resumen General

El sistema gestiona el ciclo completo de una orden de servicio, desde su creación por un cliente hasta su finalización y confirmación. El flujo involucra a diferentes roles: Cliente, Agente, Coordinador y Técnico.

---

## 🔄 Flujo Completo Paso a Paso

### 1️⃣ **Creación de Orden (Cliente)**

**Actor:** Cliente  
**Módulo:** Portal Cliente → "Solicitar Nueva Orden"

**Proceso:**
- El cliente accede al sistema e inicia sesión
- Navega a "Solicitar Nueva Orden"
- Completa el formulario con:
  - Tipo de servicio (Reparación, Instalación, etc.)
  - Descripción del problema (mínimo 20 caracteres)
  - Dirección de servicio (editable)
- El sistema automáticamente registra:
  - `fecha_solicitud`: Fecha actual
  - `tipo_cliente`: Residencial o Empresarial
  - `estado`: "Creada"
  - `prioridad`: "Media" (por defecto)
  - `id_agente_creador`: NULL (si es creada por cliente)

**Resultado en Base de Datos:**
- ✅ Nueva fila en `ORDENES_SERVICIO` con `estado = 'Creada'`
- ✅ Nueva fila en `LOGS_AUDITORIA` con acción "Creación de orden por cliente"

---

### 2️⃣ **Validación de Orden (Agente)**

**Actor:** Agente de Servicio  
**Módulo:** Agente → "Validar Órdenes"

**Proceso:**
- El agente ve las órdenes con estado "Creada"
- Revisa cada orden y verifica:
  - ✅ Cliente activo y sin deudas (`estado_cuenta = 'Activo'`)
  - ✅ Descripción clara (mínimo 20 caracteres)
  - ✅ Servicio aplicable según el plan del cliente
- Si todo está correcto:
  - Hace clic en "Validar Orden"
  - El sistema cambia el estado a "Validada"
- Si hay problemas:
  - Hace clic en "Rechazar"
  - Proporciona un motivo de rechazo
  - El estado cambia a "Cancelada"

**Resultado en Base de Datos:**
- ✅ `ORDENES_SERVICIO.estado = 'Validada'` (o 'Cancelada' si se rechaza)
- ✅ Nueva fila en `LOGS_AUDITORIA` con acción "VALIDAR_ORDEN" o "RECHAZAR_ORDEN"
- ✅ Nueva fila en `LOGS_AUDITORIA` con acción "NOTIFICAR_COORDINADOR" (si se valida)

---

### 3️⃣ **Asignación y Programación de Cita (Coordinador)**

**Actor:** Coordinador de Campo  
**Módulo:** Coordinador → "Asignar o Reasignar Órdenes"

**Proceso:**
- El coordinador ve las órdenes con estado "Validada"
- Para cada orden:
  - Consulta la zona de servicio del cliente
  - Revisa técnicos disponibles y sus especialidades
  - Selecciona un técnico disponible
  - Programa una cita:
    - Fecha de la cita
    - Hora de la cita
- Hace clic en "Asignar Técnico"

**Resultado en Base de Datos:**
- ✅ `ORDENES_SERVICIO.estado = 'Asignada'`
- ✅ `ORDENES_SERVICIO.id_tecnico_asignado = [id del técnico seleccionado]`
- ✅ `ORDENES_SERVICIO.fecha_asignacion = [fecha actual]`
- ✅ Nueva fila en `CITAS` con:
  - `id_orden`: ID de la orden
  - `fecha_programada`: Fecha y hora de la cita
  - `estado_cita`: "Programada"
- ✅ Nueva fila en `NOTIFICACIONES` para el cliente:
  - `tipo_notificacion`: "Cita Programada"
  - `mensaje`: "Se ha programado una cita para tu orden..."
- ✅ Nueva fila en `NOTIFICACIONES` para el técnico:
  - `tipo_notificacion`: "Asignación de Orden"
  - `mensaje`: "Se te ha asignado la orden..."
- ✅ Nueva fila en `LOGS_AUDITORIA` con acción "ASIGNAR_TECNICO"

---

### 4️⃣ **Ejecución del Servicio (Técnico)**

**Actor:** Técnico  
**Módulo:** Técnico → "Gestionar Ejecución"

**Proceso:**
- El técnico inicia sesión y ve sus órdenes asignadas
- Ve la cita programada en el módulo "Citas"
- Cuando llega al sitio:
  - Hace clic en "Iniciar Trabajo"
  - El sistema registra la hora de inicio
- Durante el trabajo:
  - Puede documentar con fotos y notas
  - Puede reportar impedimentos si es necesario
- Al terminar:
  - Hace clic en "Finalizar Trabajo"
  - Describe el trabajo realizado
  - El sistema registra la hora de finalización

**Resultado en Base de Datos:**
- ✅ Nueva fila en `EJECUCIONES_SERVICIO` con:
  - `id_orden`: ID de la orden
  - `id_tecnico`: ID del técnico
  - `fecha_inicio`: Hora de inicio
  - `estado_resultado`: "En Proceso"
- ✅ `ORDENES_SERVICIO.estado = 'En Proceso'` (al iniciar)
- ✅ `EJECUCIONES_SERVICIO.fecha_fin`: Hora de finalización (al terminar)
- ✅ `EJECUCIONES_SERVICIO.trabajo_realizado`: Descripción del trabajo
- ✅ `EJECUCIONES_SERVICIO.estado_resultado = 'Completado'`
- ✅ `EJECUCIONES_SERVICIO.confirmacion_cliente = 'Pendiente'`
- ✅ `ORDENES_SERVICIO.estado = 'Completada (pendiente de confirmación)'`
- ✅ `ORDENES_SERVICIO.fecha_completada = [fecha actual]`
- ✅ Nueva fila en `NOTIFICACIONES` para el cliente:
  - `tipo_notificacion`: "Servicio Completado"
  - `mensaje`: "El técnico ha completado el trabajo en tu orden..."
- ✅ Nueva fila en `LOGS_AUDITORIA` con acción "INICIAR_TRABAJO"
- ✅ Nueva fila en `LOGS_AUDITORIA` con acción "FINALIZAR_TRABAJO"

---

### 5️⃣ **Confirmación del Servicio (Cliente)**

**Actor:** Cliente  
**Módulo:** Cliente → "Mis Órdenes" → Detalles de la Orden

**Proceso:**
- El cliente recibe una notificación: "Su servicio ha sido completado"
- Accede a "Mis Órdenes" y ve la orden con estado "Completada (pendiente de confirmación)"
- Abre los detalles de la orden
- Revisa el trabajo realizado por el técnico
- Selecciona una opción:
  - ✅ **Confirmar Servicio**: El servicio fue realizado satisfactoriamente
  - ❌ **Rechazar Servicio**: Hay problemas con el servicio

**Resultado en Base de Datos (si confirma):**
- ✅ `EJECUCIONES_SERVICIO.confirmacion_cliente = 'Confirmada'`
- ✅ `ORDENES_SERVICIO.estado = 'Completada'`
- ✅ Nueva fila en `NOTIFICACIONES` para el técnico:
  - `tipo_notificacion`: "Confirmación de Servicio"
  - `mensaje`: "El cliente ha confirmado el servicio de la orden..."
- ✅ Nueva fila en `LOGS_AUDITORIA` con acción "CONFIRMAR_SERVICIO"

**Resultado en Base de Datos (si rechaza):**
- ✅ `EJECUCIONES_SERVICIO.confirmacion_cliente = 'Rechazada'`
- ✅ `ORDENES_SERVICIO.estado = 'En Proceso'` (para revisión del coordinador)
- ✅ Nueva fila en `NOTIFICACIONES` para el coordinador:
  - `tipo_notificacion`: "Servicio Rechazado"
  - `mensaje`: "El cliente ha rechazado el servicio de la orden..."
- ✅ Nueva fila en `NOTIFICACIONES` para el técnico:
  - `tipo_notificacion`: "Servicio Rechazado"
  - `mensaje`: "El cliente ha rechazado el servicio de la orden..."
- ✅ Nueva fila en `LOGS_AUDITORIA` con acción "RECHAZAR_SERVICIO"

---

### 6️⃣ **Cierre y Registro**

**Actor:** Sistema (Automático)

**Proceso:**
- El sistema genera automáticamente:
  - Logs de auditoría para todas las acciones
  - Notificaciones a los usuarios involucrados
  - Registros de citas y ejecuciones

**Resultado:**
- ✅ Toda la información queda disponible para:
  - Reportes de gestión
  - Módulo de auditoría
  - Análisis de rendimiento
  - Historial de servicios

---

## 📊 Estados de las Órdenes

| Estado | Descripción | Siguiente Paso |
|--------|-------------|----------------|
| **Creada** | Orden creada por el cliente | Validación por agente |
| **Validada** | Orden validada por agente | Asignación de técnico |
| **Asignada** | Técnico asignado, cita programada | Inicio de trabajo |
| **En Proceso** | Técnico inició el trabajo | Finalización de trabajo |
| **Completada (pendiente de confirmación)** | Trabajo terminado, esperando confirmación del cliente | Confirmación o rechazo |
| **Completada** | Servicio confirmado por el cliente | Cierre |
| **Cancelada** | Orden rechazada por agente | - |

---

## 🔔 Notificaciones Automáticas

| Evento | Notificado a | Tipo de Notificación |
|--------|--------------|---------------------|
| Asignación de técnico | Cliente y Técnico | "Cita Programada" / "Asignación de Orden" |
| Trabajo completado | Cliente | "Servicio Completado" |
| Servicio confirmado | Técnico | "Confirmación de Servicio" |
| Servicio rechazado | Coordinador y Técnico | "Servicio Rechazado" |

---

## 👥 Roles y Responsabilidades

### **Cliente**
- Crear órdenes de servicio
- Ver estado de sus órdenes
- Confirmar o rechazar servicios completados
- Ver citas programadas

### **Agente**
- Validar órdenes creadas por clientes
- Rechazar órdenes si no cumplen los requisitos
- Ver historial de órdenes validadas/rechazadas

### **Coordinador**
- Asignar técnicos a órdenes validadas
- Programar citas para los servicios
- Ver historial de asignaciones
- Gestionar impedimentos reportados

### **Técnico**
- Ver órdenes asignadas
- Ver citas programadas
- Iniciar y finalizar trabajos
- Documentar trabajos realizados
- Reportar impedimentos

### **Administrador**
- Gestionar usuarios y roles
- Ver reportes y estadísticas
- Ver auditoría del sistema
- Gestionar notificaciones

---

## 🔄 Diagrama de Flujo Simplificado

```
Cliente crea orden (Creada)
    ↓
Agente valida orden (Validada)
    ↓
Coordinador asigna técnico y cita (Asignada)
    ↓
Técnico inicia trabajo (En Proceso)
    ↓
Técnico finaliza trabajo (Completada - pendiente de confirmación)
    ↓
Cliente confirma servicio (Completada)
    ↓
Sistema registra y cierra
```

---

## 📝 Notas Importantes

1. **Validaciones:**
   - La descripción debe tener mínimo 20 caracteres
   - El cliente debe estar activo y sin deudas
   - El servicio debe ser aplicable según el plan del cliente

2. **Notificaciones:**
   - Se crean automáticamente en eventos clave
   - Aparecen en la campana de notificaciones
   - Se pueden marcar como leídas

3. **Auditoría:**
   - Todas las acciones se registran en `LOGS_AUDITORIA`
   - Incluye información de usuario, orden y descripción
   - Disponible para reportes y análisis

4. **Citas:**
   - Se crean automáticamente al asignar un técnico
   - Incluyen fecha y hora programada
   - Pueden ser reprogramadas si es necesario

---

## 🚀 Próximos Pasos

Este flujo asegura que:
- ✅ Las órdenes se validen antes de asignarse
- ✅ Los técnicos tengan toda la información necesaria
- ✅ Los clientes estén informados en cada paso
- ✅ Se registre toda la información para auditoría
- ✅ El sistema sea transparente y trazable


