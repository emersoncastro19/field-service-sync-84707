/**
 * Utilidad para manejar y diagnosticar errores de Supabase
 */

export interface ErrorInfo {
  tipo: 'red' | 'autenticacion' | 'limite' | 'servidor' | 'datos' | 'desconocido';
  mensaje: string;
  solucion: string;
  esCritico: boolean;
}

/**
 * Analiza un error de Supabase y devuelve información útil
 */
export const analizarErrorSupabase = (error: any): ErrorInfo => {
  // Si es un error de red
  if (!error || error.message?.includes('Network') || error.message?.includes('fetch')) {
    return {
      tipo: 'red',
      mensaje: 'Error de conexión a la base de datos',
      solucion: 'Verifica tu conexión a internet y recarga la página',
      esCritico: true
    };
  }

  // Si es un error de límite (429)
  if (error.code === 'PGRST301' || error.status === 429 || error.message?.includes('429')) {
    return {
      tipo: 'limite',
      mensaje: 'Se alcanzó el límite de solicitudes a la base de datos',
      solucion: 'Has alcanzado el límite de tu plan de Supabase. Espera unos minutos o actualiza tu plan.',
      esCritico: true
    };
  }

  // Si es un error de autenticación (401, 403)
  if (error.code === 'PGRST116' || error.status === 401 || error.status === 403 || 
      error.message?.includes('permission') || error.message?.includes('Unauthorized')) {
    return {
      tipo: 'autenticacion',
      mensaje: 'Error de autenticación o permisos',
      solucion: 'Tu sesión ha expirado. Por favor, cierra sesión y vuelve a ingresar.',
      esCritico: true
    };
  }

  // Si es un error del servidor (500, 502, 503)
  if (error.status >= 500 || error.code?.includes('500')) {
    return {
      tipo: 'servidor',
      mensaje: 'Error del servidor de base de datos',
      solucion: 'El servidor está experimentando problemas. Intenta de nuevo en unos minutos.',
      esCritico: true
    };
  }

  // Si es un error de datos (404, datos no encontrados)
  if (error.code === 'PGRST116' || error.status === 404 || error.message?.includes('not found')) {
    return {
      tipo: 'datos',
      mensaje: 'No se encontraron los datos solicitados',
      solucion: 'Los datos que buscas no existen. Verifica que la información sea correcta.',
      esCritico: false
    };
  }

  // Error desconocido
  return {
    tipo: 'desconocido',
    mensaje: error.message || 'Error desconocido',
    solucion: 'Recarga la página. Si el problema persiste, contacta al administrador.',
    esCritico: true
  };
};

/**
 * Obtiene un mensaje de error amigable para el usuario
 */
export const obtenerMensajeError = (error: any): string => {
  const info = analizarErrorSupabase(error);
  return info.mensaje;
};

/**
 * Obtiene una sugerencia de solución para el usuario
 */
export const obtenerSolucionError = (error: any): string => {
  const info = analizarErrorSupabase(error);
  return info.solucion;
};

/**
 * Verifica si el error es crítico (requiere acción inmediata)
 */
export const esErrorCritico = (error: any): boolean => {
  const info = analizarErrorSupabase(error);
  return info.esCritico;
};

/**
 * Logs detallados del error para debugging
 */
export const logErrorDetallado = (error: any, contexto: string = '') => {
  const info = analizarErrorSupabase(error);
  
  console.group(`🔴 Error en ${contexto || 'operación'}`);
  console.error('Tipo:', info.tipo);
  console.error('Mensaje:', info.mensaje);
  console.error('Solución:', info.solucion);
  console.error('Error original:', error);
  console.error('Código:', error.code);
  console.error('Estado HTTP:', error.status);
  console.error('Mensaje completo:', error.message);
  console.groupEnd();

  return info;
};




