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
 * Estos son los límites estándar del plan gratuito
 */
export const FREE_PLAN_LIMITS: UsageLimits = {
  databaseSize: 0.5, // 500 MB = 0.5 GB
  egress: 5, // 5 GB (adicionales compartidos)
  storageSize: 1, // 1 GB
  edgeFunctions: 500000, // 500,000 invocations/mes
  apiRequests: 50000, // 50,000 requests/mes (estimado)
  realtimeConnections: 200, // 200 conexiones concurrentes
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

  // Si hay API requests, calcularlos
  if (usoActual.apiRequests !== undefined && limites.apiRequests) {
    restante.apiRequests = Math.max(0, limites.apiRequests - usoActual.apiRequests);
    restante.percentages.apiRequests = Math.round(
      (restante.apiRequests / limites.apiRequests) * 100
    );
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
 * Ejemplo de uso actual basado en lo que mostraste en la imagen
 * Puedes actualizar estos valores desde el dashboard de Supabase
 */
export const ejemploUsoActual: UsageCurrent = {
  databaseSize: 0.027, // 0.027 GB según tu imagen
  egress: 0.006, // 0.006 GB según tu imagen
  storageSize: 0, // 0 GB según tu imagen
  edgeFunctions: 20, // 20 invocations según tu imagen
  realtimeConnections: 0, // 0 según tu imagen
  // apiRequests no aparece en tu imagen, pero puedes estimarlo
  // basado en las llamadas que haces desde tu aplicación
};




