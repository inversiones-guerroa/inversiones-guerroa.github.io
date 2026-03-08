// Script para ver todos los admins en la base de datos
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function checkAllAdmins() {
    console.log('🔍 Verificando todos los usuarios admin...\n');
    
    try {
        const { data: admins, error } = await supabase
            .from('admins')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) {
            console.error('❌ Error:', error);
            return;
        }
        
        if (!admins || admins.length === 0) {
            console.log('❌ No hay usuarios admin en la base de datos');
            return;
        }
        
        console.log(`✅ Se encontraron ${admins.length} usuario(s) admin:\n`);
        
        admins.forEach((admin, index) => {
            console.log(`--- Admin #${index + 1} ---`);
            console.log(`ID: ${admin.id}`);
            console.log(`Username: ${admin.username}`);
            console.log(`Email: ${admin.email}`);
            console.log(`Full Name: ${admin.full_name}`);
            console.log(`Role: ${admin.role}`);
            console.log(`Active: ${admin.is_active ? '✅ Sí' : '❌ No'}`);
            console.log(`Created: ${admin.created_at}`);
            console.log(`Last Login: ${admin.last_login || 'Nunca'}`);
            console.log('');
        });
        
        if (admins.length > 1) {
            console.log('⚠️  ADVERTENCIA: Hay múltiples usuarios admin');
            console.log('   Esto puede causar confusión al hacer login\n');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkAllAdmins();
