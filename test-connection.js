// Script de diagnóstico para verificar la conexión
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 DIAGNÓSTICO DE CONEXIÓN\n');

// 1. Verificar variables de entorno
console.log('1️⃣ Variables de entorno:');
console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Configurada' : '❌ NO configurada');
console.log('   SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ NO configurada');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurada' : '⚠️  Usando valor por defecto');
console.log('   ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'admin@guerroa.com');
console.log('   ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? '✅ Configurada' : '⚠️  Usando "admin123"');
console.log('');

// 2. Verificar conexión a Supabase
async function testSupabase() {
    try {
        console.log('2️⃣ Probando conexión a Supabase...');
        
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            console.log('   ❌ ERROR: Faltan credenciales de Supabase en .env');
            console.log('   📝 Configura SUPABASE_URL y SUPABASE_ANON_KEY en tu archivo .env');
            return;
        }

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        // Probar conexión con tabla admins
        console.log('   🔄 Verificando tabla "admins"...');
        const { data: admins, error: adminsError } = await supabase
            .from('admins')
            .select('id, username, email, role')
            .limit(5);

        if (adminsError) {
            console.log('   ❌ ERROR en tabla "admins":', adminsError.message);
            if (adminsError.code === 'PGRST116') {
                console.log('   📝 La tabla "admins" no existe. Créala usando SUPABASE_SETUP.md');
            }
        } else {
            console.log('   ✅ Tabla "admins" OK');
            console.log('   📊 Administradores encontrados:', admins.length);
            if (admins.length > 0) {
                admins.forEach(admin => {
                    console.log(`      - ${admin.username} (${admin.email}) - ${admin.role}`);
                });
            } else {
                console.log('   ⚠️  No hay administradores. El servidor creará uno al iniciar.');
            }
        }

        // Probar conexión con tabla contact_messages
        console.log('   🔄 Verificando tabla "contact_messages"...');
        const { data: messages, error: messagesError } = await supabase
            .from('contact_messages')
            .select('id')
            .limit(1);

        if (messagesError) {
            console.log('   ❌ ERROR en tabla "contact_messages":', messagesError.message);
            if (messagesError.code === 'PGRST116') {
                console.log('   📝 La tabla "contact_messages" no existe. Créala usando SUPABASE_SETUP.md');
            }
        } else {
            console.log('   ✅ Tabla "contact_messages" OK');
        }

        // Probar conexión con tabla activity_logs
        console.log('   🔄 Verificando tabla "activity_logs"...');
        const { data: logs, error: logsError } = await supabase
            .from('activity_logs')
            .select('id')
            .limit(1);

        if (logsError) {
            console.log('   ❌ ERROR en tabla "activity_logs":', logsError.message);
            if (logsError.code === 'PGRST116') {
                console.log('   📝 La tabla "activity_logs" no existe. Créala usando SUPABASE_SETUP.md');
            }
        } else {
            console.log('   ✅ Tabla "activity_logs" OK');
        }

        console.log('');
        console.log('3️⃣ Resumen:');
        console.log('   Si todas las tablas están OK, el sistema debería funcionar.');
        console.log('   Si faltan tablas, sigue las instrucciones en SUPABASE_SETUP.md');
        console.log('');

    } catch (error) {
        console.log('   ❌ ERROR CRÍTICO:', error.message);
        console.log('   📝 Verifica que las credenciales de Supabase sean correctas');
    }
}

testSupabase().then(() => {
    console.log('✅ Diagnóstico completado\n');
    process.exit(0);
}).catch(err => {
    console.error('❌ Error en diagnóstico:', err);
    process.exit(1);
});
