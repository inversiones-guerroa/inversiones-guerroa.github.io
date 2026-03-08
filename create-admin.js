// Script para crear admin manualmente
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        console.log('🔧 CREANDO ADMINISTRADOR MANUALMENTE\n');

        // Verificar variables de entorno
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            console.log('❌ ERROR: Faltan credenciales de Supabase en .env');
            process.exit(1);
        }

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@guerroa.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        console.log(`📧 Email del admin: ${adminEmail}`);
        console.log(`🔑 Contraseña: ${adminPassword}`);
        console.log('');

        // 1. Verificar si ya existe
        console.log('🔍 Verificando si el admin ya existe...');
        const { data: existingAdmin, error: searchError } = await supabase
            .from('admins')
            .select('*')
            .eq('email', adminEmail)
            .single();

        if (existingAdmin) {
            console.log('⚠️  El admin ya existe:');
            console.log(`   ID: ${existingAdmin.id}`);
            console.log(`   Username: ${existingAdmin.username}`);
            console.log(`   Email: ${existingAdmin.email}`);
            console.log(`   Role: ${existingAdmin.role}`);
            console.log(`   Activo: ${existingAdmin.is_active}`);
            console.log('');
            
            // Verificar contraseña
            const isValidPassword = await bcrypt.compare(adminPassword, existingAdmin.password_hash);
            if (isValidPassword) {
                console.log('✅ La contraseña coincide. El admin está configurado correctamente.');
            } else {
                console.log('❌ La contraseña NO coincide. Actualizando...');
                
                const newPasswordHash = await bcrypt.hash(adminPassword, 12);
                const { error: updateError } = await supabase
                    .from('admins')
                    .update({ 
                        password_hash: newPasswordHash,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingAdmin.id);

                if (updateError) {
                    console.log('❌ Error al actualizar contraseña:', updateError.message);
                } else {
                    console.log('✅ Contraseña actualizada correctamente.');
                }
            }
            return;
        }

        // 2. Crear nuevo admin
        console.log('📝 Creando nuevo administrador...');
        
        const passwordHash = await bcrypt.hash(adminPassword, 12);
        
        const { data: newAdmin, error: insertError } = await supabase
            .from('admins')
            .insert([{
                username: 'admin',
                email: adminEmail,
                password_hash: passwordHash,
                full_name: 'Administrador Principal',
                role: 'super_admin',
                is_active: true
            }])
            .select()
            .single();

        if (insertError) {
            console.log('❌ Error al crear admin:', insertError.message);
            console.log('📋 Detalles del error:', insertError);
            process.exit(1);
        }

        console.log('✅ ¡Administrador creado exitosamente!');
        console.log(`   ID: ${newAdmin.id}`);
        console.log(`   Username: ${newAdmin.username}`);
        console.log(`   Email: ${newAdmin.email}`);
        console.log(`   Role: ${newAdmin.role}`);
        console.log('');
        console.log('🎉 Ahora puedes hacer login con:');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Contraseña: ${adminPassword}`);

    } catch (error) {
        console.log('💥 Error crítico:', error.message);
        console.log('📋 Stack trace:', error.stack);
        process.exit(1);
    }
}

createAdmin().then(() => {
    console.log('\n✅ Proceso completado');
    process.exit(0);
});