# 🔍 Verificar Secrets de Email

## Paso 2: Verificar Variables de Entorno (Secrets)

Dado que la Edge Function `send-email` SÍ está desplegada, ahora necesitamos verificar que los Secrets estén configurados correctamente.

### Instrucciones:

1. **En Supabase Dashboard:**
   - Ve a **Edge Functions** (ya estás ahí)
   - En el menú izquierdo, haz click en **"Secrets"** (está justo debajo de "Functions")

2. **Verifica que existan estos Secrets:**

   Debe haber al menos uno de estos:
   
   **Para Resend:**
   - `RESEND_API_KEY`: Debe empezar con `re_` (ejemplo: `re_abc123...`)
   - `RESEND_FROM_EMAIL`: Formato correcto: `Sistema de Gestión Técnica <onboarding@resend.dev>`
   
   **O para SendGrid:**
   - `SENDGRID_API_KEY`: Tu API key de SendGrid
   - `SENDGRID_FROM_EMAIL`: Tu email remitente
   
   **O para Brevo:**
   - `BREVO_API_KEY`: Tu API key de Brevo
   - `BREVO_FROM_EMAIL`: Tu email remitente

3. **Si NO existen los Secrets:**
   
   Click en **"Add a new secret"** o **"Create secret"** y agrega:
   
   **Para Resend (Recomendado):**
   - Key: `RESEND_API_KEY`
   - Value: Tu API key de Resend (debe empezar con `re_`)
   
   - Key: `RESEND_FROM_EMAIL`
   - Value: `Sistema de Gestión Técnica <onboarding@resend.dev>`
   
   ⚠️ **IMPORTANTE**: 
   - El formato de `RESEND_FROM_EMAIL` debe ser exactamente: `Nombre <email@dominio.com>`
   - Si usas el dominio de prueba de Resend: `<onboarding@resend.dev>`
   - Si tienes tu dominio verificado: `<noreply@tudominio.com>`

4. **Opcional (para desarrollo):**
   - Key: `ENVIRONMENT`
   - Value: `production` (o `development` si quieres logs más detallados)

### Verificar en Resend:

1. Ve a https://resend.com
2. Inicia sesión en tu cuenta
3. Ve a **API Keys**
4. Verifica que tengas una API key válida
5. Si no tienes, crea una nueva: **"Create API Key"**
6. Copia la API key (empezará con `re_`)

### Problemas Comunes:

❌ **"No hay servicio de email configurado"**
- **Solución**: Agrega `RESEND_API_KEY` en Secrets

❌ **"Invalid 'from' address"**
- **Solución**: Verifica que `RESEND_FROM_EMAIL` tenga el formato correcto: `Nombre <email@dominio.com>`

❌ **"Invalid API key"**
- **Solución**: Verifica que la API key empiece con `re_` y esté bien copiada

---

## Paso 3: Revisar Logs de la Edge Function

1. **En Supabase Dashboard:**
   - Edge Functions → **"send-email"** (click en el nombre)
   - Haz click en la pestaña **"Logs"** o **"Invocations"**

2. **Intenta enviar un email de recuperación de contraseña:**
   - Ve a tu aplicación
   - Intenta recuperar contraseña con un email válido
   - Vuelve a los Logs de Supabase

3. **Revisa los logs:**
   - Busca errores (líneas rojas o con ❌)
   - Copia el mensaje de error completo
   - Compártelo para que te ayude a solucionarlo

---

## Siguiente Paso:

Una vez que verifiques los Secrets, intenta enviar un email de recuperación de contraseña y revisa:
1. La consola del navegador (F12 → Console)
2. Los logs de la Edge Function en Supabase

Dime qué ves en ambos lugares.









