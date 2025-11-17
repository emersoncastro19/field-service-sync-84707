# 🔧 Solución: Emails Llegan a SPAM en Gmail

## ✅ Confirmado

- ✅ Edge Function funciona correctamente
- ✅ Resend acepta el email
- ✅ Los emails SÍ llegan a Gmail
- ❌ **PERO van a SPAM** (no a la bandeja de entrada principal)

## 🎯 Solución: Usar Dominio Verificado en Resend

El problema es que estás usando el dominio de prueba `onboarding@resend.dev`, que tiene **baja reputación** y Gmail lo marca como spam automáticamente.

**La solución es verificar tu propio dominio en Resend** y usarlo para enviar emails.

---

## 📋 Pasos para Solucionar

### Paso 1: Verificar tu Dominio en Resend

#### 1.1. Tener un Dominio

Necesitas tener un dominio (ejemplo: `tudominio.com`). Si NO tienes:
- Puedes comprar uno en: GoDaddy, Namecheap, Google Domains, Cloudflare, etc.
- O usa un subdominio si ya tienes un dominio

#### 1.2. Agregar Dominio en Resend

1. **Ve a https://resend.com**
2. **Inicia sesión** en tu cuenta
3. **Ve a "Domains"** en el menú lateral
4. **Click en "Add Domain"** (botón verde)
5. **Ingresa tu dominio** (ejemplo: `tudominio.com`)
   - NO incluyas `www` ni `http://`
   - Solo el dominio: `tudominio.com`
6. **Click en "Add Domain"**

#### 1.3. Configurar Registros DNS

Resend te mostrará **3 registros DNS** que debes agregar a tu dominio:

1. **SPF Record** (Tipo: TXT)
   - Nombre: `@` o vacío (depende de tu proveedor)
   - Valor: `v=spf1 include:resend.com ~all`

2. **DKIM Record** (Tipo: TXT)
   - Nombre: `resend._domainkey` (o similar)
   - Valor: Resend te dará un string largo

3. **DMARC Record** (Tipo: TXT) - Opcional pero recomendado
   - Nombre: `_dmarc`
   - Valor: `v=DMARC1; p=none; rua=mailto:tudominio@resend.dev`

#### 1.4. Agregar Registros en tu Proveedor de DNS

**Dependiendo de tu proveedor:**

**Si usas Cloudflare:**
1. Ve a tu dominio en Cloudflare Dashboard
2. Click en **"DNS"** → **"Records"**
3. Click en **"Add record"**
4. Para cada registro:
   - **Tipo**: Selecciona el tipo (TXT para todos)
   - **Nombre**: El nombre que Resend te dio
   - **Contenido**: El valor que Resend te dio
   - **TTL**: Auto o 3600
5. Click en **"Save"**

**Si usas GoDaddy:**
1. Ve a tu cuenta de GoDaddy
2. **My Products** → **DNS**
3. Click en **"Manage DNS"**
4. Click en **"Add"** para cada registro
5. Completa los campos según Resend

**Si usas Google Domains:**
1. Ve a Google Domains
2. Click en tu dominio
3. **DNS** → **Custom resource records**
4. Click en **"Add"** para cada registro

**Si usas Namecheap:**
1. Ve a Namecheap Dashboard
2. **Domain List** → **Manage** → **Advanced DNS**
3. Click en **"Add New Record"** para cada registro

#### 1.5. Esperar Verificación

1. **Vuelve a Resend** → **Domains**
2. **Espera 5-15 minutos** para que los DNS se propaguen
3. **Resend verificará automáticamente** los registros
4. Cuando esté verificado, verás un ✅ verde

**Nota**: Puede tomar hasta 24 horas, pero generalmente es en 5-15 minutos.

---

### Paso 2: Actualizar Secret en Supabase

Una vez que tu dominio esté verificado:

1. **Ve a Supabase Dashboard**
2. **Edge Functions** → **Secrets**
3. **Edita `RESEND_FROM_EMAIL`**
4. **Cambia el valor a:**
   ```
   Sistema de Gestión Técnica <noreply@tudominio.com>
   ```
   (Reemplaza `tudominio.com` con tu dominio real)

   **O si prefieres otro alias:**
   ```
   Sistema de Gestión Técnica <soporte@tudominio.com>
   ```
   ```
   Sistema de Gestión Técnica <contacto@tudominio.com>
   ```

