# 🔧 Solucionar: Logs Vacíos en Edge Function

## ❌ Problema Identificado

Los logs de la Edge Function `send-email` están vacíos, lo que significa que la función **NO se está ejecutando**. Esto indica que hay un problema antes de llegar a la Edge Function.

## 🔍 Pasos para Diagnosticar

### 1. Revisar Consola del Navegador

**Importante**: Abre la consola del navegador ANTES de intentar recuperar contraseña.

1. Abre tu aplicación en el navegador
2. Presiona **F12** (o Click derecho → Inspeccionar)
3. Ve a la pestaña **Console**
4. Intenta recuperar contraseña con un email válido
5. **Revisa TODOS los mensajes** que aparecen, especialmente:
   - `📧 Iniciando envío de email...`
   - `🔄 Intentando llamar Edge Function send-email...`
   - `❌ Error en Edge Function: ...`
   - Cualquier error en rojo

**Comparte todos los mensajes que aparezcan en la consola**

### 2. Verificar que la Función se Llame Correctamente

El código está en `src/backend/services/emailService.ts` y debería llamar a:

```typescript
supabase.functions.invoke('send-email', {
  body: { ... }
})
```

### 3. Verificar Errores de Red

En la consola del navegador:
1. Ve a la pestaña **Network** (Red)
2. Intenta recuperar contraseña
3. Busca una petición a `/functions/v1/send-email`
4. Si aparece, haz click en ella y revisa:
   - Status Code (200, 400, 401, 404, 500, etc.)
   - Response (respuesta)
   - Headers

### 4. Probar la Edge Function Manualmente

Desde Supabase Dashboard:

1. Ve a **Edge Functions** → **send-email**
2. Haz click en la pestaña **"Test"** o **"Invoke"**
3. Usa este JSON de prueba:
```json
{
  "to": "tu-email-real@ejemplo.com",
  "subject": "Prueba de Email",
  "html": "<h1>Prueba</h1><p>Si recibes este email, la Edge Function funciona.</p>",
  "text": "Prueba de Email - Si recibes este email, la Edge Function funciona."
}
```

4. Haz click en **"Invoke"** o **"Run"**
5. Revisa:
   - ¿Aparece algún error?
   - ¿Llega el email a tu bandeja de entrada?
   - ¿Aparecen logs después de invocar manualmente?

### 5. Verificar Configuración de Supabase Client

Verifica que el cliente de Supabase esté configurado correctamente en `src/backend/config/supabaseClient.ts`:

- URL correcta
- Anon Key correcta

### 6. Verificar CORS (si aplica)

Si hay errores de CORS en la consola, la Edge Function podría estar rechazando las peticiones.

## 🔍 Errores Comunes y Soluciones

### Error: "Function not found" o 404
- **Causa**: La Edge Function no existe o el nombre es incorrecto
- **Solución**: Verifica que la función se llame exactamente `send-email`

### Error: "Unauthorized" o 401
- **Causa**: Problema con la autenticación del cliente de Supabase
- **Solución**: Verifica que el `anon_key` sea correcto

### Error: CORS
- **Causa**: La Edge Function no permite peticiones desde tu dominio
- **Solución**: Ya está configurado en el código, pero verifica los headers

### No hay error, pero no pasa nada
- **Causa**: La función se llama pero no se ejecuta o falla silenciosamente
- **Solución**: Revisa los logs DESPUÉS de invocar manualmente

## 📋 Checklist de Diagnóstico

Antes de continuar, verifica:

- [ ] ¿Aparece algún error en la consola del navegador (F12)?
- [ ] ¿Aparece la petición a `/functions/v1/send-email` en la pestaña Network?
- [ ] ¿Qué Status Code tiene esa petición? (200, 400, 401, 404, 500, etc.)
- [ ] ¿Funciona cuando invocas la Edge Function manualmente desde Supabase Dashboard?
- [ ] ¿Aparecen logs cuando invocas manualmente?

## 🎯 Siguiente Paso

**Por favor, realiza estos pasos y comparte:**

1. **Todos los mensajes de la consola del navegador** cuando intentas recuperar contraseña
2. **Resultado de probar la Edge Function manualmente** desde Supabase Dashboard
3. **Qué aparece en la pestaña Network** cuando intentas recuperar contraseña

Con esa información podré identificar exactamente dónde está el problema.









