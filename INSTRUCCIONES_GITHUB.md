# 📤 Instrucciones para Subir el Proyecto a GitHub

Esta guía te ayudará a subir tu proyecto a GitHub paso a paso.

## 📋 Prerrequisitos

1. **Tener una cuenta de GitHub** - Si no la tienes, créala en [github.com](https://github.com)
2. **Tener Git instalado** - Verifica con `git --version`
3. **Tener acceso a Internet**

## 🚀 Pasos para Subir el Proyecto

### Opción 1: Si ya tienes un repositorio en GitHub

#### Paso 1: Verificar el repositorio remoto

```bash
# Verifica si ya tienes un remoto configurado
git remote -v
```

Si ya tienes un remoto, verás algo como:
```
origin  https://github.com/TU_USUARIO/field-service-sync-84707.git (fetch)
origin  https://github.com/TU_USUARIO/field-service-sync-84707.git (push)
```

#### Paso 2: Agregar todos los archivos al staging

```bash
# Agrega todos los archivos modificados y nuevos
git add .

# O si prefieres agregar archivos específicos:
git add README.md
git add .gitignore
git add src/
git add public/
# etc.
```

#### Paso 3: Hacer commit de los cambios

```bash
# Crea un commit con un mensaje descriptivo
git commit -m "feat: Actualizar proyecto con README y configuración completa

- Agregar README.md con instrucciones completas
- Actualizar .gitignore para archivos sensibles
- Incluir todos los componentes y páginas
- Agregar documentación y scripts SQL"
```

#### Paso 4: Subir los cambios a GitHub

```bash
# Sube los cambios a la rama main
git push origin main

# O si es tu primera vez y necesitas configurar el upstream:
git push -u origin main
```

---

### Opción 2: Crear un nuevo repositorio en GitHub

#### Paso 1: Crear el repositorio en GitHub

1. Ve a [github.com](https://github.com) e inicia sesión
2. Haz clic en el botón **"+"** en la esquina superior derecha
3. Selecciona **"New repository"**
4. Completa los datos:
   - **Repository name**: `field-service-sync-84707` (o el nombre que prefieras)
   - **Description**: "Sistema de Gestión de Servicios de Campo"
   - **Visibility**: Elige **Public** o **Private**
   - **NO marques** "Initialize this repository with a README" (ya tienes uno)
5. Haz clic en **"Create repository"**

#### Paso 2: Conectar tu repositorio local con GitHub

GitHub te mostrará instrucciones. Usa estas comandos:

```bash
# Si tu repositorio local NO tiene commits aún (poco probable)
git remote add origin https://github.com/TU_USUARIO/field-service-sync-84707.git
git branch -M main
git push -u origin main

# Si tu repositorio local YA tiene commits (más probable)
git remote add origin https://github.com/TU_USUARIO/field-service-sync-84707.git
git branch -M main
git push -u origin main
```

**Nota**: Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub.

#### Paso 3: Agregar y hacer commit de los cambios

```bash
# Agrega todos los archivos
git add .

# Haz commit
git commit -m "feat: Proyecto completo Field Service Sync

- Sistema completo de gestión de servicios de campo
- Múltiples roles (Cliente, Agente, Técnico, Coordinador, Admin)
- Integración con Supabase
- Documentación completa"

# Sube a GitHub
git push -u origin main
```

---

## 🔐 Autenticación con GitHub

GitHub ya no acepta contraseñas para Git. Necesitas usar uno de estos métodos:

### Método 1: Personal Access Token (PAT) - Recomendado

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Genera un nuevo token con permisos `repo`
3. Cuando hagas `git push`, usa el token como contraseña

### Método 2: SSH Keys

1. Genera una clave SSH:
```bash
ssh-keygen -t ed25519 -C "tu_email@ejemplo.com"
```

2. Agrega la clave pública a GitHub:
   - Settings → SSH and GPG keys → New SSH key
   - Copia el contenido de `~/.ssh/id_ed25519.pub`

3. Cambia la URL del remoto a SSH:
```bash
git remote set-url origin git@github.com:TU_USUARIO/field-service-sync-84707.git
```

### Método 3: GitHub CLI

```bash
# Instala GitHub CLI
# Luego autentica
gh auth login
```

---

## 📝 Comandos Útiles

### Ver el estado del repositorio
```bash
git status
```

### Ver los cambios que se subirán
```bash
git status --short
```

### Ver el historial de commits
```bash
git log --oneline
```

### Deshacer cambios no commitados
```bash
# Descartar cambios en un archivo específico
git restore archivo.txt

# Descartar todos los cambios
git restore .
```

### Ver qué archivos se ignoran
```bash
git status --ignored
```

---

## ⚠️ Problemas Comunes y Soluciones

### Error: "fatal: remote origin already exists"

```bash
# Elimina el remoto existente
git remote remove origin

# Agrega el nuevo remoto
git remote add origin https://github.com/TU_USUARIO/field-service-sync-84707.git
```

### Error: "failed to push some refs"

```bash
# Primero haz pull de los cambios remotos
git pull origin main --rebase

# Luego intenta push nuevamente
git push origin main
```

### Error: "authentication failed"

- Verifica que estés usando un Personal Access Token o SSH
- Asegúrate de que el token tenga los permisos correctos

### Archivos grandes o lentos

Si el proyecto es muy grande, considera:
- Verificar que `node_modules` esté en `.gitignore`
- Verificar que `dist` esté en `.gitignore`
- Usar Git LFS para archivos grandes

---

## ✅ Verificación Final

Después de subir, verifica que todo esté correcto:

1. Ve a tu repositorio en GitHub
2. Verifica que todos los archivos estén presentes
3. Verifica que el README.md se muestre correctamente
4. Verifica que `.gitignore` esté funcionando (no deberías ver `node_modules`)

---

## 🎯 Siguiente Paso: Compartir el Proyecto

Una vez que el proyecto esté en GitHub, otros pueden:

1. **Clonar el repositorio**:
```bash
git clone https://github.com/TU_USUARIO/field-service-sync-84707.git
```

2. **Instalar dependencias**:
```bash
cd field-service-sync-84707
npm install
```

3. **Ejecutar el proyecto**:
```bash
npm run dev
```

---

## 📞 Ayuda Adicional

Si tienes problemas:
- Revisa la [documentación de Git](https://git-scm.com/doc)
- Revisa la [documentación de GitHub](https://docs.github.com)
- Busca en [Stack Overflow](https://stackoverflow.com) con el tag `git` o `github`

---

**¡Éxito con tu proyecto!** 🚀