5. **Guarda el secret**

---

### Paso 3: Probar Nuevamente

1. **Intenta recuperar contraseña** nuevamente
2. **Revisa tu bandeja de entrada** en Gmail
3. **El email debería llegar directamente** (no a spam)

---

## 🎯 Solución Rápida (Si No Tienes Dominio)

Si NO tienes un dominio y necesitas que funcione YA, puedes:

### Opción A: Usar Subdominio

Si tienes un dominio, puedes crear un subdominio:
- `mail.tudominio.com`
- `email.tudominio.com`
- `send.tudominio.com`

Y verificar ese subdominio en Resend.

### Opción B: Comprar Dominio Barato

Puedes comprar un dominio barato solo para emails:
- GoDaddy: ~$1-2 USD/año (primer año)
- Namecheap: ~$1-2 USD/año (primer año)
- Cloudflare: ~$8-10 USD/año (sin renovación cara)

Y usarlo solo para emails transaccionales.

### Opción C: Usar Email Verificado (Solo para Pruebas)

Puedes usar un email personal verificado temporalmente, pero esto NO es recomendable para producción.

---

## 💡 Mejores Prácticas para Evitar SPAM

### 1. Usar Dominio Propio Verificado
- ✅ Mejor reputación
- ✅ Menos probabilidad de ir a spam
- ✅ Control total

### 2. Configurar SPF, DKIM, DMARC Correctamente
- ✅ Autentica tus emails
- ✅ Mejora la deliverabilidad
- ✅ Resend lo hace automáticamente cuando verificas el dominio

### 3. Evitar Contenido que Activa Filtros de Spam
- ✅ Evita palabras como "FREE", "WIN", "URGENT", "CLICK NOW"
- ✅ No uses solo imágenes (incluye texto)
- ✅ No uses todos los enlaces en mayúsculas

### 4. Calentar tu Dominio
- ✅ Empieza enviando pocos emails
- ✅ Aumenta gradualmente
- ✅ Responde a los emails que recibas

### 5. Monitorear la Reputación
- ✅ Revisa los logs de Resend regularmente
- ✅ Revisa las tasas de bounce
- ✅ Revisa las tasas de spam

---

## 📋 Checklist

**Para solucionar el problema de SPAM:**

- [ ] Tengo un dominio (o voy a comprar uno)
- [ ] Agregué mi dominio en Resend → Domains
- [ ] Agregué los registros DNS (SPF, DKIM, DMARC) en mi proveedor
- [ ] Resend verificó mi dominio (✅ verde)
- [ ] Actualicé `RESEND_FROM_EMAIL` en Supabase Secrets
- [ ] Probé enviar un email y llegó a la bandeja principal (no spam)

---

## 🔍 Verificar que Funciona

Después de configurar todo:

1. **Envia un email de recuperación de contraseña**
2. **Revisa tu bandeja de entrada** en Gmail
3. **El email debería llegar directamente** (no en spam)
4. **Si llega a spam**, espera 5-10 minutos y vuelve a revisar
5. **Marca el email como "No es spam"** si todavía va a spam la primera vez
6. **Después de marcar como "No es spam"**, los siguientes deberían llegar directo

---

## ❓ ¿No Tienes Dominio?

Si no tienes un dominio, dime y te ayudo a:
1. Conseguir uno barato
2. Configurarlo
3. Verificarlo en Resend
4. Actualizar todo para que funcione

---

## 🎯 Siguiente Paso

**¿Tienes un dominio que puedas verificar en Resend?**

- **Si SÍ**: Sigue los pasos de arriba para verificarlo
- **Si NO**: Dime y te ayudo a conseguir uno o encontrar otra solución

Una vez que verifiques tu dominio y actualices el `RESEND_FROM_EMAIL`, los emails deberían llegar directamente a la bandeja de entrada, no a spam.









