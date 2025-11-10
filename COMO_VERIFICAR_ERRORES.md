# 🔍 Cómo Verificar Errores en la Consola

## Paso 1: Abrir la Consola del Navegador
1. Presiona `F12` o `Ctrl + Shift + I` (Windows) / `Cmd + Option + I` (Mac)
2. Ve a la pestaña **"Console"**

## Paso 2: Identificar el Tipo de Error

### ❌ Error de Límites de Supabase
```
Error: 429 Too Many Requests
```
**Solución**: Has alcanzado el límite. Espera o actualiza tu plan.

### ❌ Error de Sesión Expirada
```
Error: 401 Unauthorized
Error: 403 Forbidden
```
**Solución**: Cierra sesión y vuelve a ingresar.

### ❌ Error de Red
```
Error: Network error
Error: Failed to fetch
```
**Solución**: Verifica tu conexión a internet.

### ❌ Error de Código
```
Error: Cannot read property 'X' of undefined
Error: Unexpected token
```
**Solución**: Error en el código. Revisa los cambios recientes.

## Paso 3: Verificar Llamadas a Supabase
1. Ve a la pestaña **"Network"** o **"Red"**
2. Filtra por "supabase"
3. Busca llamadas con estado:
   - ✅ **200** → Éxito
   - ❌ **401/403** → Sesión expirada
   - ❌ **429** → Límite alcanzado
   - ❌ **500** → Error del servidor

## Paso 4: Copiar el Error Completo
1. Click derecho en el error
2. Selecciona "Copy" o "Copiar"
3. Compártelo para debugging




