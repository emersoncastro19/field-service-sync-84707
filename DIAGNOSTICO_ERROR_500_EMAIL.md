# 🔍 Diagnóstico: Error 500 al Enviar Email

## ❌ Error Actual

```
POST https://juipiurmgphxlmxdlbme.supabase.co/functions/v1/send-email
500 (Internal Server Error)
```

## 🔍 Posibles Causas

### 1. **No hay servicio de email configurado** (MÁS PROBABLE)

La Edge Function busca estas variables de entorno en este orden:
- `SENDGRID_API_KEY`
- `RESEND_API_KEY`
- `BREVO_API_KEY`
- `MAILGUN_API_KEY` + `MAILGUN_DOMAIN`

Si **NINGUNA** está configurada, la Edge Function lanza un error 500.

### 2. **Variables de entorno mal configuradas**

- La API key está mal escrita
- El nombre de la variable es incorrecto
- No se guardó correctamente en Supabase

### 3. **Edge Function no desplegada correctamente**

- El código no se actualizó
- Hay un error de sintaxis en la Edge Function

---

## ✅ SOLUCIÓN PASO A PASO

### **PASO 1: Verificar Variables de Entorno en Supabase**

1. Ve a **Supabase Dashboard**
2. **Settings** → **Edge Functions** → **Secrets**
3. Verifica que tengas configurado **AL MENOS UNO** de estos:

#### Opción A: Resend (Recomendado - Gratis)
```
RESEND_API_KEY = re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL = Sistema de Gestión Técnica <onboarding@resend.dev>
```

#### Opción B: SendGrid
```
SENDGRID_API_KEY = SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL = noreply@tudominio.com
```

#### Opción C: Brevo
```
BREVO_API_KEY = xxxxxxxxxxxxx
BREVO_FROM_EMAIL = noreply@tudominio.com
```

#### Opción D: Mailgun
```
MAILGUN_API_KEY = xxxxxxxxxxxxx
MAILGUN_DOMAIN = mg.tudominio.com
MAILGUN_FROM_EMAIL = noreply@tudominio.com
```

**⚠️ IMPORTANTE:**
- Los nombres de las variables deben ser **EXACTAMENTE** como se muestran arriba
- No uses espacios extra
- No uses comillas en el valor (solo el valor directo)

---

### **PASO 2: Verificar Logs de la Edge Function**

1. Ve a **Supabase Dashboard**
2. **Edge Functions** → **send-email** → **Logs**
3. Busca el error más reciente
4. Deberías ver algo como:

**Si NO hay servicio configurado:**
```
⚠️ No hay servicio de email configurado
Error: No hay servicio de email configurado
```

**Si hay un error de API:**
```
❌ Error Resend: [mensaje de error de Resend]
```

**Si hay un error de parseo:**
```
Error en send-email: [mensaje de error]
```

---

### **PASO 3: Verificar que la Edge Function esté Desplegada**

1. Ve a **Supabase Dashboard**
2. **Edge Functions** → **send-email**
3. Verifica que el código esté actualizado
4. Si no, copia el código de `supabase/functions/send-email/index.ts` o `COPIAR_EDGE_FUNCTION_COMPLETA.txt`

---

### **PASO 4: Probar con Resend (Más Fácil)**

Si no tienes ningún servicio configurado, te recomiendo **Resend** (gratis, 3,000 emails/mes):

1. **Crear cuenta en Resend:**
   - Ve a https://resend.com
   - Crea una cuenta (gratis)
   - Verifica tu email

2. **Obtener API Key:**
   - Dashboard → **API Keys** → **Create API Key**
   - Cópiala (empieza con `re_`)

3. **Configurar en Supabase:**
   - Supabase Dashboard → **Settings** → **Edge Functions** → **Secrets**
   - Agregar:
     - **Name**: `RESEND_API_KEY`
     - **Value**: `re_xxxxxxxxxxxxx` (tu API key)
   - Agregar:
     - **Name**: `RESEND_FROM_EMAIL`
     - **Value**: `Sistema de Gestión Técnica <onboarding@resend.dev>`
   - **Guardar**

4. **Probar de nuevo:**
   - Intenta enviar un email de recuperación
   - Revisa los logs de la Edge Function

---

## 🔧 SOLUCIÓN TEMPORAL: Usar Envío Directo

Si la Edge Function sigue fallando, puedes usar el envío directo desde el frontend (solo para desarrollo):

1. **Crear archivo `.env` en la raíz del proyecto:**
```env
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxx
VITE_RESEND_FROM_EMAIL=Sistema de Gestión Técnica <onboarding@resend.dev>
```

2. **Reiniciar el servidor de desarrollo:**
```bash
npm run dev
```

3. **Probar de nuevo**

**⚠️ IMPORTANTE:** Esto es solo para desarrollo. En producción, usa siempre la Edge Function.

---

## 📋 Checklist de Verificación

- [ ] ¿Tienes al menos UNA variable de entorno configurada en Supabase Secrets?
- [ ] ¿El nombre de la variable es EXACTAMENTE correcto? (sin espacios, sin comillas)
- [ ] ¿La API key es válida? (puedes probarla en Resend Dashboard)
- [ ] ¿La Edge Function está desplegada con el código correcto?
- [ ] ¿Revisaste los logs de la Edge Function para ver el error específico?

---

## 🆘 Si Nada Funciona

1. **Revisa los logs de la Edge Function** en Supabase Dashboard
2. **Copia el error exacto** que aparece en los logs
3. **Verifica que las variables de entorno estén configuradas correctamente**
4. **Prueba con el envío directo** como solución temporal

---

## 💡 Próximos Pasos

Una vez que funcione:
1. **Configura un dominio propio** para evitar que los emails vayan a spam
2. **Verifica el dominio en Resend** para mejor deliverability
3. **Actualiza `RESEND_FROM_EMAIL`** con tu dominio verificado

---

¿Necesitas ayuda con algún paso específico?







