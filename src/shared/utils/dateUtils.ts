/**
 * Utilidades para manejo de fechas en hora de Venezuela (UTC-4)
 * Estas funciones garantizan que las fechas se manejen correctamente
 * sin importar la zona horaria del navegador del usuario
 */

/**
 * Normaliza una fecha UTC para forzar interpretación como UTC
 * PROBLEMA: Supabase devuelve fechas como "2025-11-12T15:15:00" (sin Z)
 * JavaScript interpreta esto como hora LOCAL, no UTC
 * SOLUCIÓN: Agregar 'Z' al final si no la tiene para forzar interpretación como UTC
 * @param fechaUTC ISO string en UTC (desde la base de datos)
 * @returns String normalizado con 'Z' al final si no la tenía
 */
function normalizarFechaUTC(fechaUTC: string): string {
  if (!fechaUTC) return fechaUTC;
  
  const fechaTrimmed = fechaUTC.trim();
  
  // Si ya termina en 'Z' o tiene offset (+/-), devolverla tal cual
  if (fechaTrimmed.endsWith('Z') || fechaTrimmed.match(/[+-]\d{2}:\d{2}$/)) {
    return fechaTrimmed;
  }
  
  // Si no tiene 'Z' ni offset, agregar 'Z' para forzar interpretación como UTC
  return fechaTrimmed + 'Z';
}

/**
 * Convierte una fecha UTC string a Date object, normalizándola primero
 * @param fechaUTC ISO string en UTC (desde la base de datos)
 * @returns Date object que representa la fecha en UTC
 */
export function parsearFechaUTC(fechaUTC: string): Date {
  const fechaNormalizada = normalizarFechaUTC(fechaUTC);
  return new Date(fechaNormalizada);
}

/**
 * Crea una fecha ISO string en UTC desde una fecha y hora de Venezuela
 * @param fechaCita Fecha en formato YYYY-MM-DD
 * @param horaCita Hora en formato HH:MM (24 horas)
 * @returns ISO string en UTC para guardar en la base de datos
 */
export function crearFechaVenezuelaUTC(fechaCita: string, horaCita: string): string {
  const [year, month, day] = fechaCita.split('-').map(Number);
  const [hours, minutes] = horaCita.split(':').map(Number);
  
  // SOLUCIÓN DEFINITIVA: Crear la fecha manualmente calculando UTC desde hora de Venezuela
  // En lugar de usar formato ISO con offset (que puede tener problemas en algunos navegadores),
  // calculamos manualmente la conversión: Hora Venezuela (UTC-4) → UTC
  
  // Venezuela está en UTC-4, así que si el usuario ingresa 9:55 AM en Venezuela,
  // en UTC son las 13:55 (9:55 + 4 horas = 13:55)
  
  // Crear Date object usando Date.UTC() para crear directamente en UTC
  // Date.UTC() acepta: año, mes (0-indexed), día, hora, minuto, segundo, milisegundo
  // Sumamos 4 horas a la hora ingresada para convertir de hora de Venezuela a UTC
  const fechaUTC = new Date(Date.UTC(year, month - 1, day, hours + 4, minutes, 0, 0));
  
  // Convertir a ISO string (UTC) para almacenar en la base de datos
  const fechaProgramada = fechaUTC.toISOString();
  
  return fechaProgramada;
}

/**
 * Convierte una fecha UTC a hora de Venezuela
 * @param fechaUTC ISO string en UTC (desde la base de datos)
 * @returns Date object que representa la fecha en hora de Venezuela
 */
export function convertirUTCaVenezuela(fechaUTC: string): Date {
  return parsearFechaUTC(fechaUTC);
}

/**
 * Formatea una fecha UTC para mostrar en hora de Venezuela
 * @param fechaUTC ISO string en UTC (desde la base de datos)
 * @param options Opciones de formato (opcional)
 * @returns String formateado en hora de Venezuela
 */
export function formatearFechaVenezuela(
  fechaUTC: string, 
  options?: Intl.DateTimeFormatOptions
): string {
  // Normalizar la fecha para forzar interpretación como UTC
  const fecha = parsearFechaUTC(fechaUTC);
  
  // Verificar que la fecha es válida
  if (isNaN(fecha.getTime())) {
    console.error('⚠️ formatearFechaVenezuela: fechaUTC no es una fecha válida:', fechaUTC);
    return '';
  }
  
  // Si se proporcionan opciones personalizadas
  if (options) {
    // Verificar si las opciones incluyen hora o minuto
    const incluyeHora = 'hour' in options || 'minute' in options;
    
    // Construir opciones finales solo con lo que se necesita
    const opcionesFinales: Intl.DateTimeFormatOptions = {
      ...options,
      timeZone: 'America/Caracas' // Forzar timeZone siempre
    };
    
    // Si incluye hora, usar toLocaleString; si no, usar toLocaleDateString
    if (incluyeHora) {
      return fecha.toLocaleString('es-VE', opcionesFinales);
    } else {
      // Para solo fecha, usar toLocaleDateString y asegurar que no incluya hora
      return fecha.toLocaleDateString('es-VE', opcionesFinales);
    }
  } else {
    // Sin opciones, usar opciones por defecto con hora
    const opcionesDefault: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Caracas',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return fecha.toLocaleString('es-VE', opcionesDefault);
  }
}

