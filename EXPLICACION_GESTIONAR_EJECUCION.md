# 📋 Explicación: Gestionar Ejecución de Servicio

## 🎯 ¿Qué es "Gestionar Ejecución de Servicio"?

"Gestionar Ejecución de Servicio" es el módulo donde el **técnico** controla el progreso del trabajo en una orden asignada. Es como el "centro de control" del técnico durante la ejecución del servicio.

---

## 🔄 Flujo Completo del Técnico

### 1️⃣ **Ver Órdenes Asignadas**
- El técnico ve todas las órdenes que el coordinador le asignó
- Estado: "Asignada" o "En Proceso"
- Ve información del cliente, dirección, tipo de servicio

### 2️⃣ **Iniciar Trabajo** (Botón "Iniciar Trabajo")
**¿Qué hace?**
- Marca el inicio del trabajo en el sistema
- Crea un registro en la tabla `ejecuciones_servicio` con:
  - `fecha_inicio`: Fecha y hora actual
  - `id_tecnico`: ID del técnico
  - `id_orden`: ID de la orden
  - `estado_resultado`: "Pendiente" (inicialmente)
- Cambia el estado de la orden de "Asignada" a "En Proceso"
- Registra la acción en `logs_auditoria`

**¿Cuándo se usa?**
- Cuando el técnico llega al lugar del servicio
- Cuando comienza a trabajar físicamente

---

### 3️⃣ **Trabajo Realizado** (Campo de texto)
**¿Qué es?**
- Un resumen breve del trabajo realizado
- Se escribe cuando el técnico finaliza el trabajo
- Es obligatorio para poder finalizar

**Ejemplos:**
- "Cambio de módem, revisión del cableado, prueba de conexión"
- "Instalación de router, configuración de red, prueba de velocidad"
- "Reparación de línea, cambio de conector, verificación de señal"

**¿Dónde se guarda?**
- Se guarda en `ejecuciones_servicio.trabajo_realizado`
- Se usa cuando el técnico hace clic en "Finalizar Trabajo"

---

### 4️⃣ **Finalizar Trabajo** (Botón "Finalizar Trabajo")
**¿Qué hace?**
- Actualiza `ejecuciones_servicio` con:
  - `fecha_fin`: Fecha y hora actual
  - `trabajo_realizado`: El texto que escribió el técnico
  - `estado_resultado`: "Completado"
  - `confirmacion_cliente`: "Pendiente" (esperando confirmación del cliente)
- Cambia el estado de la orden a "Completada (pendiente de confirmación)"
- Crea una notificación al cliente para que confirme el servicio
- Registra la acción en `logs_auditoria`

**¿Cuándo se usa?**
- Cuando el técnico termina el trabajo físicamente
- Después de escribir el resumen en "Trabajo Realizado"

---

### 5️⃣ **Documentar** (Botón "Documentar")
**¿Qué es?**
- Un módulo separado para documentación detallada
- Permite agregar información adicional al trabajo

**Campos:**
- **Resumen del Trabajo**: El mismo que se usa en "Finalizar Trabajo" (se sincroniza)
- **Repuestos Utilizados**: Lista de materiales y repuestos usados
- **Recomendaciones**: Sugerencias para el cliente

**¿Cuándo se usa?**
- Durante o después de finalizar el trabajo
- Para agregar detalles adicionales que no caben en el resumen breve
- Para registrar evidencias y notas del servicio

**¿Dónde se guarda?**
- Se guarda en `ejecuciones_servicio.trabajo_realizado` (combinando todos los campos)
- Se puede usar múltiples veces (se actualiza la documentación)

---

## 🔍 Diferencia entre "Trabajo Realizado" y "Documentar"

### **"Trabajo Realizado" (en Gestionar Ejecución)**
- **Propósito**: Resumen breve y rápido
- **Uso**: Obligatorio para finalizar el trabajo
- **Contenido**: Descripción concisa del trabajo
- **Cuándo**: Al finalizar el trabajo

### **"Documentar" (módulo separado)**
- **Propósito**: Documentación detallada y completa
- **Uso**: Opcional, pero recomendado
- **Contenido**: 
  - Resumen del trabajo (sincronizado con "Trabajo Realizado")
  - Repuestos utilizados
  - Recomendaciones
