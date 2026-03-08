# Tablas Adicionales para el Panel de Admin

Ejecuta estos comandos SQL en el editor SQL de Supabase:

## 1. Tabla de Servicios Dinámicos
```sql
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar servicios iniciales
INSERT INTO services (title, description, icon, display_order) VALUES 
('Mantenimiento Industrial', 'Servicios especializados de mantenimiento para equipos industriales', 'fas fa-tools', 1),
('Construcción', 'Proyectos de construcción y remodelación', 'fas fa-building', 2),
('Suministros', 'Suministro de materiales y equipos especializados', 'fas fa-truck', 3),
('Consultoría', 'Asesoría técnica especializada', 'fas fa-clipboard-check', 4);

-- Índices
CREATE INDEX idx_services_is_active ON services(is_active);
CREATE INDEX idx_services_display_order ON services(display_order);
```

## 2. Tabla de Galería (mejorada)
```sql
CREATE TABLE gallery_images (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    title VARCHAR(200),
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_gallery_images_is_active ON gallery_images(is_active);
CREATE INDEX idx_gallery_images_display_order ON gallery_images(display_order);
```

## 3. Actualizar tabla contact_messages (agregar campos si no existen)
```sql
-- Verificar si ya tiene estos campos, si no, agregarlos
ALTER TABLE contact_messages 
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Crear índice para búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
```

## 4. Función para actualizar updated_at automáticamente
```sql
-- Función para servicios
CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para galería
CREATE TRIGGER update_gallery_images_updated_at 
    BEFORE UPDATE ON gallery_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 5. Políticas RLS (Row Level Security)
```sql
-- Políticas para services
CREATE POLICY "services_policy" ON services FOR ALL USING (true);

-- Políticas para gallery_images  
CREATE POLICY "gallery_images_policy" ON gallery_images FOR ALL USING (true);
```