/**
 * Formatea solo la hora en Venezuela
 * @param fechaUTC ISO string en UTC (desde la base de datos)
 * @returns String con la hora formateada (ej: "09:55 AM")
 */
export function formatearHoraVenezuela(fechaUTC: string): string {
  // Asegurar que fechaUTC es un string válido
  if (!fechaUTC) {
    console.error('⚠️ formatearHoraVenezuela: fechaUTC es null o undefined');
    return '';
  }
  
  // Normalizar la fecha para forzar interpretación como UTC
  const fecha = parsearFechaUTC(fechaUTC);
  
  // Verificar que la fecha es válida
  if (isNaN(fecha.getTime())) {
    console.error('⚠️ formatearHoraVenezuela: fechaUTC no es una fecha válida:', fechaUTC);
    return '';
  }
  
  // Formatear en hora de Venezuela
  // Usamos formato 'en-US' para evitar problemas de formato en español
  const horaFormateada = fecha.toLocaleTimeString('en-US', {
    timeZone: 'America/Caracas',
    hour12: true,
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return horaFormateada;
}

/**
 * Formatea solo la fecha en Venezuela
 * @param fechaUTC ISO string en UTC (desde la base de datos)
 * @returns String con la fecha formateada (ej: "15 de enero de 2025")
 */
export function formatearSoloFechaVenezuela(fechaUTC: string): string {
  // Normalizar la fecha para forzar interpretación como UTC
  const fecha = parsearFechaUTC(fechaUTC);
  
  // Verificar que la fecha es válida
  if (isNaN(fecha.getTime())) {
    console.error('⚠️ formatearSoloFechaVenezuela: fechaUTC no es una fecha válida:', fechaUTC);
    return '';
  }
  
  return fecha.toLocaleDateString('es-VE', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Obtiene la fecha y hora actual en Venezuela y la convierte a UTC para guardar en la base de datos
 * @returns ISO string en UTC que representa la fecha/hora actual en Venezuela
 */
export function obtenerFechaActualVenezuelaUTC(): string {
  // Obtener la fecha actual
  const ahora = new Date();
  
  // Obtener los componentes de fecha/hora en Venezuela usando Intl.DateTimeFormat
  // Esto garantiza que siempre obtenemos la hora correcta de Venezuela, sin importar
  // la zona horaria del navegador
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Obtener los componentes formateados
  const partes = formatter.formatToParts(ahora);
  
  // Extraer los componentes
  const año = parseInt(partes.find(p => p.type === 'year')?.value || '0', 10);
  const mes = parseInt(partes.find(p => p.type === 'month')?.value || '0', 10) - 1; // Mes es 0-indexed
  const dia = parseInt(partes.find(p => p.type === 'day')?.value || '0', 10);
  const horas = parseInt(partes.find(p => p.type === 'hour')?.value || '0', 10);
  const minutos = parseInt(partes.find(p => p.type === 'minute')?.value || '0', 10);
  const segundos = parseInt(partes.find(p => p.type === 'second')?.value || '0', 10);
  
  // Crear fecha UTC directamente usando los componentes de Venezuela
  // Venezuela está en UTC-4, así que si son las 6:12 PM (18:12) en Venezuela,
  // en UTC son las 10:12 PM (22:12). Por lo tanto, sumamos 4 horas.
  const fechaUTCGuardar = new Date(Date.UTC(año, mes, dia, horas + 4, minutos, segundos));
  
  return fechaUTCGuardar.toISOString();
}

/**
 * Verifica si una fecha UTC corresponde a una hora específica en Venezuela
 * @param fechaUTC ISO string en UTC (desde la base de datos)
 * @param horaEsperada Hora esperada en formato HH:MM (24 horas)
 * @returns true si la hora coincide
 */
export function verificarHoraVenezuela(fechaUTC: string, horaEsperada: string): boolean {
  // Normalizar la fecha para forzar interpretación como UTC
  const fecha = parsearFechaUTC(fechaUTC);
  
  // Verificar que la fecha es válida
  if (isNaN(fecha.getTime())) {
    console.error('⚠️ verificarHoraVenezuela: fechaUTC no es una fecha válida:', fechaUTC);
    return false;
  }
  
  // Obtener hora en formato 24 horas (HH:MM) en Venezuela
  const horaEnVenezuela = fecha.toLocaleTimeString('en-US', {
    timeZone: 'America/Caracas',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Normalizar hora esperada (asegurar formato HH:MM)
  // Si la hora esperada es "9:55", convertir a "09:55"
  const partesHora = horaEsperada.split(':');
  const horaEsperadaNormalizada = partesHora.length === 2
    ? `${String(parseInt(partesHora[0])).padStart(2, '0')}:${String(parseInt(partesHora[1])).padStart(2, '0')}`
    : `${horaEsperada.padStart(2, '0')}:00`;
  
  // Comparar
  const coincide = horaEnVenezuela === horaEsperadaNormalizada;
  
  return coincide;
}

