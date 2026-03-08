// Script para verificar admins existentes
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

async function checkAdmin() {
    try {
        console.log('🔍 VERIFICANDO ADMINISTRADORES EXISTENTES\n');

        // Usar la anon key primero
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        console.log('1️⃣ Intentando con anon key...');
        
        // Intentar obtener todos los admins
        const { data: admins, error: adminsError } = await supabase
            .from('admins')
            .select('*');

        if (adminsError) {
            console.log('❌ Error con anon key:', adminsError.message);
            console.log('   Esto es normal si RLS está habilitado');
        } else {
            console.log('✅ Admins encontrados con anon key:', admins.length);
            admins.forEach(admin => {
                console.log(`   - ${admin.username} (${admin.email}) - ${admin.role} - Activo: ${admin.is_active}`);
            });
        }

        console.log('\n2️⃣ Intentando login directo...');
        
        // Intentar hacer login con las credenciales
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@guerroa.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        console.log(`📧 Probando: ${adminEmail}`);
        console.log(`🔑 Contraseña: ${adminPassword}`);

        // Buscar por email O username
        const { data: users, error: searchError } = await supabase
            .from('admins')
            .select('*')
            .or(`username.eq.${adminEmail},email.eq.${adminEmail}`)
            .eq('is_active', true);

        if (searchError) {
            console.log('❌ Error al buscar usuario:', searchError.message);
            return;
        }

        if (!users || users.length === 0) {
            console.log('❌ No se encontró usuario con ese email/username');
            console.log('');
            console.log('🔧 SOLUCIONES:');
            console.log('1. Ve a tu panel de Supabase');
            console.log('2. Ve a Authentication > Users');
            console.log('3. O ejecuta en SQL Editor:');
            console.log('   SELECT * FROM admins;');
            console.log('4. Verifica si existe el usuario y sus credenciales');
            return;
        }

        const user = users[0];
        console.log('✅ Usuario encontrado:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Activo: ${user.is_active}`);

        // Verificar contraseña
        console.log('\n3️⃣ Verificando contraseña...');
        const isValidPassword = await bcrypt.compare(adminPassword, user.password_hash);
        
        if (isValidPassword) {
            console.log('✅ ¡Contraseña correcta!');
            console.log('');
            console.log('🎉 El admin está configurado correctamente.');
            console.log('   El problema puede estar en el código de autenticación.');
        } else {
            console.log('❌ Contraseña incorrecta');
            console.log('');
            console.log('🔧 Actualizando contraseña...');
            
            const newPasswordHash = await bcrypt.hash(adminPassword, 12);
            const { error: updateError } = await supabase
                .from('admins')
                .update({ 
                    password_hash: newPasswordHash,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (updateError) {
                console.log('❌ Error al actualizar:', updateError.message);
            } else {
                console.log('✅ Contraseña actualizada correctamente');
            }
        }

    } catch (error) {
        console.log('💥 Error crítico:', error.message);
    }
}

checkAdmin().then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
});