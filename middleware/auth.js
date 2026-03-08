const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// Asegúrate de que este archivo exista en tu carpeta database
const supabase = require('../database/supabaseClient'); 

const JWT_SECRET = process.env.JWT_SECRET || (() => {
    console.warn('⚠️  ADVERTENCIA: Usando JWT_SECRET por defecto. Configura JWT_SECRET en .env para producción');
    return 'guerroa-jwt-secret-2024-' + Math.random().toString(36);
})();

// 1. Verificar Token (Login)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'Token requerido',
            message: 'Inicia sesión para continuar'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                error: 'Sesión expirada',
                message: 'Vuelve a iniciar sesión'
            });
        }
        req.user = user;
        next();
    });
};

// 2. Generar Token
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// 3. Verificar Credenciales (Login contra Supabase)
const verifyCredentials = async (username, password) => {
    try {
        const { data: user, error } = await supabase
            .from('admins')
            .select('*')
            .or(`username.eq.${username},email.eq.${username}`)
            .eq('is_active', true)
            .single();

        if (error || !user) return null;

        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (isValid) {
            // Actualizar último login sin esperar
            supabase
                .from('admins')
                .update({ last_login: new Date() })
                .eq('id', user.id)
                .then(); // Fire and forget
            return user;
        }
        return null;
    } catch (error) {
        console.error("Error auth:", error);
        return null;
    }
};

// 4. NUEVO: Verificar Rol (Esto es lo que te faltaba)
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        
        // Si allowedRoles es un string, lo convertimos a array
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (roles.includes(req.user.role)) {
            next();
        } else {
            res.status(403).json({ 
                error: 'Acceso denegado', 
                message: 'No tienes permisos suficientes para esta acción' 
            });
        }
    };
};

// 5. Log de Actividad (Middleware)
const logActivity = (action, details = null) => {
    return async (req, res, next) => {
        // Guardamos la función original de send
        const originalSend = res.send;
        
        // Interceptamos la respuesta
        res.send = function(data) {
            // Solo logueamos si la respuesta fue exitosa (200-299)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Intentamos guardar en Supabase en segundo plano
                try {
                    const logData = {
                        admin_id: req.user ? req.user.id : null,
                        action: action,
                        details: details || 'Actividad registrada',
                        ip_address: req.ip || '0.0.0.0',
                        user_agent: req.get('User-Agent') || 'Unknown'
                    };

                    supabase.from('activity_logs').insert([logData]).then(({ error }) => {
                        if (error) console.error("Error silencioso en log:", error.message);
                    });
                } catch (e) {
                    console.error("Error al intentar loguear:", e);
                }
            }
            // Ejecutamos la respuesta original
            originalSend.call(this, data);
        };
        next();
    };
};

// EXPORTAR TODO (Asegúrate de que requireRole esté aquí)
module.exports = { 
    authenticateToken, 
    generateToken, 
    verifyCredentials, 
    logActivity,
    requireRole 
};