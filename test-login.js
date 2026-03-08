// Script de prueba para verificar el login
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function testLogin() {
    console.log('🧪 Probando conexión y login...\n');
    
    try {
        // 1. Verificar conexión a Supabase
        console.log('1. Verificando conexión a Supabase...');
        console.log('   URL:', process.env.SUPABASE_URL);
        console.log('   Key:', process.env.SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No configurada');
        
        // 2. Buscar admin
        console.log('\n2. Buscando usuario admin...');
        const { data: users, error: searchError } = await supabase
            .from('admins')
            .select('*')
            .or(`username.eq.admin,email.eq.admin@guerroa.com`)
            .eq('is_active', true);
        
        if (searchError) {
            console.error('❌ Error al buscar:', searchError);
            return;
        }
        
        if (!users || users.length === 0) {
            console.log('❌ No se encontró el usuario admin');
            console.log('\n3. Intentando crear usuario admin...');
            
            const passwordHash = await bcrypt.hash('admin123', 10);
            
            const { data: newAdmin, error: insertError } = await supabase
                .from('admins')
                .insert([{
                    username: 'admin',
                    email: 'admin@guerroa.com',
                    password_hash: passwordHash,
                    full_name: 'Administrador',
                    role: 'super_admin',
                    is_active: true
                }])
                .select()
                .single();
            
            if (insertError) {
                console.error('❌ Error al crear admin:', insertError);
                return;
            }
            
            console.log('✅ Admin creado exitosamente');
            console.log('   ID:', newAdmin.id);
            console.log('   Email:', newAdmin.email);
            return;
        }
        
        const user = users[0];
        console.log('✅ Usuario encontrado:');
        console.log('   ID:', user.id);
        console.log('   Username:', user.username);
        console.log('   Email:', user.email);
        console.log('   Role:', user.role);
        console.log('   Active:', user.is_active);
        
        // 3. Verificar contraseña
        console.log('\n3. Verificando contraseña...');
        const isValid = await bcrypt.compare('admin123', user.password_hash);
        
        if (isValid) {
            console.log('✅ Contraseña correcta');
        } else {
            console.log('❌ Contraseña incorrecta');
            console.log('\n4. Actualizando contraseña...');
            
            const newHash = await bcrypt.hash('admin123', 10);
            const { error: updateError } = await supabase
                .from('admins')
                .update({ password_hash: newHash })
                .eq('id', user.id);
            
            if (updateError) {
                console.error('❌ Error al actualizar:', updateError);
            } else {
                console.log('✅ Contraseña actualizada');
            }
        }
        
        console.log('\n✅ Prueba completada');
        console.log('\nCredenciales para login:');
        console.log('  Email: admin@guerroa.com');
        console.log('  Password: admin123');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testLogin();
