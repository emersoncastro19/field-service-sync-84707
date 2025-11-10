# 📝 Cómo Actualizar los Valores de Uso de Supabase

## 📋 Instrucciones para Actualizar

Cuando tengas las imágenes del dashboard de Supabase, sigue estos pasos:

### Paso 1: Identificar los Valores

De las imágenes que me pases, necesito estos valores:

1. **Database Size**: El tamaño de la base de datos (en GB)
2. **Egress**: El tráfico de salida (en GB)
3. **Storage Size**: El tamaño del almacenamiento (en GB)
4. **Edge Function Invocations**: Número de invocaciones de funciones
5. **Realtime Concurrent Peak Connections**: Conexiones concurrentes pico
6. **Monthly Active Users (MAU)**: Usuarios activos mensuales (si aparece)
7. **Cached Egress**: Egress en caché (si aparece)

### Paso 2: Actualizar el Archivo

1. Abre: `src/shared/utils/supabaseUsage.ts`
2. Busca la constante `ejemploUsoActual`
3. Actualiza los valores con los números exactos de las imágenes

### Paso 3: Formato de los Valores

- **Database Size**: Si dice "0.027 GB", usa `0.027`
- **Egress**: Si dice "0.006 GB", usa `0.006`
- **Storage Size**: Si dice "0 GB", usa `0`
- **Edge Functions**: Si dice "20", usa `20`
- **Realtime Connections**: Si dice "0", usa `0`

### Ejemplo:

```typescript
export const ejemploUsoActual: UsageCurrent = {
  databaseSize: 0.027,    // De la imagen: "Database Size: 0.027 GB"
  egress: 0.006,          // De la imagen: "Egress: 0.006 GB"
  storageSize: 0,         // De la imagen: "Storage Size: 0 GB"
  edgeFunctions: 20,      // De la imagen: "Edge Function Invocations: 20"
  realtimeConnections: 0, // De la imagen: "Realtime Concurrent Peak Connections: 0"
};
```

---

## 🔍 Qué Buscar en las Imágenes

Cuando me pases las imágenes, revisaré:

1. ✅ Los valores numéricos exactos
2. ✅ Las unidades (GB, MB, etc.)
3. ✅ Los límites si aparecen
4. ✅ Cualquier advertencia o mensaje importante
5. ✅ El ciclo de facturación actual

---

## 📊 Valores Actuales (Basados en la Primera Imagen)

```typescript
export const ejemploUsoActual: UsageCurrent = {
  databaseSize: 0.027,    // ✅ Confirmado
  egress: 0.006,          // ✅ Confirmado
  storageSize: 0,         // ✅ Confirmado
  edgeFunctions: 20,      // ✅ Confirmado
  realtimeConnections: 0, // ✅ Confirmado
};
```

---

## 🎯 Después de Actualizar

Una vez que actualice los valores:

1. El componente `SupabaseUsageMonitor` mostrará los valores actualizados
2. Las barras de progreso se actualizarán automáticamente
3. Los porcentajes se calcularán correctamente
4. Las advertencias se mostrarán si es necesario

---

**Esperando las imágenes para actualizar los valores...** 📸





