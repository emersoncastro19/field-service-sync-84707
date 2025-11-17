# 🚀 Actualizar Edge Function send-email - Paso a Paso

## ⚠️ PROBLEMA ACTUAL

Estás viendo un error **500 genérico** porque la Edge Function desplegada es la versión antigua que no maneja correctamente el error 403 de Resend.

## ✅ SOLUCIÓN: Desplegar la Versión Actualizada

---

## **PASO 1: Ir a Supabase Dashboard**

1. Ve a **https://supabase.com**
2. **Inicia sesión**
3. Selecciona tu proyecto

---

## **PASO 2: Abrir Edge Functions**

1. En el menú izquierdo, busca **"Edge Functions"**
2. Haz clic en **"Edge Functions"**
3. Busca la función **`send-email`**
4. Haz clic en **`send-email`** para abrirla

---

## **PASO 3: Editar el Código**

1. Haz clic en el botón **"Edit"** o **"Edit Function"** (arriba a la derecha)
2. Si no ves el botón Edit, haz clic directamente en el código para editarlo

---

## **PASO 4: Reemplazar TODO el Código**

1. **Abre el archivo**: `COPIAR_EDGE_FUNCTION_COMPLETA.txt`
2. **Selecciona TODO** el contenido:
   - Presiona `Ctrl + A` (Windows) o `Cmd + A` (Mac)
3. **Copia** el código:
   - Presiona `Ctrl + C` (Windows) o `Cmd + C` (Mac)

4. **En Supabase**:
   - **Selecciona TODO** el código existente (`Ctrl + A` o `Cmd + A`)
   - **Bórralo** (`Delete` o `Backspace`)
   - **Pega** el código nuevo (`Ctrl + V` o `Cmd + V`)

5. **Verifica** que el código esté completo:
   - Debe empezar con: `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"`
   - Debe terminar con: `})`

---

## **PASO 5: Guardar y Desplegar**

1. Haz clic en el botón **"Deploy"** o **"Save"** (arriba a la derecha)
2. Espera a que se despliegue (puede tomar 10-30 segundos)
3. Deberías ver un mensaje de éxito: ✅ "Function deployed successfully"

---

## **PASO 6: Verificar el Despliegue**

1. Ve a la pestaña **"Logs"** (o **"Invocations"**)
2. Deberías ver logs recientes cuando ejecutes la función

---

## **PASO 7: Probar de Nuevo**

1. **Abre tu aplicación** en el navegador
2. Ve a **Recuperar Contraseña**
3. **Ingresa el email**: `emersoncastro9.ec@gmail.com` (para probar inmediatamente)
4. Haz clic en **"Enviar Token"**
5. **Revisa la consola** (F12 → Console)

### **Si funciona con `emersoncastro9.ec@gmail.com`:**
✅ **¡Perfecto!** La Edge Function está actualizada. Ahora deberías ver un mensaje de error más claro si intentas con otro email.

### **Si intentas con otro email (ej: `maryelingoliveros33@gmail.com`):**
Ahora deberías ver un mensaje de error más claro que dice:
```
"Resend requiere verificar un dominio para enviar emails a otros destinatarios..."
```

En lugar del error genérico "500 Internal Server Error".

---

## 🎯 Resultado Esperado

### **ANTES (versión antigua):**
- Error 500 genérico
- Mensaje: "Edge Function returned a non-2xx status code"
- No sabes qué está mal

### **DESPUÉS (versión actualizada):**
- Error 403 específico
- Mensaje claro: "Resend requiere verificar un dominio..."
- Instrucciones de solución incluidas

---

## ⚠️ Si No Funciona

1. **Verifica que copiaste TODO el código** (no falte nada)
2. **Verifica que guardaste/desplegaste** correctamente
3. **Espera 1-2 minutos** y prueba de nuevo (puede tomar tiempo propagarse)
4. **Revisa los logs** en Supabase para ver el error exacto

---

## 📋 Checklist

- [ ] Abrí Supabase Dashboard
- [ ] Encontré la función `send-email`
- [ ] Abrí el editor de código
- [ ] Copié TODO el código de `COPIAR_EDGE_FUNCTION_COMPLETA.txt`
- [ ] Reemplacé TODO el código en Supabase
- [ ] Guardé/Desplegué la función
- [ ] Esperé a que se despliegue
- [ ] Probé con `emersoncastro9.ec@gmail.com` (debería funcionar)
- [ ] Probé con otro email (debería mostrar error claro)

---

¿Necesitas ayuda con algún paso específico?







