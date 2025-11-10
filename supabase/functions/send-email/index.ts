// Supabase Edge Function para envío de emails
// Esta función puede usar SendGrid, Mailgun, AWS SES, o el servicio SMTP de Supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const emailData: EmailRequest = await req.json()

    // Validar datos
    if (!emailData.to || !emailData.subject || !emailData.html) {
      return new Response(
        JSON.stringify({ error: 'Datos de email incompletos' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // OPCIÓN 1: Usar SendGrid (Recomendado)
    // Configura tu API key de SendGrid en las variables de entorno de Supabase
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
    
    if (sendGridApiKey) {
      const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: emailData.to }]
          }],
          from: {
            email: Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@serviciotecnico.com',
            name: 'Sistema de Gestión Técnica'
          },
          subject: emailData.subject,
          content: [
            {
              type: 'text/html',
              value: emailData.html
            },
            ...(emailData.text ? [{
              type: 'text/plain',
              value: emailData.text
            }] : [])
          ]
        })
      })

      if (!sendGridResponse.ok) {
        const errorText = await sendGridResponse.text()
        console.error('Error SendGrid:', errorText)
        throw new Error(`Error enviando email con SendGrid: ${errorText}`)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email enviado exitosamente',
          provider: 'SendGrid'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // OPCIÓN 2: Usar Resend (Muy popular y fácil)
    // Plan gratuito: 3,000 emails/mes
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (resendApiKey) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: Deno.env.get('RESEND_FROM_EMAIL') || 'Sistema de Gestión Técnica <noreply@resend.dev>',
          to: [emailData.to],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text || emailData.html.replace(/<[^>]*>/g, '')
        })
      })

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text()
        console.error('Error Resend:', errorText)
        throw new Error(`Error enviando email con Resend: ${errorText}`)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email enviado exitosamente',
          provider: 'Resend'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // OPCIÓN 3: Usar Brevo (antes Sendinblue)
    // Plan gratuito: 300 emails/día
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    
    if (brevoApiKey) {
      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: 'Sistema de Gestión Técnica',
            email: Deno.env.get('BREVO_FROM_EMAIL') || 'noreply@brevo.com'
          },
          to: [{ email: emailData.to }],
          subject: emailData.subject,
          htmlContent: emailData.html,
          textContent: emailData.text || emailData.html.replace(/<[^>]*>/g, '')
        })
      })

      if (!brevoResponse.ok) {
        const errorText = await brevoResponse.text()
        console.error('Error Brevo:', errorText)
        throw new Error(`Error enviando email con Brevo: ${errorText}`)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email enviado exitosamente',
          provider: 'Brevo'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // OPCIÓN 4: Usar Mailgun
    const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY')
    const mailgunDomain = Deno.env.get('MAILGUN_DOMAIN')
    
    if (mailgunApiKey && mailgunDomain) {
      const mailgunResponse = await fetch(
        `https://api.mailgun.net/v3/${mailgunDomain}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`api:${mailgunApiKey}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            from: Deno.env.get('MAILGUN_FROM_EMAIL') || `noreply@${mailgunDomain}`,
            to: emailData.to,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text || emailData.html.replace(/<[^>]*>/g, '')
          })
        }
      )

      if (!mailgunResponse.ok) {
        const errorText = await mailgunResponse.text()
        console.error('Error Mailgun:', errorText)
        throw new Error(`Error enviando email con Mailgun: ${errorText}`)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email enviado exitosamente',
          provider: 'Mailgun'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // OPCIÓN 5: Usar Amazon SES (Muy económico)
    // Casi gratis para volúmenes pequeños
    const awsAccessKey = Deno.env.get('AWS_SES_ACCESS_KEY')
    const awsSecretKey = Deno.env.get('AWS_SES_SECRET_KEY')
    const awsRegion = Deno.env.get('AWS_SES_REGION') || 'us-east-1'
    
    if (awsAccessKey && awsSecretKey) {
      // Amazon SES requiere firma AWS v4 (más complejo)
      // Por simplicidad, solo mostramos que está disponible
      // Se puede implementar más adelante si es necesario
      console.log('Amazon SES detectado pero requiere implementación adicional de firma AWS')
    }

    // OPCIÓN 6: Fallback - Log y retorno exitoso (para desarrollo)
    // En producción, esto debería fallar si no hay servicio configurado
    console.log('⚠️ No hay servicio de email configurado. Email que se hubiera enviado:')
    console.log({
      to: emailData.to,
      subject: emailData.subject,
      // No loguear el contenido completo por seguridad
    })

    // En desarrollo, retornamos éxito pero solo logueamos
    // En producción, lanzar error si no hay servicio configurado
    const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development'
    
    if (isDevelopment) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email logueado (modo desarrollo - servicio de email no configurado)',
          provider: 'none'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      throw new Error('No hay servicio de email configurado')
    }

  } catch (error: any) {
    console.error('Error en send-email:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error desconocido al enviar email' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

