# Configuración de Supabase para Inversiones Guerroa C.A.

## 📋 Tablas Requeridas

Ejecuta estos comandos SQL en el editor SQL de Supabase para crear las tablas necesarias:

### 1. Tabla de Mensajes de Contacto
```sql
CREATE TABLE contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(100),
    service_type VARCHAR(100),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'unread',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX idx_contact_messages_status ON contact_messages(status);
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at);
CREATE INDEX idx_contact_messages_service_type ON contact_messages(service_type);
CREATE INDEX idx_contact_messages_email ON contact_messages(email);
```

### 2. Tabla de Administradores
```sql
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_is_active ON admins(is_active);
```

### 3. Tabla de Logs de Actividad
```sql
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_activity_logs_admin_id ON activity_logs(admin_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
```

### 4. Tabla de Estadísticas del Sitio
```sql
CREATE TABLE site_stats (
    id SERIAL PRIMARY KEY,
    stat_name VARCHAR(100) UNIQUE NOT NULL,
    stat_value INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar estadísticas iniciales
INSERT INTO site_stats (stat_name, stat_value) VALUES 
('total_visits', 0),
('total_messages', 0),
('total_services', 0);

-- Índice
CREATE INDEX idx_site_stats_stat_name ON site_stats(stat_name);
```

### 5. Función para actualizar updated_at automáticamente
```sql
-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_contact_messages_updated_at 
    BEFORE UPDATE ON contact_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON admins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_stats_updated_at 
    BEFORE UPDATE ON site_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 🔐 Configuración de Seguridad (RLS)

### Habilitar Row Level Security
```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;
```

### Políticas de Seguridad
```sql
-- Política para contact_messages: Solo lectura/escritura para usuarios autenticados
CREATE POLICY "contact_messages_policy" ON contact_messages
    FOR ALL USING (true);

-- Política para admins: Solo acceso para usuarios autenticados
CREATE POLICY "admins_policy" ON admins
    FOR ALL USING (auth.role() = 'authenticated');

-- Política para activity_logs: Solo acceso para usuarios autenticados
CREATE POLICY "activity_logs_policy" ON activity_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- Política para site_stats: Solo acceso para usuarios autenticados
CREATE POLICY "site_stats_policy" ON site_stats
    FOR ALL USING (auth.role() = 'authenticated');
```

## 🚀 Configuración del Proyecto

### 1. Obtener Credenciales de Supabase
1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Ve a Settings > API
3. Copia la URL del proyecto y la clave anónima (anon key)

### 2. Configurar Variables de Entorno
Actualiza tu archivo `.env` con las credenciales reales:

```env
# Configuración de Supabase
SUPABASE_URL=https://tu-proyecto-id.supabase.co
SUPABASE_ANON_KEY=tu-clave-anonima-aqui

# Otros valores importantes
JWT_SECRET=tu-jwt-secret-super-seguro-cambiar-esto
SESSION_SECRET=tu-session-secret-super-seguro-cambiar-esto
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion
```

### 3. Crear Administrador Inicial
El sistema creará automáticamente un administrador inicial con:
- Email: El valor de `ADMIN_EMAIL` en tu `.env`
- Contraseña: El valor de `ADMIN_PASSWORD` en tu `.env`

## ✅ Verificación

Después de configurar todo, el sistema debería:
1. ✅ Conectarse a Supabase exitosamente
2. ✅ Verificar que las tablas existen
3. ✅ Crear el administrador inicial si no existe
4. ✅ Permitir envío de mensajes de contacto
5. ✅ Mostrar estadísticas en el panel de admin

## 🔧 Solución de Problemas

### Error: "relation does not exist"
- Verifica que hayas ejecutado todos los comandos SQL en Supabase
- Asegúrate de estar en el esquema correcto (public)

### Error: "Invalid API key"
- Verifica que `SUPABASE_URL` y `SUPABASE_ANON_KEY` sean correctos
- Asegúrate de usar la clave anónima, no la clave de servicio

### Error: "Row Level Security"
- Verifica que las políticas RLS estén configuradas correctamente
- Temporalmente puedes deshabilitar RLS para pruebas: `ALTER TABLE tabla_name DISABLE ROW LEVEL SECURITY;`