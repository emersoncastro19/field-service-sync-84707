# 🌐 Guía Completa: Verificar Dominio en Resend (Paso a Paso)

## 🎯 Objetivo

Verificar un dominio gratis en Resend para poder enviar emails a cualquier destinatario (no solo `emersoncastro9.ec@gmail.com`).

---

## 📋 PASO 1: Obtener un Dominio Gratis en Freenom

### 1.1 Crear cuenta en Freenom

1. Ve a **https://www.freenom.com**
2. Haz clic en **"Sign In"** o **"Register"** (arriba a la derecha)
3. Completa el formulario:
   - **Email**: Tu email
   - **Contraseña**: Crea una contraseña segura
   - Acepta los términos y condiciones
   - Haz clic en **"Create Account"** o **"Sign Up"**
4. Verifica tu email (revisa tu bandeja de entrada o spam)

### 1.2 Buscar un Dominio Disponible

1. Una vez logueado, en la página principal, busca un dominio:
   - Ingresa un nombre (ejemplo: `sistemagestion`, `serviciotecnico`, `misistema`, etc.)
   - Haz clic en **"Check Availability"**

2. Freenom te mostrará dominios disponibles:
   - **`.tk`** (Tokelau) - Recomendado
   - **`.ml`** (Mali)
   - **`.ga`** (Gabón)
   - **`.cf`** (República Centroafricana)
   - **`.gq`** (Guinea Ecuatorial)

3. Selecciona el que prefieras (ejemplo: `sistemagestion.tk`)

### 1.3 Obtener el Dominio Gratis

1. Haz clic en **"Get it now!"** o **"Add to Cart"** junto al dominio que quieras
2. Selecciona **"12 Months @ FREE"** (12 meses gratis)
3. Haz clic en **"Continue"** o **"Checkout"**
4. Completa el proceso de registro:
   - Selecciona duración: **12 meses @ FREE**
   - Haz clic en **"Complete Order"**
5. Espera la confirmación (puede tomar unos minutos)
6. **¡Felicidades!** Ya tienes tu dominio gratis 🎉

---

## 📋 PASO 2: Configurar DNS en Freenom

### 2.1 Acceder a la Gestión del Dominio

1. En Freenom, ve a **"Services"** → **"My Domains"**
2. Busca tu dominio (ejemplo: `sistemagestion.tk`)
3. Haz clic en **"Manage Domain"** o en el nombre del dominio

### 2.2 Ir a la Configuración de DNS

1. En la página de gestión del dominio, busca la pestaña **"Management Tools"**
2. Haz clic en **"Nameservers"** o **"Use Freenom Nameservers"**
3. Verifica que esté seleccionado: **"Use Freenom's own nameservers"**
4. Haz clic en **"Change Nameservers"** si es necesario

---

## 📋 PASO 3: Verificar el Dominio en Resend

### 3.1 Agregar el Dominio en Resend

1. Ve a **https://resend.com** e inicia sesión
2. En el menú izquierdo, haz clic en **"Domains"**
3. Haz clic en el botón **"Add Domain"** (arriba a la derecha)
4. Ingresa tu dominio (ejemplo: `sistemagestion.tk`)
   - **Solo el dominio**, sin `www` ni `http://`
5. Haz clic en **"Add Domain"**

### 3.2 Obtener los Registros DNS

1. Resend te mostrará una página con **"DNS Configuration"**
2. Te mostrará varios registros DNS que debes agregar:

   **Registros típicos que Resend solicita:**
   
   **Tipo: TXT**
   - **Name/Host**: `@` o dejar vacío
   - **Value**: `v=spf1 include:_spf.resend.com ~all`
   
   **Tipo: TXT**
   - **Name/Host**: `_resend` o `resend._domainkey`
   - **Value**: Un texto largo (lo que Resend te muestre)
   
   **Tipo: CNAME** (opcional, para tracking)
   - **Name/Host**: `resend` o `resend._domainkey`
   - **Value**: Un CNAME que Resend te proporciona

