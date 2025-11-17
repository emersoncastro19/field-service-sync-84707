import { supabase } from '../config/supabaseClient'

/**
 * Servicio para enviar emails usando Supabase Email (SendGrid)
 * 
 * IMPORTANTE: Para que funcione, debes configurar:
 * 1. Supabase Dashboard → Settings → Auth → Email Templates
 * 2. O usar Supabase Edge Functions con un servicio de email externo
 * 
 * Por ahora, esta función prepara el email pero no lo envía automáticamente.
 * Supabase no tiene una función directa de "send email" desde el cliente.
 * 
 * OPCIONES:
 * 1. Usar Supabase Edge Functions (recomendado)
 * 2. Usar un servicio externo (SendGrid, Mailgun, etc.) desde el frontend
 * 3. Usar Supabase Auth (solo para emails de autenticación)
 */

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ⚠️ IMPORTANTE: Esta es tu API key de Resend
// EN PRODUCCIÓN, NO deberías tener esto aquí. Usa solo la Edge Function.
// Esto es una SOLUCIÓN TEMPORAL si la Edge Function no funciona.
const RESEND_API_KEY_DIRECT = import.meta.env.VITE_RESEND_API_KEY || '';

/**
 * Enviar email directamente usando la API de Resend (Solo si Edge Function falla)
 * ⚠️ SOLO PARA DESARROLLO - En producción usa solo la Edge Function
 */
