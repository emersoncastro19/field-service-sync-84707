/**
 * Utilidad para probar la creación de notificaciones
 * Esta función puede ser llamada desde la consola del navegador para diagnosticar problemas
 */

import { supabase } from '@/backend/config/supabaseClient';

export const testCrearNotificacion = async (
  idDestinatario: number,
  idOrden: number | null = null,
  tipoNotificacion: string = 'Prueba',
  mensaje: string = 'Esta es una notificación de prueba'
) => {
  console.log('🧪 Iniciando prueba de notificación...');
  console.log('📋 Datos de prueba:', {
    id_destinatario: idDestinatario,
    id_orden: idOrden,
    tipo_notificacion: tipoNotificacion,
    mensaje: mensaje
  });

  try {
    // Intentar insertar la notificación
    const notificacion = {
      id_orden: idOrden,
      id_destinatario: idDestinatario,
      tipo_notificacion: tipoNotificacion,
      canal: 'Sistema_Interno',
      mensaje: mensaje,
      fecha_enviada: new Date().toISOString(),
      leida: false
    };

    console.log('📤 Intentando insertar:', notificacion);

    const { data, error } = await supabase
      .from('notificaciones')
      .insert([notificacion])
      .select()
      .single();

    if (error) {
      console.error('❌ Error insertando notificación:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return { success: false, error };
    }

    console.log('✅ Notificación insertada exitosamente:', data);
    return { success: true, data };
  } catch (err: any) {
    console.error('❌ Excepción al insertar notificación:', err);
    return { success: false, error: err };
  }
};

/**
 * Verificar la estructura de la tabla notificaciones
 */
export const verificarEstructuraNotificaciones = async () => {
  console.log('🔍 Verificando estructura de la tabla notificaciones...');
  
  try {
    // Intentar seleccionar una notificación para ver la estructura
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error consultando notificaciones:', error);
      return { success: false, error };
    }

    console.log('✅ Estructura de notificaciones:', data);
    return { success: true, data };
  } catch (err: any) {
    console.error('❌ Excepción al verificar estructura:', err);
    return { success: false, error: err };
  }
};

// Exponer en window para uso en consola
if (typeof window !== 'undefined') {
  (window as any).testCrearNotificacion = testCrearNotificacion;
  (window as any).verificarEstructuraNotificaciones = verificarEstructuraNotificaciones;
}

