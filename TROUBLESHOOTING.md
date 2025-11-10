# 🔧 Guía de Solución de Problemas

## Errores Comunes Después de Cambios en el Código

### ❌ "No se pudieron cargar los datos del cliente"

Este error puede aparecer por varias razones. Sigue estos pasos en orden:

### 📋 Checklist de Solución

#### 1️⃣ **Limpiar Caché del Navegador** (MÁS COMÚN)
- **Windows/Linux**: `Ctrl + Shift + R` o `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`
- **Alternativa**: Abre DevTools (F12) → Click derecho en el botón de recarga → "Vaciar caché y volver a cargar de forma forzada"

#### 2️⃣ **Cerrar Sesión y Volver a Ingresar**
1. Cierra sesión completamente
2. Cierra **todas las pestañas** del navegador relacionadas con la app
3. Abre una **nueva pestaña**
4. Ingresa de nuevo

#### 3️⃣ **Limpiar Datos del Navegador**
1. Abre DevTools (F12)
2. Ve a la pestaña "Application" o "Aplicación"
3. En el menú izquierdo, busca "Storage" o "Almacenamiento"
4. Click en "Clear site data" o "Borrar datos del sitio"
5. Recarga la página

#### 4️⃣ **Verificar la Consola del Navegador**
1. Abre DevTools (F12)
2. Ve a la pestaña "Console"
3. Busca errores en **rojo**
4. Anota el mensaje de error exacto
5. Verifica si el error menciona:
   - `Network error` → Problema de conexión
   - `401 Unauthorized` → Sesión expirada
   - `403 Forbidden` → Problema de permisos
   - `429 Too Many Requests` → **Límite de Supabase alcanzado**
   - `500 Internal Server Error` → Error del servidor

#### 5️⃣ **Verificar Límites de Supabase**

##### Cómo Verificar:
1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a "Settings" → "Usage" o "Uso"
3. Revisa los límites:
   - **API Requests**: Límite diario/mensual
   - **Database Size**: Tamaño de la base de datos
   - **Storage**: Almacenamiento usado

##### Planes Gratuitos Típicos:
- **500 MB** de base de datos
- **1 GB** de almacenamiento de archivos
- **2 GB** de ancho de banda
- **50,000 requests/mes** a la API

##### Si alcanzaste el límite:
- **Solución temporal**: Espera hasta el próximo ciclo (día/mes)
- **Solución permanente**: Actualiza tu plan de Supabase

#### 6️⃣ **Verificar Conexión a Supabase**
1. Abre DevTools (F12) → Pestaña "Network" o "Red"
2. Recarga la página
3. Busca llamadas a `supabase.co`
4. Verifica:
   - ✅ **200 OK** → Conexión exitosa
   - ❌ **401/403** → Problema de autenticación
   - ❌ **429** → Límite alcanzado
   - ❌ **500** → Error del servidor
   - ❌ **Failed** → Sin conexión

### 🔍 Diferenciar Tipos de Errores

#### Error de Código (Software)
- ✅ Aparece en la **consola del navegador**
- ✅ El mensaje menciona nombres de archivos `.tsx` o `.ts`
- ✅ Aparece solo después de hacer cambios
- ✅ **Solución**: Revisar el código modificado

#### Error de Supabase (Límites/Red)
- ✅ Aparece como error de red en "Network"
- ✅ Código de error HTTP: `429`, `500`, `503`
- ✅ Aparece incluso sin hacer cambios
- ✅ **Solución**: Verificar límites y conexión

#### Error de Sesión (Autenticación)
- ✅ Código de error HTTP: `401`, `403`
- ✅ Aparece después de estar inactivo
- ✅ Mensaje: "Unauthorized" o "Forbidden"
- ✅ **Solución**: Cerrar sesión y volver a ingresar

### 🚀 Proceso Recomendado

Cuando veas errores después de cambios:

1. **Primero**: `Ctrl + Shift + R` (hard refresh)
2. **Si persiste**: Cerrar sesión y volver a ingresar
3. **Si persiste**: Limpiar caché del navegador
4. **Si persiste**: Verificar consola para errores específicos
5. **Si persiste**: Verificar límites de Supabase

### 📝 Notas Importantes

- **No es necesario crear una nueva pestaña** si haces hard refresh correctamente
- **Los límites de Supabase** son raros en desarrollo, pero posibles
- **Los errores de código** aparecen inmediatamente después de cambios
- **Los errores de sesión** aparecen después de estar inactivo

### 🆘 Si Nada Funciona

1. Verifica que el servidor de desarrollo esté corriendo (`npm run dev`)
2. Verifica que no haya errores de sintaxis en la consola
3. Verifica que las variables de entorno de Supabase estén correctas
4. Contacta al administrador si el problema persiste

---

**Última actualización**: $(date)




