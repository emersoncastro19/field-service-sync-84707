# Field Service Sync - Sistema de Gestión de Servicios de Campo

Sistema completo de gestión de servicios de campo desarrollado con React, TypeScript, Vite y Supabase.

## 📋 Descripción

Este proyecto es una aplicación web para la gestión de servicios de campo que incluye múltiples roles (Cliente, Agente, Técnico, Coordinador, Admin) con funcionalidades específicas para cada uno.

## 🛠️ Tecnologías Utilizadas

- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y servidor de desarrollo
- **Supabase** - Backend como servicio (BaaS)
- **Tailwind CSS** - Framework de CSS
- **shadcn/ui** - Componentes de UI
- **React Router** - Enrutamiento
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas

## 📦 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior) - [Descargar Node.js](https://nodejs.org/)
- **npm** (viene con Node.js) o **yarn** o **pnpm**
- **Git** - [Descargar Git](https://git-scm.com/)

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
# Clona el repositorio
git clone https://github.com/TU_USUARIO/field-service-sync-84707.git

# Navega al directorio del proyecto
cd field-service-sync-84707
```

### 2. Instalar Dependencias

```bash
# Usando npm
npm install

# O usando yarn
yarn install

# O usando pnpm
pnpm install
```

### 3. Configurar Variables de Entorno (Opcional)

Actualmente las credenciales de Supabase están configuradas directamente en el código. Si deseas usar variables de entorno:

1. Crea un archivo `.env` en la raíz del proyecto:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

2. Actualiza `src/backend/config/supabaseClient.ts` para usar las variables de entorno:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
```

**Nota:** El archivo `.env` ya está en `.gitignore`, por lo que no se subirá al repositorio.

### 4. Ejecutar el Proyecto

```bash
# Inicia el servidor de desarrollo
npm run dev

# O usando yarn
yarn dev

# O usando pnpm
pnpm dev
```

El proyecto estará disponible en: `http://localhost:8080`

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo

# Producción
npm run build        # Construye la aplicación para producción
npm run build:dev    # Construye en modo desarrollo
npm run preview      # Previsualiza la build de producción

# Linting
npm run lint         # Ejecuta el linter
```

## 🗂️ Estructura del Proyecto

```
field-service-sync-84707/
├── src/
│   ├── backend/           # Servicios y configuración del backend
│   │   ├── config/        # Configuración de Supabase
│   │   └── services/      # Servicios (auth, email, etc.)
│   ├── frontend/          # Componentes y páginas del frontend
│   │   ├── components/    # Componentes reutilizables
│   │   ├── context/       # Contextos de React
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Páginas de la aplicación
│   │   └── lib/           # Utilidades del frontend
│   └── shared/            # Código compartido
│       ├── types/         # Tipos TypeScript
│       └── utils/         # Utilidades compartidas
├── public/                # Archivos estáticos
├── supabase/              # Funciones de Supabase
└── dist/                  # Build de producción (generado)
```

## 👥 Roles del Sistema

- **Cliente**: Puede crear órdenes, ver citas y gestionar su perfil
- **Agente**: Puede crear órdenes, validar órdenes y buscar clientes
- **Técnico**: Puede ver órdenes asignadas, documentar servicios y reportar impedimentos
- **Coordinador**: Puede asignar órdenes a técnicos y gestionar citas
- **Admin**: Puede gestionar usuarios, roles, auditoría y notificaciones

## 🔧 Configuración de Supabase

Este proyecto utiliza Supabase como backend. Asegúrate de tener:

1. Una cuenta en [Supabase](https://supabase.com/)
2. Un proyecto creado en Supabase
3. Las credenciales (URL y Anon Key) configuradas en `src/backend/config/supabaseClient.ts`

## 🐛 Solución de Problemas

### Error al instalar dependencias
```bash
# Limpia la caché de npm y reinstala
rm -rf node_modules package-lock.json
npm install
```

### Puerto 8080 ya está en uso
El proyecto está configurado para usar el puerto 8080. Si está ocupado, Vite buscará automáticamente otro puerto disponible.

### Problemas con Supabase
- Verifica que las credenciales en `supabaseClient.ts` sean correctas
- Asegúrate de que tu proyecto de Supabase esté activo
- Revisa la consola del navegador para errores específicos

## 📚 Documentación Adicional

- [Documentación de React](https://react.dev/)
- [Documentación de Vite](https://vitejs.dev/)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Tailwind CSS](https://tailwindcss.com/)

## 🤝 Contribuir

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y está bajo la propiedad de los desarrolladores.

## 👨‍💻 Autores

- Equipo de desarrollo del proyecto Field Service Sync

## 📞 Soporte

Si tienes problemas o preguntas, por favor abre un issue en el repositorio de GitHub.

---

**¡Gracias por usar Field Service Sync!** 🚀
