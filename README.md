# 🏗️ Sitio Web Profesional - Inversiones Guerroa C.A.

Un sitio web moderno y profesional con panel de administración completo para Inversiones Guerroa C.A., empresa especializada en mantenimiento y servicios generales en Venezuela.

## ✨ Características

### 🎨 Frontend Moderno
- **Diseño glassmorphism** con efectos de cristal y transparencias
- **Animaciones suaves** y efectos de hover avanzados
- **Gradientes modernos** y colores vibrantes
- **Tipografías mejoradas** (Inter y Poppins)
- **Efectos de partículas** flotantes en el hero
- **Animaciones de scroll** con Intersection Observer
- **Formulario mejorado** con validación en tiempo real
- **Responsive design** optimizado para móviles

### 🔧 Backend Robusto
- **API REST** completa con Node.js y Express
- **Base de datos SQLite** para almacenamiento local
- **Autenticación JWT** con sesiones seguras
- **Rate limiting** para prevenir spam
- **Validación de datos** con express-validator
- **Logging de actividad** completo
- **Middleware de seguridad** con Helmet

### 📊 Panel de Administración
- **Dashboard interactivo** con estadísticas en tiempo real
- **Gestión de mensajes** de contacto
- **Sistema de roles** (admin, super_admin)
- **Exportación de datos** en CSV/JSON
- **Logs de actividad** detallados
- **Configuración del sistema**

## 🚀 Instalación

### Prerrequisitos
- Node.js 16.0.0 o superior
- npm o yarn

### Pasos de Instalación

1. **Clonar o descargar el proyecto**
   ```bash
   cd Guerroa_diseño
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env
   ```
   
   Edita el archivo `.env` con tus configuraciones:
   ```env
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=tu-jwt-secret-super-seguro-aqui
   SESSION_SECRET=tu-session-secret-super-seguro-aqui
   ADMIN_PASSWORD=admin123
   ```

4. **Iniciar el servidor**
   ```bash
   # Modo desarrollo (con auto-reload)
   npm run dev
   
   # Modo producción
   npm start
   ```

5. **Acceder al sitio**
   - **Sitio web**: http://localhost:3000
   - **Panel de administración**: http://localhost:3000/admin
   - **Login**: http://localhost:3000/login

## 🔐 Credenciales por Defecto

**Administrador Principal:**
- Usuario: `admin`
- Email: `admin@guerroa.com`
- Contraseña: `admin123`

⚠️ **IMPORTANTE**: Cambia la contraseña después del primer login por seguridad.

## 📱 Uso del Panel de Administración

### Dashboard
- Vista general de estadísticas
- Mensajes recientes
- Métricas de rendimiento

### Gestión de Mensajes
- Ver todos los mensajes de contacto
- Marcar como leído/no leído
- Filtrar por estado o servicio
- Exportar datos

### Estadísticas
- Tendencias de mensajes
- Actividad de administradores
- Métricas de rendimiento

### Configuración
- Cambiar contraseña
- Exportar datos del sistema
- Información del sistema

## 🛠️ Estructura del Proyecto

```
Guerroa_diseño/
├── public/                 # Archivos estáticos del frontend
│   ├── index.html         # Página principal
│   ├── login.html         # Página de login
│   ├── admin.html         # Panel de administración
│   ├── styles.CSS         # Estilos CSS
│   ├── script.js          # JavaScript del frontend
│   ├── IMG/               # Imágenes
│   └── galeria/           # Galería de imágenes
├── routes/                # Rutas de la API
│   ├── contact.js         # Manejo de formularios de contacto
│   ├── admin.js           # Panel de administración
│   ├── auth.js            # Autenticación
│   └── stats.js           # Estadísticas
├── middleware/            # Middleware personalizado
│   ├── auth.js            # Autenticación y autorización
│   └── errorHandler.js    # Manejo de errores
├── database/              # Base de datos
│   └── init.js            # Inicialización de la base de datos
├── server.js              # Servidor principal
├── package.json           # Dependencias del proyecto
└── README.md              # Este archivo
```

## 🔧 API Endpoints

### Públicos
- `POST /api/contact` - Enviar mensaje de contacto
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión

### Protegidos (requieren autenticación)
- `GET /api/admin/messages` - Obtener mensajes
- `PUT /api/admin/messages/:id` - Actualizar mensaje
- `DELETE /api/admin/messages/:id` - Eliminar mensaje
- `GET /api/admin/dashboard` - Datos del dashboard
- `GET /api/stats/*` - Estadísticas del sistema

## 🎨 Personalización

### Colores y Tema
Los colores principales se pueden modificar en `public/styles.CSS`:
- **Primario**: `#667eea` (azul)
- **Secundario**: `#764ba2` (púrpura)
- **Acento**: `#f7c027` (amarillo)

### Contenido
- Edita `public/index.html` para modificar el contenido
- Actualiza las imágenes en `public/IMG/` y `public/galeria/`
- Modifica los servicios en la sección correspondiente

### Configuración del Sistema
- Variables de entorno en `.env`
- Configuración de base de datos en `database/init.js`
- Rutas de la API en la carpeta `routes/`

## 🔒 Seguridad

- **Rate limiting** para prevenir ataques de fuerza bruta
- **Validación de entrada** en todos los formularios
- **Autenticación JWT** con tokens seguros
- **Headers de seguridad** con Helmet
- **Sanitización de datos** de entrada
- **Logs de actividad** para auditoría

## 📈 Rendimiento

- **Compresión gzip** para archivos estáticos
- **Optimización de imágenes** (WebP)
- **Lazy loading** para contenido pesado
- **Caché de base de datos** SQLite
- **Minificación** de recursos

## 🚀 Despliegue en Producción

### Variables de Entorno para Producción
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=tu-jwt-secret-super-seguro-y-largo
SESSION_SECRET=tu-session-secret-super-seguro-y-largo
FRONTEND_URL=https://tu-dominio.com
```

### Recomendaciones
1. Usar un proxy reverso (Nginx)
2. Configurar SSL/HTTPS
3. Implementar backup automático de la base de datos
4. Configurar monitoreo y logs
5. Usar PM2 para gestión de procesos

## 🤝 Soporte

Para soporte técnico o consultas sobre el proyecto:
- **Email**: admin@guerroa.com
- **Teléfono**: 0414-5810200

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**Desarrollado con ❤️ para Inversiones Guerroa C.A.**
*"La Mejor Solución con Talento Propio"*
