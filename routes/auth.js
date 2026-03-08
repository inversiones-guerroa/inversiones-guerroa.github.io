const express = require('express');
const { body, validationResult } = require('express-validator');
const { generateToken, verifyCredentials } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const { getDatabase } = require('../database/init');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Obtener instancia de Supabase
const supabase = getDatabase();
const JWT_SECRET = process.env.JWT_SECRET || (() => {
    console.warn('⚠️  ADVERTENCIA: Usando JWT_SECRET por defecto');
    return 'guerroa-jwt-secret-2024-' + Math.random().toString(36);
})();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        console.log('🔐 Intento de login recibido');
        console.log('   Username/Email:', req.body.username);
        
        const { username, password } = req.body;

        if (!username || !password) {
            console.log('❌ Datos incompletos');
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'Usuario y contraseña son requeridos'
            });
        }

        // Buscar usuario en Supabase (puede ser username o email)
        console.log('🔍 Buscando usuario en Supabase...');
        const { data: users, error: searchError } = await supabase
            .from('admins')
            .select('*')
            .or(`username.eq.${username},email.eq.${username}`)
            .eq('is_active', true)
            .limit(1);

        if (searchError) {
            console.error('❌ Error al buscar usuario:', searchError);
            return next(createError(500, 'Error al verificar credenciales'));
        }

        if (!users || users.length === 0) {
            console.log('❌ Usuario no encontrado');
            return res.status(401).json({
                error: 'Credenciales inválidas',
                message: 'Usuario o contraseña incorrectos'
            });
        }

        const user = users[0];
        console.log('✅ Usuario encontrado:', user.email);

        // Verificar contraseña
        console.log('🔑 Verificando contraseña...');
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            console.log('❌ Contraseña incorrecta');
            return res.status(401).json({
                error: 'Credenciales inválidas',
                message: 'Usuario o contraseña incorrectos'
            });
        }
        
        console.log('✅ Contraseña correcta');

        // Generar token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                email: user.email,
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Actualizar último login
        await supabase
            .from('admins')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);

        // Log de actividad
        try {
            await supabase.from('activity_logs').insert([{
                admin_id: user.id,
                action: 'login',
                details: `Login exitoso desde ${req.ip}`,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.get('User-Agent') || 'Unknown'
            }]);
        } catch (logError) {
            console.error('Error al registrar actividad:', logError);
            // No fallar el login si el log falla
        }

        res.json({
            success: true,
            token: token,
            data: {
                token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        next(createError(500, 'Error en el login'));
    }
});

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                
                // Log de actividad
                await supabase.from('activity_logs').insert([{
                    admin_id: decoded.id,
                    action: 'logout',
                    details: `Logout desde ${req.ip}`,
                    ip_address: req.ip || req.connection.remoteAddress,
                    user_agent: req.get('User-Agent') || 'Unknown'
                }]);
            } catch (err) {
                // Token inválido, pero igual permitimos el logout
                console.log('Token inválido en logout, pero permitiendo continuar');
            }
        }

        res.json({
            success: true,
            message: 'Sesión cerrada correctamente'
        });

    } catch (error) {
        console.error('Error en logout:', error);
        next(createError(500, 'Error al cerrar sesión'));
    }
});

// GET /api/auth/me - Obtener información del usuario actual
router.get('/me', async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: 'Token requerido',
                message: 'Debes iniciar sesión para acceder a esta información'
            });
        }

        jwt.verify(token, JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({
                    error: 'Token inválido',
                    message: 'Tu sesión ha expirado o es inválida'
                });
            }

            // Buscar usuario en Supabase
            const { data: user, error: userError } = await supabase
                .from('admins')
                .select('id, username, email, full_name, role, last_login')
                .eq('id', decoded.id)
                .eq('is_active', true)
                .single();

            if (userError || !user) {
                return res.status(404).json({
                    error: 'Usuario no encontrado',
                    message: 'El usuario no existe o ha sido desactivado'
                });
            }

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        full_name: user.full_name,
                        role: user.role,
                        last_login: user.last_login
                    }
                }
            });
        });

    } catch (error) {
        console.error('Error en /me:', error);
        next(createError(500, 'Error interno del servidor'));
    }
});

// POST /api/auth/change-password - Cambiar contraseña
router.post('/change-password', [
    body('currentPassword')
        .notEmpty()
        .withMessage('La contraseña actual es requerida'),
    
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('La nueva contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                message: 'Por favor, corrige los errores en el formulario',
                details: errors.array()
            });
        }

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: 'Token requerido',
                message: 'Debes iniciar sesión para cambiar la contraseña'
            });
        }

        jwt.verify(token, JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({
                    error: 'Token inválido',
                    message: 'Tu sesión ha expirado o es inválida'
                });
            }

            const { currentPassword, newPassword } = req.body;

            // Obtener usuario actual de Supabase
            const { data: user, error: userError } = await supabase
                .from('admins')
                .select('password_hash')
                .eq('id', decoded.id)
                .eq('is_active', true)
                .single();

            if (userError || !user) {
                return res.status(404).json({
                    error: 'Usuario no encontrado',
                    message: 'El usuario no existe o ha sido desactivado'
                });
            }

            // Verificar contraseña actual
            const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password_hash);
            
            if (!isValidCurrentPassword) {
                return res.status(400).json({
                    error: 'Contraseña actual incorrecta',
                    message: 'La contraseña actual no es correcta'
                });
            }

            // Hash de la nueva contraseña
            const hashedNewPassword = await bcrypt.hash(newPassword, 12);

            // Actualizar contraseña en Supabase
            const { error: updateError } = await supabase
                .from('admins')
                .update({ 
                    password_hash: hashedNewPassword,
                    updated_at: new Date().toISOString()
                })
                .eq('id', decoded.id);

            if (updateError) {
                return next(createError(500, 'Error al actualizar la contraseña'));
            }

            // Log de actividad
            try {
                await supabase.from('activity_logs').insert([{
                    admin_id: decoded.id,
                    action: 'change_password',
                    details: 'Contraseña cambiada exitosamente',
                    ip_address: req.ip || req.connection.remoteAddress,
                    user_agent: req.get('User-Agent') || 'Unknown'
                }]);
            } catch (logError) {
                console.error('Error al registrar actividad:', logError);
            }

            res.json({
                success: true,
                message: 'Contraseña actualizada correctamente'
            });
        });

    } catch (error) {
        console.error('Error en change-password:', error);
        next(createError(500, 'Error interno del servidor'));
    }
});

module.exports = router;
