# 📤 Guía Paso a Paso: Subir Cambios a GitHub

## 🚀 Pasos para Subir tus Cambios

### Paso 1: Abrir PowerShell o Git Bash
Abre PowerShell o Git Bash en la carpeta del proyecto:
```
C:\PROYECTO ING SOFT II\field-service-sync-84707r
```

### Paso 2: Ver qué cambios tienes (Opcional)
```bash
git status
```
Este comando te muestra qué archivos has modificado, eliminado o agregado.

### Paso 3: Agregar todos los cambios
```bash
git add .
```
Este comando agrega TODOS los cambios (modificados, eliminados y nuevos) al área de staging.

### Paso 4: Crear un commit con un mensaje descriptivo
```bash
git commit -m "feat: Descripción breve de los cambios

- Detalle 1 de lo que cambiaste
- Detalle 2 de lo que cambiaste
- Detalle 3 de lo que cambiaste"
```

**Ejemplo:**
```bash
git commit -m "fix: Corregir notificaciones y agregar scripts SQL

- Agregar scripts para corregir RLS de notificaciones
- Actualizar componente DetallesOrden
- Agregar documentación de solución de notificaciones"
```

### Paso 5: Subir los cambios a GitHub
```bash
git push origin main
```
Este comando sube tus commits al repositorio remoto en GitHub.

---

## ✅ Verificación

Después de ejecutar los comandos, verifica que todo esté bien:

```bash
git status
```

Debería decir: `nothing to commit, working tree clean` y `Your branch is up to date with 'origin/main'`

---

## 📝 Comandos Completos (Copia y Pega)

```bash
# 1. Ver cambios
git status

# 2. Agregar todos los cambios
git add .

# 3. Crear commit (cambia el mensaje según tus cambios)
git commit -m "feat: Actualizar proyecto con nuevos cambios"

# 4. Subir a GitHub
git push origin main
```

---

## ⚠️ Si hay Errores

### Error: "Updates were rejected"
Si GitHub tiene cambios que tú no tienes:
```bash
# Primero trae los cambios del remoto
git pull origin main

# Si hay conflictos, resuélvelos y luego:
git add .
git commit -m "merge: Resolver conflictos"
git push origin main
```

### Error: "Authentication failed"
Necesitas autenticarte con GitHub:
1. Ve a: https://github.com/settings/tokens
2. Genera un nuevo token (Personal Access Token - Classic)
3. Dale permisos `repo`
4. Cuando Git te pida la contraseña, usa el token

---

## 🎯 Tipos de Mensajes de Commit

Usa estos prefijos para organizar mejor tus commits:

- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de errores
- `docs:` - Cambios en documentación
- `style:` - Cambios de formato (espacios, comas, etc.)
- `refactor:` - Refactorización de código
- `test:` - Agregar o modificar tests
- `chore:` - Tareas de mantenimiento

**Ejemplos:**
```bash
git commit -m "feat: Agregar nueva página de reportes"
git commit -m "fix: Corregir error en validación de formularios"
git commit -m "docs: Actualizar README con nuevas instrucciones"
```

---

## 🔄 Para tu Compañero

Una vez que subas los cambios, tu compañero puede descargarlos con:

```bash
git pull origin main
```

---

## 📌 Resumen Rápido

1. **`git add .`** - Agregar cambios
2. **`git commit -m "mensaje"`** - Guardar cambios
3. **`git push origin main`** - Subir a GitHub

¡Eso es todo! 🎉

