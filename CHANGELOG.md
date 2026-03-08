# Historial de Cambios - Guerroa C.A.

## [2026-02-04] - Optimización Móvil y Carrusel

### ✨ Nuevas Funcionalidades
- **Carrusel de Galería**: Implementado carrusel moderno con navegación por flechas
  - Auto-play en desktop (desactivado en móviles)
  - Navegación con teclado (flechas izquierda/derecha)
  - Gestos táctiles optimizados para móviles
  - Indicadores interactivos
  - Captions con información de proyectos

### 🚀 Optimizaciones de Rendimiento
- **Móviles**:
  - Lazy loading de imágenes (solo primera imagen carga inmediato)
  - Animación de fondo desactivada en móviles
  - Altura de carrusel reducida (280px vs 500px)
  - Swipe optimizado con detección de velocidad
  - Eventos táctiles con `passive: true`
  
- **General**:
  - Preconnect a CDNs para carga más rápida
  - `will-change` en elementos animados
  - Prevención de transiciones múltiples
  - Image rendering optimizado

### 🎨 Mejoras de UI/UX
- Botones de navegación más pequeños en móviles
- Indicadores de carrusel responsivos
- Mejor contraste en captions
- Área de toque optimizada para móviles
- Sin highlight azul en toques táctiles

### 🐛 Correcciones
- Imágenes del carrusel ahora usan `object-fit: contain` (sin distorsión)
- Fondo negro en slides para mejor visualización
- Problema de login resuelto (contraseña actualizada en BD)
- Archivos innecesarios eliminados

### 📁 Archivos Modificados
- `public/index.html` - Estructura del carrusel
- `public/styles.CSS` - Estilos del carrusel y optimizaciones móviles
- `public/script.js` - Lógica del carrusel optimizada
- `routes/auth.js` - Logs mejorados para debugging
- `server.js` - Configuración de helmet actualizada

### 📝 Archivos Eliminados
- `public/admin-debug.js`
- `public/login-debug.html`
- `ESTADO_ACTUAL.md`
- `styles.CSS` (duplicado en raíz)
- `script.js` (duplicado en raíz)

### 🔧 Archivos de Utilidad Creados
- `test-login.js` - Script para verificar login
- `check-all-admins.js` - Script para ver usuarios admin
- `RESPALDO_MANUAL.bat` - Script para respaldos manuales

---

## [Anterior] - Configuración Inicial

### ✨ Funcionalidades Base
- Panel de administración con dashboard
- Sistema de autenticación con JWT
- Gestión de mensajes de contacto
- Gestión de galería (subir/eliminar imágenes)
- Gestión de servicios
- Integración con Supabase
- Página principal con formulario de contacto

### 🔐 Seguridad
- Autenticación con bcrypt
- Tokens JWT
- Rate limiting
- Helmet para headers de seguridad
- Validación de formularios

---

## Notas de Desarrollo

### Credenciales Admin
- Email: admin@guerroa.com
- Password: admin123
- ⚠️ Cambiar después del primer login

### Base de Datos
- Supabase como base de datos principal
- Tablas: admins, contact_messages, services, gallery_images, activity_logs

### Servidor
- Puerto: 3000
- Comando: `node server.js` o `npm start`
- Nodemon para desarrollo automático
