# 📧 Configurar Servicio de Email para Recuperación de Contraseña

## ✅ Cambios Implementados

He implementado la funcionalidad completa de recuperación de contraseña por email. El sistema ahora:

1. ✅ Genera un código de 6 dígitos cuando el usuario solicita recuperación
2. ✅ Envía un email con el código usando la Edge Function de Supabase
3. ✅ Valida el token con expiración de 1 hora
4. ✅ Permite cambiar la contraseña con el token válido

## ⚠️ IMPORTANTE: Configurar Servicio de Email

Para que los emails se envíen correctamente, debes configurar uno de estos servicios en Supabase:

### Opción 1: Resend (Recomendado - Más Fácil) ⭐

1. **Crear cuenta en Resend:**
   - Ve a https://resend.com
   - Crea una cuenta gratuita (3,000 emails/mes gratis)

2. **Obtener API Key:**
   - Ve a "API Keys" en tu dashboard
   - Crea una nueva API Key
   - Cópiala

3. **Configurar en Supabase:**
   - Ve a tu proyecto en Supabase Dashboard
   - Settings → Edge Functions → Secrets
   - Agrega estas variables:
     - `RESEND_API_KEY`: Tu API key de Resend
     - `RESEND_FROM_EMAIL`: `Sistema de Gestión Técnica <noreply@tudominio.com>`
     - `ENVIRONMENT`: `production` (o `development` para pruebas)

4. **Verificar dominio (opcional pero recomendado):**
   - En Resend, ve a "Domains"
   - Agrega tu dominio y verifica el DNS
   - Esto evita que los emails vayan a spam

### Opción 2: SendGrid

1. Crear cuenta en https://sendgrid.com (100 emails/día gratis)
2. Obtener API Key
3. En Supabase → Settings → Edge Functions → Secrets:
   - `SENDGRID_API_KEY`: Tu API key
   - `SENDGRID_FROM_EMAIL`: `noreply@tudominio.com`

### Opción 3: Brevo (antes Sendinblue)

1. Crear cuenta en https://brevo.com (300 emails/día gratis)
2. Obtener API Key
3. En Supabase → Settings → Edge Functions → Secrets:
   - `BREVO_API_KEY`: Tu API key
   - `BREVO_FROM_EMAIL`: `noreply@tudominio.com`

### Opción 4: Mailgun

1. Crear cuenta en https://mailgun.com (100 emails/día gratis)
2. Obtener API Key y Domain
3. En Supabase → Settings → Edge Functions → Secrets:
   - `MAILGUN_API_KEY`: Tu API key
   - `MAILGUN_DOMAIN`: Tu dominio verificado
   - `MAILGUN_FROM_EMAIL`: `noreply@tudominio.com`

## 🚀 Desplegar Edge Function

La Edge Function `send-email` ya existe en `supabase/functions/send-email/index.ts`. Debes desplegarla:

### Usando Supabase CLI:

```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# Iniciar sesión
supabase login

# Enlazar tu proyecto
supabase link --project-ref juipiurmgphxlmxdlbme

# Desplegar la función
supabase functions deploy send-email
```

### Desde el Dashboard de Supabase:

1. Ve a tu proyecto en Supabase Dashboard
2. Edge Functions → Create a new function
3. Nombra la función: `send-email`
4. Copia el contenido de `supabase/functions/send-email/index.ts`
5. Guarda y despliega

## ✅ Verificar que Funciona

1. Prueba solicitar recuperación de contraseña con un email válido
2. Revisa la consola del navegador para ver los logs:
   - `🔑 Iniciando recuperación de contraseña para: ...`
   - `✅ Usuario encontrado: ...`
   - `✅ Token guardado: ...`
   - `📧 Enviando email de recuperación...`
   - `✅ Email enviado exitosamente`

3. Si ves errores, revisa:
   - **Edge Function no desplegada**: Debes desplegar la función `send-email`
   - **No hay servicio configurado**: Debes configurar al menos uno de los servicios (Resend, SendGrid, etc.)
   - **API Key incorrecta**: Verifica que la API Key esté correcta en Supabase Secrets

## 🔍 Debugging

Si los emails no llegan:

1. **Revisa los logs de la Edge Function:**
   - Supabase Dashboard → Edge Functions → send-email → Logs
   - Busca errores o mensajes informativos

2. **Revisa la consola del navegador:**
   - Abre DevTools (F12)
   - Ve a la pestaña Console
   - Busca mensajes de error relacionados con email

3. **Verifica que el servicio esté configurado:**
   - Revisa que las variables de entorno estén en Supabase Secrets
   - Verifica que los nombres de las variables sean correctos (RESEND_API_KEY, SENDGRID_API_KEY, etc.)

4. **Verifica el email del destinatario:**
   - Asegúrate de que el email esté registrado en la tabla `usuarios`
   - Revisa la carpeta de spam si no llega

## 📝 Notas Importantes

- El token expira en 1 hora
- El token es un código de 6 dígitos numérico
- Los tokens se guardan temporalmente en localStorage (en producción, considera usar una tabla en la BD)
- Si falla el envío del email, el token no se guarda

## 🎯 Próximos Pasos (Opcional)

Para mejorar la seguridad y escalabilidad:

1. **Crear tabla `tokens_recuperacion` en Supabase:**
   ```sql
   CREATE TABLE tokens_recuperacion (
     id SERIAL PRIMARY KEY,
     email VARCHAR(255) NOT NULL,
     token VARCHAR(50) NOT NULL,
     creado_en TIMESTAMP DEFAULT NOW(),
     expira_en TIMESTAMP NOT NULL,
     usado BOOLEAN DEFAULT FALSE
   );
   ```

2. **Guardar tokens en la BD en lugar de localStorage** para que funcionen entre dispositivos

3. **Limpiar tokens expirados periódicamente** con un cron job o función programada