3. **Copia cada registro** que Resend te muestre (los necesitarás)

---

## 📋 PASO 4: Agregar los Registros DNS en Freenom

### 4.1 Agregar Registros TXT

1. En Freenom, ve a **"Management Tools"** → **"DNS Management"**
2. Si no ves esta opción, ve a **"Services"** → **"My Domains"** → Tu dominio → **"Management Tools"** → **"Manage Freenom DNS"**

3. Verás una tabla con registros DNS

4. Para cada registro TXT que Resend te dio:

   **Agregar SPF (primero):**
   - **Type**: Selecciona **"TXT"**
   - **Name**: Deja vacío o ingresa **"@"** (para el dominio raíz)
   - **TTL**: Deja el valor por defecto (3600)
   - **Target/Points to**: Pega el valor que Resend te dio (ejemplo: `v=spf1 include:_spf.resend.com ~all`)
   - Haz clic en **"Save"** o **"Save Changes"**

   **Agregar Registro de Resend (segundo):**
   - **Type**: Selecciona **"TXT"**
   - **Name**: Ingresa **"_resend"** (exactamente como Resend te lo indica)
   - **TTL**: 3600
   - **Target/Points to**: Pega el valor largo que Resend te dio
   - Haz clic en **"Save"**

### 4.2 Agregar Registros CNAME (si Resend los solicita)

1. Para cada registro CNAME:
   - **Type**: Selecciona **"CNAME"**
   - **Name**: El nombre que Resend te dio (ejemplo: `resend`)
   - **TTL**: 3600
   - **Target/Points to**: El CNAME que Resend te proporciona
   - Haz clic en **"Save"**

### 4.3 Verificar que se Guardaron Correctamente

1. Deberías ver todos los registros que agregaste en la lista
2. Asegúrate de que:
   - ✅ El SPF está como registro TXT en `@`
   - ✅ El registro de Resend está como TXT en `_resend`
   - ✅ Los CNAME están configurados (si aplica)

---

## 📋 PASO 5: Esperar la Propagación DNS

### 5.1 Tiempo de Espera

1. Los cambios DNS pueden tardar entre **5 minutos y 24 horas**
2. Normalmente toma **10-30 minutos** con Freenom
3. **No cierres esta guía**, seguiremos después

### 5.2 Verificar Propagación (Opcional)

Puedes verificar si los registros DNS se han propagado:

1. Ve a **https://mxtoolbox.com/TXTLookup.aspx**
2. Ingresa tu dominio (ejemplo: `sistemagestion.tk`)
3. Haz clic en **"TXT Lookup"**
4. Verifica que aparezcan tus registros TXT

---

## 📋 PASO 6: Verificar el Dominio en Resend

### 6.1 Verificar Estado en Resend

1. Ve a **https://resend.com/domains**
2. Busca tu dominio en la lista
3. Verás uno de estos estados:
   - ⏳ **"Pending"** o **"Verifying"** = Todavía verificando
   - ❌ **"Failed"** = Hubo un error (revisa los registros DNS)
   - ✅ **"Verified"** o **"Active"** = ¡Listo! ✅

### 6.2 Si Está "Pending"

1. Espera 5-10 minutos más
2. Haz clic en el botón **"Refresh"** o actualiza la página
3. Resend verificará automáticamente

### 6.3 Si Está "Failed"

1. Revisa que los registros DNS estén correctos:
   - Ve a Freenom y verifica que los registros estén guardados
   - Compara con lo que Resend solicitó
   
2. Verifica que los valores estén correctos:
   - Sin espacios extra al inicio o final
   - Nombres exactamente como Resend los indica

3. Intenta verificar de nuevo en Resend (botón **"Verify"** o **"Retry"**)

### 6.4 Si Está "Verified" ✅

**¡Felicidades!** Tu dominio está verificado. Continúa con el siguiente paso.

---

