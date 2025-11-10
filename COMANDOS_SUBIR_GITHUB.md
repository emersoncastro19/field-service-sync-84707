# 🚀 Comandos Rápidos para Subir a GitHub

## ⚡ Comandos que debes ejecutar (Copia y pega)

Abre PowerShell o Git Bash en la carpeta del proyecto y ejecuta estos comandos en orden:

```bash
# 1. Ir al directorio del proyecto
cd "c:\PROYECTO ING SOFT II\field-service-sync-84707"

# 2. Ver el estado actual (opcional, para ver qué se va a subir)
git status

# 3. Agregar todos los archivos al staging
git add .

# 4. Hacer commit con un mensaje descriptivo
git commit -m "feat: Proyecto completo Field Service Sync con documentación

- Agregar README.md con instrucciones completas en español
- Actualizar .gitignore para archivos sensibles
- Incluir todos los componentes y páginas del sistema
- Agregar documentación y scripts SQL
- Configurar proyecto para fácil instalación y ejecución"

# 5. Subir los cambios a GitHub
git push origin main
```

## 📝 Si es tu primera vez o necesitas autenticarte

Si GitHub te pide autenticación, necesitarás:

1. **Personal Access Token (PAT)**:
   - Ve a: https://github.com/settings/tokens
   - Genera un nuevo token (classic) con permisos `repo`
   - Úsalo como contraseña cuando Git te la pida

2. **O usa GitHub CLI**:
   ```bash
   gh auth login
   ```

## ✅ Verificación

Después de ejecutar los comandos:

1. Ve a: https://github.com/emersoncastro19/field-service-sync-84707
2. Verifica que todos los archivos estén presentes
3. Verifica que el README.md se muestre correctamente

## 🎯 Compartir el proyecto

Una vez subido, otros pueden clonar el proyecto con:

```bash
git clone https://github.com/emersoncastro19/field-service-sync-84707.git
cd field-service-sync-84707
npm install
npm run dev
```

---

**¡Listo!** Con estos comandos tu proyecto estará en GitHub. 🎉

