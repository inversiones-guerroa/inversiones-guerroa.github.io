-- Ejecuta estos comandos en el SQL Editor de Supabase

-- 1. Tabla de servicios
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(100) DEFAULT 'fas fa-cog',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insertar servicios iniciales
INSERT INTO services (title, description, icon, display_order) VALUES 
('Mantenimiento Industrial', 'Servicios especializados de mantenimiento para equipos industriales', 'fas fa-tools', 1),
('Construcción', 'Proyectos de construcción y remodelación', 'fas fa-building', 2),
('Suministros', 'Suministro de materiales y equipos especializados', 'fas fa-truck', 3),
('Consultoría', 'Asesoría técnica especializada', 'fas fa-clipboard-check', 4)
ON CONFLICT DO NOTHING;

-- 3. Tabla de galería
CREATE TABLE IF NOT EXISTS gallery_images (
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

-- 4. Políticas RLS (permitir todo por ahora)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_policy" ON services FOR ALL USING (true);

ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;  
CREATE POLICY "gallery_images_policy" ON gallery_images FOR ALL USING (true);

-- 5. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);
CREATE INDEX IF NOT EXISTS idx_gallery_images_is_active ON gallery_images(is_active);
CREATE INDEX IF NOT EXISTS idx_gallery_images_display_order ON gallery_images(display_order);