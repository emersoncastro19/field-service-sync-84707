# 📤 Guía Rápida: Subir Cambios a GitHub

## 🚀 Comandos para Subir tus Cambios

Ejecuta estos comandos en orden en PowerShell o Git Bash:

```bash
# 1. Ir al directorio del proyecto
cd "c:\PROYECTO ING SOFT II\field-service-sync-84707"

# 2. Ver qué cambios tienes (opcional)
git status

# 3. Agregar TODOS los cambios (modificados, eliminados y nuevos)
git add .

# 4. Hacer commit con un mensaje descriptivo
git commit -m "feat: Actualizar proyecto con nuevas funcionalidades

- Agregar scripts SQL para coordinador y técnico
- Actualizar páginas y componentes
- Agregar documentación de almacenamiento y configuración
- Eliminar componentes no utilizados
- Mejorar gestión de ejecución y asignaciones"

# 5. Subir los cambios a GitHub
git push origin main
```

## 📝 Explicación de los Comandos

### `git add .`
- Agrega todos los archivos modificados, eliminados y nuevos al área de staging
- El punto (.) significa "todos los archivos"

### `git commit -m "mensaje"`
- Crea un commit con todos los cambios en staging
- El mensaje debe ser descriptivo de lo que cambiaste

### `git push origin main`
- Sube los commits al repositorio remoto en GitHub
- `origin` es el nombre del repositorio remoto
- `main` es la rama donde estás trabajando

## ✅ Verificación

Después de ejecutar los comandos, verifica que todo esté bien:

```bash
# Ver el estado (debe decir "nothing to commit, working tree clean")
git status

# Ver los últimos commits
git log --oneline -3
```

## 🔄 Para tu Compañero

Una vez que subas los cambios, tu compañero puede descargarlos con:

```bash
# Opción 1: Si ya tiene el proyecto clonado
git pull origin main

# Opción 2: Si es la primera vez
git clone https://github.com/emersoncastro19/field-service-sync-84707.git
cd field-service-sync-84707
npm install
npm run dev
```

## ⚠️ Si hay Errores

### Error: "Updates were rejected"
```bash
# Primero trae los cambios del remoto
git pull origin main --rebase

# Luego intenta push nuevamente
git push origin main
```

### Error: "Authentication failed"
- Necesitas un Personal Access Token (PAT)
- Ve a: https://github.com/settings/tokens
- Genera un nuevo token con permisos `repo`
- Úsalo como contraseña cuando Git te la pida

---

**¡Listo!** Con estos comandos tus cambios estarán en GitHub. 🎉

