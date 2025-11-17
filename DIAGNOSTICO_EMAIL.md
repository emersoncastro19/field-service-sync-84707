# 🔍 Diagnóstico de Problemas con Email

## Pasos para Diagnosticar

### 1. Verificar que la Edge Function esté desplegada ✅ COMPLETADO

✅ **CONFIRMADO**: La Edge Function `send-email` está desplegada
- Nombre: `send-email`
- URL: `https://juipiurmgphxlmxdlbme.supabase.co/functions/v1/send-email`
- Creada: 02 Nov, 2025
- Última actualización: Hace 12 días
- Deployments: 1

✅ **Paso 1 COMPLETADO** - Continúa al Paso 2

### 2. Verificar Variables de Entorno (Secrets) ✅ COMPLETADO

✅ **CONFIRMADO**: Los Secrets están configurados
- `RESEND_API_KEY`: ✅ Configurado (actualizado: 03 Nov 2025 03:00:30)
- `RESEND_FROM_EMAIL`: ✅ Configurado (actualizado: 03 Nov 2025 03:00:30)

✅ **Paso 2 COMPLETADO** - Continúa al Paso 3

### 3. Verificar Logs de la Edge Function ⚠️ PROBLEMA DETECTADO

**En Supabase Dashboard:**
1. Ve a **Edge Functions** (ya estás ahí)
2. En el **menú izquierdo**, haz click en **"Secrets"** (está justo debajo de "Functions")
3. Verifica que existan estos Secrets:

**Para Resend (Recomendado):**
- `RESEND_API_KEY`: Tu API key de Resend (debe empezar con `re_...`)
- `RESEND_FROM_EMAIL`: Formato correcto: `Sistema de Gestión Técnica <onboarding@resend.dev>`

**Si NO existen los Secrets:**
1. Haz click en **"Add a new secret"** o **"Create secret"**
2. Agrega:
   - Key: `RESEND_API_KEY`
     - Value: Tu API key de Resend (de https://resend.com → API Keys)
     - ⚠️ Debe empezar con `re_`
   - Key: `RESEND_FROM_EMAIL`
     - Value: `Sistema de Gestión Técnica <onboarding@resend.dev>`
     - ⚠️ El formato debe ser exacto: `Nombre <email@dominio.com>`

**Opcional:**
- `ENVIRONMENT`: `production` (opcional)

**⚠️ IMPORTANTE**: 
- La API key debe empezar con `re_`
- El `RESEND_FROM_EMAIL` debe usar el dominio de prueba `onboarding@resend.dev` o un dominio verificado
- Si usas dominio de prueba, el formato es: `Nombre <onboarding@resend.dev>`

### 3. Verificar Logs de la Edge Function ⚠️ LOS LOGS ESTÁN VACÍOS

❌ **PROBLEMA**: Los logs están vacíos - esto significa que la Edge Function **NO se está invocando** desde el frontend.

**Posibles causas:**
1. La función no se está llamando correctamente desde el código
2. Hay un error antes de llegar a la Edge Function
3. Problema con la autenticación/autorización

**Próximos pasos para diagnosticar:**

### 4. Verificar desde la Consola del Navegador

Abre la consola del navegador (F12) cuando intentas recuperar contraseña y busca:
- `📧 Enviando email a: ...`
- `❌ Error en Edge Function: ...`
- `✅ Email enviado exitosamente`

### 5. Probar la Edge Function Manualmente

Desde Supabase Dashboard → Edge Functions → send-email → Test

Usa este JSON:
```json
{
  "to": "tu-email@ejemplo.com",
  "subject": "Prueba",
  "html": "<h1>Prueba</h1>",
  "text": "Prueba"
}
```

## Errores Comunes

### Error: "Edge Function not found"
- **Solución**: La función no está desplegada. Despliégalo desde el Dashboard

### Error: "No hay servicio de email configurado"
- **Solución**: Las variables de entorno no están configuradas. Verifica `RESEND_API_KEY` en Secrets

### Error: "Invalid API key"
- **Solución**: La API key es incorrecta. Verifica que empiece con `re_` y que esté bien copiada

### Error: "Invalid 'from' address"
- **Solución**: El `RESEND_FROM_EMAIL` tiene formato incorrecto. Usa: `Nombre <onboarding@resend.dev>`

### Error: "Unauthorized"
- **Solución**: La API key no tiene permisos o está mal configurada

## Alternativa: Enviar Email Directamente (Solo para Desarrollo)

Si la Edge Function no funciona, puedo implementar una versión que envíe directamente desde el frontend usando la API de Resend. Esto NO es recomendable para producción por seguridad, pero puede funcionar para pruebas.

