const supabase = require('./supabaseClient');

// Función para obtener la instancia de Supabase (reemplaza getDatabase para SQLite)
function getDatabase() {
    return supabase;
}

async function initDatabase() {
    try {
        console.log('🔄 Verificando conexión con Supabase...');
        
        // Verificar conexión con tabla admins
        const { data, error } = await supabase
            .from('admins')
            .select('count', { count: 'exact', head: true });

        if (error) {
            throw error;
        }

        // Verificar que existan las tablas necesarias
        await checkAndCreateTables();

        console.log('✅ Conexión a Supabase exitosa.');
        console.log('✅ Todas las tablas verificadas.');

    } catch (error) {
        console.error('❌ Error crítico al conectar con Supabase:', error.message);
        console.log('   Asegúrate de configurar SUPABASE_URL y SUPABASE_ANON_KEY en .env');
        // No matamos el proceso, pero avisamos que hay error
    }
}

// Función para verificar y crear tablas si no existen
async function checkAndCreateTables() {
    try {
        // Verificar tabla contact_messages
        const { error: contactError } = await supabase
            .from('contact_messages')
            .select('id')
            .limit(1);

        if (contactError && contactError.code === 'PGRST116') {
            console.log('⚠️  Tabla contact_messages no existe. Créala en Supabase con esta estructura:');
            console.log(`
CREATE TABLE contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    service_type VARCHAR(100),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX idx_contact_messages_status ON contact_messages(status);
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at);
CREATE INDEX idx_contact_messages_service_type ON contact_messages(service_type);
            `);
        }

        // Verificar tabla site_stats
        const { error: statsError } = await supabase
            .from('site_stats')
            .select('id')
            .limit(1);

        if (statsError && statsError.code === 'PGRST116') {
            console.log('⚠️  Tabla site_stats no existe. Créala en Supabase con esta estructura:');
            console.log(`
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
            `);
        }

    } catch (error) {
        console.log('⚠️  Error verificando tablas:', error.message);
        console.log('   Asegúrate de crear las tablas manualmente en Supabase.');
    }
}

module.exports = { initDatabase, getDatabase };