const enviarEmailDirectoResend = async (emailData: EmailData): Promise<boolean> => {
  if (!RESEND_API_KEY_DIRECT) {
    throw new Error('No hay API key de Resend configurada para envío directo. Configura VITE_RESEND_API_KEY en .env o usa la Edge Function.');
  }

  console.log('🔄 Intentando envío directo con Resend...');
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY_DIRECT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: import.meta.env.VITE_RESEND_FROM_EMAIL || 'Sistema de Gestión Técnica <onboarding@resend.dev>',
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || emailData.html.replace(/<[^>]*>/g, '')
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Resend directo:', errorText);
      throw new Error(`Error enviando email con Resend: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Email enviado exitosamente (directo):', result);
    return true;
  } catch (error: any) {
    console.error('❌ Error en envío directo:', error);
    throw error;
  }
};

/**
 * Enviar email usando Supabase Edge Function
 * 
 * Esta función llama a la Edge Function 'send-email' que está configurada
 * para usar SendGrid, Mailgun u otro servicio de email.
 * Si falla, intenta envío directo (solo en desarrollo).
 */
export const enviarEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    console.log('📧 Iniciando envío de email...');
    console.log('📧 Destinatario:', emailData.to);
    console.log('📧 Asunto:', emailData.subject);

    // Primero intentar con Edge Function
    console.log('🔄 Intentando llamar Edge Function send-email...');
    
    let data: any = null;
    
    try {
      const result = await supabase.functions.invoke('send-email', {
        body: {
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        }
      });

      data = result.data;
      const error = result.error;

      console.log('📥 Respuesta de Edge Function:', { data, error });

      // Si hay un error HTTP, intentar obtener el mensaje del body
      if (error) {
        console.error('❌ Error en Edge Function:', error);
        console.error('❌ Código de error:', error.code);
        console.error('❌ Mensaje de error:', error.message);
        
        // Si es error 403 u otro error HTTP, intentar obtener el mensaje del body
        if (error.status || error.statusCode) {
          try {
            // Hacer llamada fetch directa para obtener el body completo
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            if (supabaseUrl && supabaseAnonKey) {
              const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({
                  to: emailData.to,
                  subject: emailData.subject,
                  html: emailData.html,
                  text: emailData.text
                })
              });

              const responseText = await response.text();
              console.log('📥 Response body:', responseText);
              
              try {
                const responseData = JSON.parse(responseText);
                if (responseData.error) {
                  throw new Error(responseData.error);
                }
              } catch (e) {
                // Si no es JSON, usar el texto directamente
                if (responseText) {
                  throw new Error(responseText);
                }
              }
            }
          } catch (fetchError: any) {
            // Si el fetch también falla, usar el mensaje del fetchError
            if (fetchError.message) {
              throw fetchError;
            }
          }
        }
        
        // Si es error de función no encontrada o no configurada, intentar directo (si está configurado)
        const puedeUsarDirecto = RESEND_API_KEY_DIRECT && (
          error.message?.includes('not found') || 
          error.code === 'FUNCTION_NOT_FOUND' ||
          error.message?.includes('No hay servicio') ||
          error.message?.includes('not configured')
        );

        if (puedeUsarDirecto) {
          console.warn('⚠️ Edge Function no disponible, intentando envío directo...');
          try {
            return await enviarEmailDirectoResend(emailData);
          } catch (directError: any) {
            console.error('❌ También falló el envío directo:', directError);
            throw new Error(`Error enviando email: La Edge Function no está disponible y el envío directo también falló. ${directError.message}`);
          }
        }
        
        // Proporcionar mensaje más descriptivo
        let mensajeError = error.message || 'No se pudo enviar el email. Contacta al administrador.';
        
        // Mensajes de ayuda específicos
        if (mensajeError.includes('not found') || mensajeError.includes('FUNCTION_NOT_FOUND')) {
          mensajeError += '\n\n💡 SOLUCIÓN: Ve a Supabase Dashboard → Edge Functions → Create → Nombre: "send-email" → Copia el código de supabase/functions/send-email/index.ts';
        } else if (mensajeError.includes('No hay servicio') || mensajeError.includes('not configured')) {
          mensajeError += '\n\n💡 SOLUCIÓN: Configura RESEND_API_KEY en Supabase Dashboard → Settings → Edge Functions → Secrets';
        } else if (mensajeError.includes('non-2xx') || error.status === 403 || error.statusCode === 403) {
          // Error 403 específico - mensaje más claro
          mensajeError = `Resend requiere verificar un dominio para enviar emails a otros destinatarios.

SOLUCIÓN RÁPIDA (Pruebas):
- El email solo puede enviarse a: emersoncastro9.ec@gmail.com
- Usa ese email para probar la funcionalidad

SOLUCIÓN PERMANENTE:
1. Obtén un dominio gratis en: https://freenom.com (.tk, .ml, .ga, .cf)
2. Verifica el dominio en: https://resend.com/domains
3. Actualiza RESEND_FROM_EMAIL en Supabase Dashboard → Settings → Edge Functions → Secrets
   Cambia a: Sistema de Gestión Técnica <noreply@tudominio.tk>

Para más detalles, revisa: SOLUCION_ERROR_403_RESEND.md`;
        }
        
        throw new Error(mensajeError);
      }

      if (data && data.error) {
        console.error('❌ Error del servicio de email:', data.error);
        
        // Proporcionar mensaje más descriptivo si es error 403 de Resend
        if (typeof data.error === 'string' && (
          data.error.includes('only send testing emails') ||
          data.error.includes('verify a domain') ||
          data.error.includes('verificar un dominio')
        )) {
          throw new Error(data.error); // Ya tiene el mensaje completo
        }
        
        throw new Error(data.error);
      }

      // Si llegamos aquí, no hubo errores
      if (!data) {
        console.warn('⚠️ La Edge Function respondió sin datos');
        throw new Error('La Edge Function no retornó datos. Revisa los logs en Supabase Dashboard.');
      }

      console.log('✅ Email enviado exitosamente');
      console.log('✅ Respuesta completa:', data);
      return true;
      
    } catch (invokeError: any) {
      // Si el invoke falla completamente, mostrar el error
      console.error('❌ Error completo en invoke:', invokeError);
      throw invokeError;
    }
  } catch (error: any) {
    console.error('❌ Error enviando email:', error);
    console.error('❌ Stack trace:', error.stack);
    
    throw error;
  }
}

/**
 * Generar plantilla de email para contraseña temporal
 */
export const generarEmailContraseñaTemporal = (
  nombreUsuario: string,
  username: string,
  contraseñaTemporal: string
): EmailData => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .credentials { background: white; padding: 20px; border-radius: 8px; border: 2px solid #e5e7eb; margin: 20px 0; }
        .password { font-size: 24px; font-weight: bold; color: #3b82f6; text-align: center; padding: 10px; background: #eff6ff; border-radius: 4px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛠️ Sistema de Gestión Técnica</h1>
          <p>Credenciales de Acceso</p>
        </div>
        <div class="content">
          <p>Hola <strong>${nombreUsuario}</strong>,</p>
          
          <p>Tu cuenta ha sido creada exitosamente. Aquí están tus credenciales de acceso:</p>
          
          <div class="credentials">
            <p><strong>Usuario:</strong> ${username}</p>
            <p><strong>Contraseña Temporal:</strong></p>
            <div class="password">${contraseñaTemporal}</div>
          </div>
          
          <div class="warning">
            <strong>IMPORTANTE:</strong> Por seguridad, deberás cambiar esta contraseña la primera vez que inicies sesión.
          </div>
          
          <p>Para iniciar sesión, visita: <a href="${window.location.origin}/login">${window.location.origin}/login</a></p>
          
          <p>Si no solicitaste esta cuenta, por favor contacta al administrador inmediatamente.</p>
          
          <div class="footer">
            <p>Este es un email automático, por favor no respondas.</p>
            <p>&copy; ${new Date().getFullYear()} Sistema de Gestión Técnica</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Sistema de Gestión Técnica - Credenciales de Acceso

Hola ${nombreUsuario},

Tu cuenta ha sido creada exitosamente.

Credenciales:
Usuario: ${username}
Contraseña Temporal: ${contraseñaTemporal}

IMPORTANTE: Por seguridad, deberás cambiar esta contraseña la primera vez que inicies sesión.

Inicia sesión en: ${window.location.origin}/login

Si no solicitaste esta cuenta, contacta al administrador inmediatamente.
  `;

  return {
    to: '', // Se asignará cuando se llame
    subject: 'Credenciales de Acceso - Sistema de Gestión Técnica',
    html,
    text
  };
}

/**
 * Generar plantilla de email para recuperación de contraseña
 */
export const generarEmailRecuperacionContraseña = (
  nombreUsuario: string,
  token: string,
  email: string
): EmailData => {
  const recoveryUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/recuperar-contraseña?token=${token}&email=${encodeURIComponent(email)}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .token-box { background: white; padding: 20px; border-radius: 8px; border: 2px solid #e5e7eb; margin: 20px 0; text-align: center; }
        .token { font-size: 28px; font-weight: bold; color: #3b82f6; letter-spacing: 3px; padding: 15px; background: #eff6ff; border-radius: 4px; font-family: monospace; }
        .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Recuperación de Contraseña</h1>
          <p>Sistema de Gestión Técnica</p>
        </div>
        <div class="content">
          <p>Hola <strong>${nombreUsuario}</strong>,</p>
          
          <p>Recibimos una solicitud para recuperar tu contraseña. Si no realizaste esta solicitud, puedes ignorar este email.</p>
          
          <div class="token-box">
            <p><strong>Tu código de recuperación es:</strong></p>
            <div class="token">${token}</div>
            <p style="margin-top: 15px; font-size: 14px; color: #6b7280;">Este código expira en 1 hora</p>
          </div>
          
          <div class="info">
            <strong>📝 Instrucciones:</strong>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li>Copia el código de arriba</li>
              <li>Ingresa a la página de recuperación de contraseña</li>
              <li>Ingresa tu email y el código</li>
              <li>Crea tu nueva contraseña</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${recoveryUrl}" class="button">Recuperar Mi Contraseña</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ IMPORTANTE:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Este código es válido por 1 hora</li>
              <li>No compartas este código con nadie</li>
              <li>Si no solicitaste este cambio, ignora este email</li>
              <li><strong>Si este email llegó a tu carpeta de spam, por favor márcalo como "No es spam" para recibir futuros emails correctamente</strong></li>
            </ul>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <a href="${recoveryUrl}" style="color: #3b82f6; word-break: break-all;">${recoveryUrl}</a>
          </p>
          
          <div class="footer">
            <p>Este es un email automático, por favor no respondas.</p>
            <p>&copy; ${new Date().getFullYear()} Sistema de Gestión Técnica</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Recuperación de Contraseña - Sistema de Gestión Técnica

Hola ${nombreUsuario},

Recibimos una solicitud para recuperar tu contraseña. Si no realizaste esta solicitud, puedes ignorar este email.

TU CÓDIGO DE RECUPERACIÓN ES: ${token}

Este código expira en 1 hora.

INSTRUCCIONES:
1. Copia el código de arriba
2. Ingresa a: ${recoveryUrl}
3. Ingresa tu email y el código
4. Crea tu nueva contraseña

IMPORTANTE:
- Este código es válido por 1 hora
- No compartas este código con nadie
- Si no solicitaste este cambio, ignora este email
- Si este email llegó a spam, marca como "No es spam" para recibir futuros emails correctamente

Si tienes problemas, contacta al administrador.

Este es un email automático, por favor no respondas.
© ${new Date().getFullYear()} Sistema de Gestión Técnica
  `;

  return {
    to: email,
    subject: '🔐 Recuperación de Contraseña - Sistema de Gestión Técnica',
    html,
    text
  };
}

