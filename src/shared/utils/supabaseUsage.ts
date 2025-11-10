/**
 * Utilidad para monitorear el uso de Supabase
 * Calcula cuánto uso queda basado en los límites del plan Free
 */

export interface UsageLimits {
  databaseSize: number; // GB
  egress: number; // GB
  storageSize: number; // GB
  edgeFunctions: number; // invocations
  apiRequests: number; // requests/month
  realtimeConnections: number; // concurrent connections
}

export interface UsageCurrent {
  databaseSize: number; // GB
  egress: number; // GB
  storageSize: number; // GB
  edgeFunctions: number; // invocations
  apiRequests?: number; // requests/month (estimado)
  realtimeConnections: number; // concurrent connections
}

export interface UsageRemaining {
  databaseSize: number; // GB
  egress: number; // GB
  storageSize: number; // GB
  edgeFunctions: number; // invocations
  apiRequests?: number; // requests/month
  realtimeConnections: number; // concurrent connections
  percentages: {
    databaseSize: number; // %
    egress: number; // %
    storageSize: number; // %
    edgeFunctions: number; // %
    apiRequests?: number; // %
    realtimeConnections: number; // %
  };
}

/**
 * Límites del plan Free de Supabase
 * Valores confirmados desde la imagen del plan Free
 * 
 * Plan Free incluye:
 * - Unlimited API requests (no hay límite)
 * - 50,000 monthly active users
 * - 500 MB database size (0.5 GB)
 * - 5 GB egress
 * - 5 GB cached egress
 * - 1 GB file storage
 * - Community support
 * 
 * Limitaciones adicionales:
 * - Free projects are paused after 1 week of inactivity
 * - Limit of 2 active projects
 */
export const FREE_PLAN_LIMITS: UsageLimits = {
  databaseSize: 0.5, // 500 MB = 0.5 GB (confirmado en imagen del plan)
  egress: 5, // 5 GB (confirmado en imagen del plan)
  storageSize: 1, // 1 GB file storage (confirmado en imagen del plan)
  edgeFunctions: 500000, // 500,000 invocations/mes (límite estándar, no visible en imagen pero típico)
  apiRequests: Infinity, // Unlimited API requests (confirmado: "Unlimited API requests")
  realtimeConnections: 200, // 200 conexiones concurrentes (límite estándar de Realtime)
};

/**
 * Calcula el uso restante basado en el uso actual y los límites
 */
export const calcularUsoRestante = (
  usoActual: UsageCurrent,
  limites: UsageLimits = FREE_PLAN_LIMITS
): UsageRemaining => {
  const restante: UsageRemaining = {
    databaseSize: Math.max(0, limites.databaseSize - usoActual.databaseSize),
    egress: Math.max(0, limites.egress - usoActual.egress),
    storageSize: Math.max(0, limites.storageSize - usoActual.storageSize),
    edgeFunctions: Math.max(0, limites.edgeFunctions - usoActual.edgeFunctions),
    realtimeConnections: Math.max(0, limites.realtimeConnections - usoActual.realtimeConnections),
    percentages: {
      databaseSize: 0,
      egress: 0,
      storageSize: 0,
      edgeFunctions: 0,
      realtimeConnections: 0,
    },
  };

  // Calcular porcentajes
  restante.percentages.databaseSize = Math.round(
    (restante.databaseSize / limites.databaseSize) * 100
  );
  restante.percentages.egress = Math.round(
    (restante.egress / limites.egress) * 100
  );
  restante.percentages.storageSize = Math.round(
    (restante.storageSize / limites.storageSize) * 100
  );
  restante.percentages.edgeFunctions = Math.round(
    (restante.edgeFunctions / limites.edgeFunctions) * 100
  );
  restante.percentages.realtimeConnections = Math.round(
    (restante.realtimeConnections / limites.realtimeConnections) * 100
  );

  // Si hay API requests y hay límite, calcularlos
  // Nota: El plan Free tiene "Unlimited API requests", así que no hay límite
  if (usoActual.apiRequests !== undefined && limites.apiRequests && limites.apiRequests !== Infinity) {
    restante.apiRequests = Math.max(0, limites.apiRequests - usoActual.apiRequests);
    restante.percentages.apiRequests = Math.round(
      (restante.apiRequests / limites.apiRequests) * 100
    );
  } else if (limites.apiRequests === Infinity) {
    // Si es ilimitado, establecer valores especiales
    restante.apiRequests = Infinity;
    restante.percentages.apiRequests = 100; // Siempre 100% disponible
  }

  return restante;
};

/**
 * Formatea bytes a formato legible
 */
export const formatearBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Formatea GB a formato legible
 */
export const formatearGB = (gb: number, decimals: number = 3): string => {
  if (gb < 0.001) {
    return `${(gb * 1024).toFixed(decimals)} MB`;
  }
  return `${gb.toFixed(decimals)} GB`;
};

/**
 * Obtiene el estado del uso (OK, ADVERTENCIA, CRÍTICO)
 */
export const obtenerEstadoUso = (porcentaje: number): 'ok' | 'advertencia' | 'critico' => {
  if (porcentaje >= 50) return 'ok';
  if (porcentaje >= 25) return 'advertencia';
  return 'critico';
};

/**
 * Obtiene el color según el estado del uso
 */
export const obtenerColorEstado = (porcentaje: number): string => {
  const estado = obtenerEstadoUso(porcentaje);
  switch (estado) {
    case 'ok':
      return 'text-green-600';
    case 'advertencia':
      return 'text-yellow-600';
    case 'critico':
      return 'text-red-600';
  }
};

/**
 * Uso actual REAL basado en las imágenes del dashboard de Supabase
 * Actualizado el: 2025-11-08
 * 
 * Valores extraídos del dashboard:
 * - Database Size: 25.79 MB = 0.02579 GB (de la imagen detallada)
 * - Egress: 0.006 GB (confirmado en múltiples imágenes)
 * - Storage Size: 0 GB (confirmado)
 * - Edge Function Invocations: 20 (confirmado en gráfico: 03 Nov=10, 05 Nov=7, 06 Nov=3)
 * - Realtime Messages: 0 (sin datos)
 * - Realtime Concurrent Peak Connections: 0 (sin datos)
 * - Monthly Active Users: 0 MAU (sin datos)
 * - Cached Egress: 0 GB (confirmado)
 * 
 * Plan: Free Plan
 * Ciclo de facturación: 20 Oct 2025 - 20 Nov 2025
 */
export const ejemploUsoActual: UsageCurrent = {
  databaseSize: 0.02579, // 25.79 MB (valor exacto de la imagen detallada)
  egress: 0.006,          // 0.006 GB (confirmado)
  storageSize: 0,         // 0 GB (confirmado - sin datos)
  edgeFunctions: 20,      // 20 invocations (03 Nov: 10, 05 Nov: 7, 06 Nov: 3)
  realtimeConnections: 0, // 0 (sin datos - "No data in period")
  // apiRequests: No disponible en el dashboard, pero el plan Free tiene "Unlimited API requests"
};

