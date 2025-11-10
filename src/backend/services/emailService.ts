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

/**
 * Enviar email usando Supabase Edge Function
 * 
 * Esta función llama a la Edge Function 'send-email' que está configurada
 * para usar SendGrid, Mailgun u otro servicio de email.
 */
export const enviarEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    console.log('📧 Enviando email a:', emailData.to);

    // Llamar a la Edge Function de Supabase
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      }
    });

    if (error) {
      console.error('❌ Error en Edge Function:', error);
      throw new Error(`Error enviando email: ${error.message}`);
    }

    if (data && data.error) {
      console.error('❌ Error del servicio de email:', data.error);
      throw new Error(data.error);
    }

    console.log('✅ Email enviado exitosamente:', data);
    return true;
  } catch (error: any) {
    console.error('❌ Error enviando email:', error);
    throw new Error(error.message || 'No se pudo enviar el email. Contacta al administrador.');
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