## 📋 PASO 7: Actualizar Configuración en Supabase

### 7.1 Obtener el Email del Dominio Verificado

1. Tu dominio es: `sistemagestion.tk` (ejemplo)
2. El email será: `noreply@sistemagestion.tk` o `sistema@sistemagestion.tk`
3. Formato completo: `Sistema de Gestión Técnica <noreply@sistemagestion.tk>`

### 7.2 Actualizar en Supabase

1. Ve a **https://supabase.com** e inicia sesión
2. Selecciona tu proyecto
3. Ve a **"Settings"** (⚙️ en el menú izquierdo)
4. Haz clic en **"Edge Functions"** (en el submenú)
5. Haz clic en **"Secrets"** (pestaña)
6. Busca **"RESEND_FROM_EMAIL"**
7. Haz clic en el botón **"Edit"** o en los tres puntos (...) → **"Edit"**
8. Cambia el valor de:
   
   **Valor ANTERIOR:**
   ```
   Sistema de Gestión Técnica <onboarding@resend.dev>
   ```
   
   **Valor NUEVO:**
   ```
   Sistema de Gestión Técnica <noreply@tudominio.tk>
   ```
   
   (Reemplaza `tudominio.tk` con tu dominio real, ejemplo: `noreply@sistemagestion.tk`)

9. Haz clic en **"Save"** o **"Update"**

### 7.3 Verificar que se Guardó

1. Deberías ver el valor actualizado en la lista
2. Verifica que el email use tu dominio (no `@resend.dev`)

---

## 📋 PASO 8: Probar el Sistema

### 8.1 Reiniciar el Servidor (si es necesario)

1. Si tienes el servidor de desarrollo corriendo, reinícialo:
   - Detén: `Ctrl + C`
   - Reinicia: `npm run dev`

### 8.2 Probar con un Email Diferente

1. Abre tu aplicación
2. Ve a **"Recuperar Contraseña"**
3. Ingresa un email diferente a `emersoncastro9.ec@gmail.com`
   - Por ejemplo: `maryelingoliveros33@gmail.com`
   - O cualquier otro email
4. Haz clic en **"Enviar Token"**
5. **Debería funcionar ahora** ✅

### 8.3 Verificar el Email

1. Revisa la bandeja de entrada del email que usaste
2. También revisa **spam** (puede tardar unos minutos)
3. Deberías recibir el email con el token de recuperación

---

## 🎉 ¡Listo!

Si todo funcionó correctamente:
- ✅ Tu dominio está verificado en Resend
- ✅ Puedes enviar emails a cualquier destinatario
- ✅ El sistema está completamente funcional

---

## ⚠️ Problemas Comunes y Soluciones

### Problema 1: "Failed" en Resend

**Solución:**
- Verifica que los registros DNS estén correctos en Freenom
- Asegúrate de que los nombres (Name/Host) sean exactos
- Espera 15-30 minutos y vuelve a intentar verificar

### Problema 2: Los Registros DNS No Aparecen

**Solución:**
- Espera más tiempo (puede tomar hasta 24 horas)
- Verifica en Freenom que los registros estén guardados
- Usa https://mxtoolbox.com para verificar la propagación

### Problema 3: El Email Sigue Sin Llegar

**Solución:**
- Verifica que `RESEND_FROM_EMAIL` esté actualizado en Supabase
- Revisa los logs de la Edge Function en Supabase
- Verifica que el dominio esté "Verified" en Resend

### Problema 4: Los Emails Van a Spam

**Solución:**
- Esto es normal al principio
- Los usuarios deben marcar como "No es spam"
- Con el tiempo mejorará la deliverability

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas en algún paso:
1. Revisa los logs en Supabase Dashboard → Edge Functions → send-email → Logs
2. Verifica que todos los registros DNS estén correctos
3. Asegúrate de que el dominio esté "Verified" en Resend

---

**¿Estás listo para comenzar? ¡Vamos paso a paso!**