- **Cuándo**: Durante o después de finalizar (se puede actualizar)

**Analogía:**
- **"Trabajo Realizado"** = Resumen ejecutivo (1 párrafo)
- **"Documentar"** = Reporte completo (múltiples secciones)

---

## 📊 Estados de la Orden

1. **"Asignada"** → El coordinador asignó un técnico, pero el técnico aún no ha iniciado
2. **"En Proceso"** → El técnico inició el trabajo (hizo clic en "Iniciar Trabajo")
3. **"Completada (pendiente de confirmación)"** → El técnico finalizó, esperando confirmación del cliente
4. **"Completada"** → El cliente confirmó el servicio

---

## 🎯 Resumen Visual

```
┌─────────────────────────────────────┐
│  Orden Asignada (Estado: Asignada)  │
└─────────────────────────────────────┘
              ↓
    [Iniciar Trabajo] ← Técnico llega al lugar
              ↓
┌─────────────────────────────────────┐
│  Orden En Proceso (Estado: En Proceso)  │
└─────────────────────────────────────┘
              ↓
    [Escribir Trabajo Realizado]
              ↓
    [Finalizar Trabajo] ← Técnico termina
              ↓
┌─────────────────────────────────────┐
│  Orden Completada (pendiente confirmación)  │
└─────────────────────────────────────┘
              ↓
    [Documentar] ← Agregar detalles (opcional)
              ↓
    Cliente confirma → Estado: "Completada"
```

---

## 💡 Ejemplo Práctico

**Escenario**: Técnico recibe una orden de reparación de Internet

1. **Ver Orden**: Ve la orden asignada en "Gestionar Ejecución"
2. **Llegar al Lugar**: Va a la dirección del cliente
3. **Iniciar Trabajo**: Hace clic en "Iniciar Trabajo" → Estado cambia a "En Proceso"
4. **Trabajar**: Realiza la reparación (cambia módem, revisa cableado)
5. **Finalizar**: 
   - Escribe en "Trabajo Realizado": "Cambio de módem, revisión de cableado, prueba de conexión exitosa"
   - Hace clic en "Finalizar Trabajo" → Estado cambia a "Completada (pendiente de confirmación)"
6. **Documentar** (opcional):
   - Va a "Documentar"
   - Agrega: "Repuestos: 1 módem nuevo, 2 conectores"
   - Agrega: "Recomendación: Revisar cableado cada 6 meses"
   - Guarda la documentación
7. **Cliente Confirma**: El cliente confirma el servicio → Estado: "Completada"

---

## ❓ Preguntas Frecuentes

**¿Puedo iniciar el trabajo sin haber llegado al lugar?**
- Técnicamente sí, pero es mejor iniciar cuando llegas para tener un registro preciso.

**¿Qué pasa si olvido escribir el trabajo realizado?**
- No podrás finalizar el trabajo (el campo es obligatorio).

**¿Puedo documentar antes de finalizar?**
- Sí, puedes documentar en cualquier momento después de iniciar el trabajo.

**¿Puedo actualizar la documentación después de guardarla?**
- Sí, puedes volver a "Documentar" y actualizar la información.

**¿Qué pasa si el cliente rechaza el servicio?**
- El estado vuelve a "En Proceso" y se notifica al coordinador para revisión.

---

## 🔧 Funcionalidades Técnicas

- **Manejo de Zona Horaria**: Las fechas se guardan en UTC y se muestran en hora local
- **Notificaciones Automáticas**: Se crean notificaciones cuando se finaliza el trabajo
- **Logs de Auditoría**: Todas las acciones se registran en `logs_auditoria`
- **Sincronización**: El campo "Trabajo Realizado" se sincroniza entre "Gestionar Ejecución" y "Documentar"

---

## 📝 Notas Importantes

1. **El técnico solo ve sus propias órdenes** (filtradas por `id_tecnico_asignado`)
2. **Solo puede gestionar órdenes en estado "Asignada" o "En Proceso"**
3. **Una vez finalizado, el técnico no puede modificar el trabajo** (solo documentar)
4. **La confirmación del cliente es necesaria** para cerrar completamente la orden

