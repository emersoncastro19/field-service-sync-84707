# Guía de Despliegue en Vercel

## 🚀 Cómo Subir Cambios Actuales a Vercel

### Opción 1: Despliegue Automático (Recomendado)

#### 1. Preparar y subir cambios a Git
```bash
# 1. Verificar el estado de tus archivos
git status

# 2. Agregar todos los cambios
git add .

# 3. Hacer commit con un mensaje descriptivo
git commit -m "Mejoras en reportes: eliminados recuadros, agregados filtros"

# 4. Subir a GitHub/GitLab
git push origin main
```

#### 2. Vercel desplegará automáticamente
- Vercel detecta el push automáticamente
- Ve a tu dashboard de Vercel para ver el progreso
- El despliegue toma 1-3 minutos normalmente

### Opción 2: Despliegue Manual con Vercel CLI

#### 1. Instalar Vercel CLI (si no lo tienes)
```bash
npm install -g vercel
```

#### 2. Hacer login en Vercel
```bash
vercel login
```

#### 3. Desplegar directamente
```bash
# Desplegar a preview
vercel

# O desplegar directamente a producción
vercel --prod
```

## Pasos para configuración inicial (solo primera vez)

### 1. Configurar Vercel (solo primera vez)
1. Ve a [vercel.com](https://vercel.com) y crea una cuenta
2. Conecta tu cuenta de GitHub/GitLab/Bitbucket
3. Importa tu repositorio
4. Vercel detectará automáticamente que es un proyecto Vite

### 2. Configurar Variables de Entorno (solo primera vez)
En el dashboard de Vercel, ve a Settings > Environment Variables y agrega:

```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### 3. Configurar Supabase para producción (solo primera vez)
1. En tu proyecto de Supabase, ve a Settings > API
2. Copia la URL del proyecto y la clave anónima
3. Ve a Authentication > URL Configuration
4. Agrega tu dominio de Vercel a las URLs permitidas:
   - Site URL: `https://tu-app.vercel.app`
   - Redirect URLs: `https://tu-app.vercel.app/**`

## 📱 Verificar el Despliegue

### 1. Monitorear el proceso
- Ve a tu dashboard de Vercel
- Busca tu proyecto
- Ve a la pestaña "Deployments"
- Verás el progreso en tiempo real

### 2. Probar la aplicación
- Una vez completado, haz clic en "Visit"
- Prueba las nuevas funcionalidades:
  - Ve a la sección de Reportes
  - Verifica que los filtros funcionen
  - Confirma que no aparezcan los recuadros antiguos

### 3. Dominio personalizado (opcional)
- En el dashboard de Vercel, ve a Settings > Domains
- Agrega tu dominio personalizado si tienes uno

## 🛠️ Comandos Útiles

### Git (para subir cambios)
```bash
# Ver estado de archivos
git status

# Agregar archivos específicos
git add src/frontend/pages/Reportes.tsx

# Agregar todos los cambios
git add .

# Hacer commit
git commit -m "Descripción de los cambios"

# Subir a repositorio
git push origin main

# Ver historial de commits
git log --oneline
```

### Vercel CLI (opcional)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login en Vercel
vercel login

# Desplegar a preview
vercel

# Desplegar a producción
vercel --prod

# Ver logs del despliegue
vercel logs
```

### Desarrollo local
```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción (probar antes de desplegar)
npm run build

# Preview de la build
npm run preview
```

## 🔧 Solución de Problemas Comunes

### Error de rutas (404 en refresh)
- El archivo `vercel.json` ya está configurado para manejar el routing de React Router
- Si persiste, verifica que el archivo `vercel.json` esté en la raíz del proyecto

### Variables de entorno no funcionan
- Asegúrate de que las variables empiecen con `VITE_`
- Verifica que estén configuradas en el dashboard de Vercel
- Redespliega después de cambiar variables de entorno

### Error de autenticación de Supabase
- Verifica que las URLs de redirect estén configuradas correctamente en Supabase
- Asegúrate de que las variables de entorno sean correctas
- Revisa que el dominio de Vercel esté en las URLs permitidas

### Build falla
```bash
# Probar build localmente primero
npm run build

# Si falla localmente, revisar errores de TypeScript
npm run type-check

# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Cambios no se reflejan
- Verifica que el commit se haya subido: `git log --oneline`
- Revisa el dashboard de Vercel para ver si el despliegue fue exitoso
- Limpia cache del navegador (Ctrl+F5 o Cmd+Shift+R)
- Verifica que estés viendo la URL correcta de producción

## 📞 Enlaces Útiles

- [Dashboard de Vercel](https://vercel.com/dashboard)
- [Documentación de Vercel](https://vercel.com/docs)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)