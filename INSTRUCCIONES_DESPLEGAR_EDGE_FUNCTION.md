# 📋 Instrucciones Paso a Paso: Desplegar Edge Function send-email

## 🎯 Objetivo

Desplegar la Edge Function `send-email` completa y correctamente en Supabase.

## ✅ Paso 1: Ir a Supabase Dashboard

1. Abre tu navegador y ve a **https://supabase.com**
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto: **sistema-ordenes-inter**

## ✅ Paso 2: Ir a Edge Functions

1. En el menú izquierdo, busca **"Edge Functions"**
2. Haz click en **"Edge Functions"**
3. Si ya existe la función `send-email`, haz click en su nombre
4. Si NO existe, haz click en **"Deploy a new function"** y crea una nueva llamada `send-email`

## ✅ Paso 3: Editar el Código

1. Si la función ya existe, haz click en el botón **"Edit"** o en el código
2. Si es nueva, ya estarás en el editor

## ✅ Paso 4: Copiar el Código Completo

1. Abre el archivo `COPIAR_EDGE_FUNCTION_COMPLETA.txt` que acabo de crear
2. **Selecciona TODO el contenido** (Ctrl+A o Cmd+A)
3. **Copia** (Ctrl+C o Cmd+C)

## ✅ Paso 5: Pegar en Supabase

1. En el editor de Supabase, **BORRA TODO** el código existente
2. **Pega** el código completo que copiaste (Ctrl+V o Cmd+V)
3. Verifica que el código esté completo (debe terminar con `})`)

## ✅ Paso 6: Guardar y Desplegar

1. Haz click en el botón **"Save"** o **"Deploy"**
2. Espera a que se despliegue (puede tomar unos segundos)
3. Deberías ver un mensaje de éxito

## ✅ Paso 7: Verificar que Está Desplegada

1. Ve a **Edge Functions** → **send-email**
2. Verifica que la función esté lista (estado: Active/Deployed)
3. Verifica que la URL sea: `https://juipiurmgphxlmxdlbme.supabase.co/functions/v1/send-email`

## ✅ Paso 8: Verificar Secrets

1. En el menú izquierdo de Edge Functions, haz click en **"Secrets"**
2. Verifica que existan:
   - ✅ `RESEND_API_KEY` (debe empezar con `re_`)
   - ✅ `RESEND_FROM_EMAIL` (debe ser: `Sistema de Gestión Técnica <onboarding@resend.dev>`)

Si no existen, agréguelas siguiendo estos pasos:
- Haz click en **"Add a new secret"**
- Key: `RESEND_API_KEY`
- Value: Tu API key de Resend (de https://resend.com → API Keys)
- Haz click en **"Add"**
- Repite para `RESEND_FROM_EMAIL`

## ✅ Paso 9: Probar la Función

1. Ve a **Edge Functions** → **send-email**
2. Haz click en la pestaña **"Test"** o **"Invoke"**
3. Usa este JSON:

```json
{
  "to": "tu-email-real@ejemplo.com",
  "subject": "Prueba de Email",
  "html": "<h1>Prueba</h1><p>Si recibes este email, la Edge Function funciona correctamente.</p>",
  "text": "Prueba de Email - Si recibes este email, la Edge Function funciona correctamente."
}
```

4. Haz click en **"Invoke"** o **"Run"**
5. Revisa:
   - ¿Aparece algún error?
   - ¿Llega el email a tu bandeja de entrada?
   - ¿Aparecen logs después de invocar?

## ✅ Paso 10: Probar desde tu Aplicación

1. Abre tu aplicación en el navegador
2. Ve a **Recuperar Contraseña**
3. Ingresa un email válido
4. Haz click en **"Enviar Token"**
5. Abre la consola del navegador (F12 → Console)
6. Revisa los mensajes:
   - `📧 Iniciando envío de email...`
   - `🔄 Intentando llamar Edge Function send-email...`
   - `✅ Email enviado exitosamente`
7. Revisa tu bandeja de entrada (y spam)

## 🎯 Listo!

Si todos los pasos se completan sin errores, la Edge Function está desplegada correctamente.

## ⚠️ Si Algo Sale Mal

Si hay algún error durante el despliegue:

1. **Copia el mensaje de error completo**
2. **Verifica que copiaste TODO el código** (no falte nada)
3. **Verifica que los Secrets estén configurados correctamente**
4. Comparte el error y te ayudo a solucionarlo









