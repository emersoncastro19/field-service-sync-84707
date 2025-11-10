# 📊 Cómo Ver el Uso Restante de Supabase

## 🎯 Respuesta Rápida

Según la imagen que compartiste, **tienes mucho uso disponible**:

### ✅ Tu Uso Actual (Muy Bajo)
- **Database Size**: 0.027 GB de 0.5 GB (500 MB) → **94.6% disponible**
- **Egress**: 0.006 GB de 5 GB → **99.88% disponible**
- **Storage**: 0 GB de 1 GB → **100% disponible**
- **Edge Functions**: 20 de 500,000 → **99.996% disponible**

### 📋 Límites del Plan Free de Supabase

| Recurso | Límite del Plan Free | Tu Uso | Disponible |
|---------|---------------------|--------|------------|
| **Database Size** | 500 MB (0.5 GB) | 27 MB (0.027 GB) | **473 MB restantes** ✅ |
| **Egress** | 5 GB | 6 MB (0.006 GB) | **4.994 GB restantes** ✅ |
| **Storage** | 1 GB | 0 GB | **1 GB restantes** ✅ |
| **Edge Functions** | 500,000/mes | 20 | **499,980 restantes** ✅ |
| **API Requests** | 50,000/mes | Desconocido* | Variable |

*Los API requests no aparecen en la página de Usage, pero se estiman en 50,000/mes para el plan Free.

---

## 🔍 Cómo Ver los Límites Exactos en Supabase

### Paso 1: Ve a la Página de Usage
1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto: **sistema-ordenes-inter**
3. Ve a **Settings** → **Usage**

### Paso 2: Ver Todos los Proyectos
1. En el dropdown de proyectos, selecciona **"All Projects"**
2. Esto te mostrará el uso agregado de TODOS tus proyectos
3. Compara con los límites del plan Free

### Paso 3: Ver los Límites del Plan
1. En la página de Usage, busca el enlace **"Supabase Plans"**
2. O ve directamente a: [Supabase Pricing](https://supabase.com/pricing)
3. Ahí verás los límites exactos del plan Free

---

## 📱 Usar el Monitor de Uso en el Software

He creado un componente que puedes usar en tu dashboard para ver el uso en tiempo real.

### Opción 1: Agregar al Dashboard del Admin

Agrega esto al archivo `src/frontend/pages/Admin.tsx`:

```tsx
import SupabaseUsageMonitor from '@/frontend/components/SupabaseUsageMonitor';

// Dentro del componente Admin, agrega:
<SupabaseUsageMonitor />
```

### Opción 2: Actualizar los Valores Manualmente

Los valores se actualizan desde `src/utils/supabaseUsage.ts`:

```typescript
export const ejemploUsoActual: UsageCurrent = {
  databaseSize: 0.027, // Actualiza con el valor de tu dashboard
  egress: 0.006,        // Actualiza con el valor de tu dashboard
  storageSize: 0,       // Actualiza con el valor de tu dashboard
  edgeFunctions: 20,    // Actualiza con el valor de tu dashboard
  // ...
};
```

---

## 🚨 Cuándo Preocuparte

### ✅ Estás Bien Si:
- Database Size < 400 MB (80% del límite)
- Egress < 4 GB (80% del límite)
- Storage < 800 MB (80% del límite)
- Edge Functions < 400,000 (80% del límite)

### ⚠️ Advertencia Si:
- Database Size > 450 MB (90% del límite)
- Egress > 4.5 GB (90% del límite)
- Storage > 900 MB (90% del límite)
- Edge Functions > 450,000 (90% del límite)

### 🔴 Crítico Si:
- Cualquier métrica está por encima del 95% del límite
- Recibes errores `429 Too Many Requests`
- El servicio comienza a fallar

---

## 💡 Recomendaciones

1. **Monitorea Semanalmente**: Revisa el uso una vez por semana
2. **Actualiza los Valores**: Si usas el componente, actualiza los valores manualmente desde el dashboard
3. **Planifica el Crecimiento**: Si el uso crece rápidamente, considera actualizar tu plan
4. **Optimiza Consultas**: Reduce el uso de la base de datos optimizando consultas

---

## 📞 Si Alcanzas el Límite

1. **Espera al Próximo Ciclo**: Los límites se reinician cada mes
2. **Actualiza tu Plan**: Considera el plan Pro ($25/mes) si necesitas más recursos
3. **Optimiza el Código**: Reduce consultas innecesarias y optimiza el uso de almacenamiento

---

**Última actualización**: Basado en tu uso del 20 de octubre de 2025





