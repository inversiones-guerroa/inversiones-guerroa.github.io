// Middleware para manejo centralizado de errores
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err);

    // Error de validación
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Error de validación',
            message: err.message,
            details: err.errors
        });
    }

    // Error de JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Token inválido',
            message: 'El token de autenticación no es válido'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expirado',
            message: 'Tu sesión ha expirado, inicia sesión nuevamente'
        });
    }

    // Error de base de datos
    if (err.code && err.code.startsWith('SQLITE_')) {
        return res.status(500).json({
            error: 'Error de base de datos',
            message: 'Ha ocurrido un error interno. Intenta de nuevo más tarde.'
        });
    }

    // Error de rate limiting
    if (err.status === 429) {
        return res.status(429).json({
            error: 'Demasiadas solicitudes',
            message: 'Has realizado demasiadas solicitudes. Espera un momento antes de intentar de nuevo.'
        });
    }

    // Error de archivo no encontrado
    if (err.code === 'ENOENT') {
        return res.status(404).json({
            error: 'Archivo no encontrado',
            message: 'El recurso solicitado no existe'
        });
    }

    // Error de permisos de archivo
    if (err.code === 'EACCES') {
        return res.status(403).json({
            error: 'Sin permisos',
            message: 'No tienes permisos para acceder a este recurso'
        });
    }

    // Error por defecto
    const statusCode = err.statusCode || err.status || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Ha ocurrido un error interno del servidor'
        : err.message;

    res.status(statusCode).json({
        error: 'Error interno del servidor',
        message: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

// Middleware para manejar rutas no encontradas
const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        message: `La ruta ${req.method} ${req.originalUrl} no existe`,
        availableRoutes: {
            public: [
                'GET /',
                'POST /api/contact',
                'POST /api/auth/login'
            ],
            protected: [
                'GET /admin',
                'GET /api/admin/messages',
                'GET /api/admin/stats',
                'PUT /api/admin/messages/:id',
                'DELETE /api/admin/messages/:id'
            ]
        }
    });
};

// Función para crear errores personalizados
const createError = (statusCode, message, details = null) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.details = details;
    return error;
};

// Función para validar entrada
const validateInput = (schema) => {
    return (req, res, next) => {
        try {
            const { error, value } = schema.validate(req.body);
            
            if (error) {
                return res.status(400).json({
                    error: 'Datos de entrada inválidos',
                    message: error.details[0].message,
                    field: error.details[0].path[0]
                });
            }
            
            req.body = value;
            next();
        } catch (err) {
            next(createError(500, 'Error de validación', err.message));
        }
    };
};

module.exports = {
    errorHandler,
    notFoundHandler,
    createError,
    validateInput
};
