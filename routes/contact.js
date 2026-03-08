const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');
const { createError } = require('../middleware/errorHandler');
const { createTransport } = require('nodemailer');

const router = express.Router();

// Obtener instancia de Supabase
const supabase = getDatabase();

// Validaciones para el formulario de contacto
const contactValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Debe ser un email válido'),
    
    body('message')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('El mensaje debe tener entre 10 y 2000 caracteres'),
    
    body('phone')
        .optional()
        .trim()
        .matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/)
        .withMessage('Formato de teléfono inválido'),
    
    body('company')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('El nombre de la empresa no puede exceder 100 caracteres'),
    
    body('service_type')
        .optional()
        .trim()
        .isIn(['mantenimiento', 'construccion', 'suministros', 'otros'])
        .withMessage('Tipo de servicio inválido')
];

// POST /api/contact - Enviar mensaje de contacto
router.post('/', contactValidation, async (req, res, next) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                message: 'Por favor, corrige los errores en el formulario',
                details: errors.array()
            });
        }

        const { name, email, message, phone, company, service_type } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        // Verificar límite de mensajes por IP (usando Supabase)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        
        const { data: recentMessages, error: countError } = await supabase
            .from('contact_messages')
            .select('id')
            .eq('ip_address', ipAddress)
            .gte('created_at', oneHourAgo);

        if (countError) {
            console.error('Error al verificar límites:', countError);
            return next(createError(500, 'Error al verificar límites de envío'));
        }

        if (recentMessages && recentMessages.length >= 3) {
            return res.status(429).json({
                error: 'Límite excedido',
                message: 'Solo puedes enviar 3 mensajes por hora. Intenta más tarde.'
            });
        }

        // Insertar mensaje en Supabase
        const { data: newMessage, error: insertError } = await supabase
            .from('contact_messages')
            .insert([{
                name,
                email,
                message,
                phone: phone || null,
                company: company || null,
                service_type: service_type || null,
                ip_address: ipAddress,
                user_agent: req.get('User-Agent') || 'Unknown',
                status: 'unread'
            }])
            .select()
            .single();

        if (insertError) {
            console.error('Error al insertar mensaje:', insertError);
            return next(createError(500, 'Error al guardar el mensaje'));
        }

        // Enviar email de notificación
        try {
            await sendNotificationEmail({
                id: newMessage.id,
                name,
                email,
                message,
                phone,
                company,
                service_type,
                created_at: newMessage.created_at
            });
        } catch (emailError) {
            console.error('Error al enviar email:', emailError);
            // No fallar la request si el email falla
        }

        // Actualizar estadísticas
        await updateStats('total_messages');

        res.status(201).json({
            success: true,
            message: '¡Mensaje enviado correctamente! Nos pondremos en contacto contigo pronto.',
            data: {
                id: newMessage.id,
                created_at: newMessage.created_at
            }
        });

    } catch (error) {
        console.error('Error en ruta de contacto:', error);
        next(createError(500, 'Error interno del servidor'));
    }
});

// GET /api/contact/stats - Obtener estadísticas de contactos (solo para admin)
router.get('/stats', async (req, res, next) => {
    try {
        // Estadísticas generales usando Supabase
        const { data: allMessages, error: allError } = await supabase
            .from('contact_messages')
            .select('id, status, created_at, service_type');

        if (allError) {
            return next(createError(500, 'Error al obtener estadísticas'));
        }

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const stats = {
            total_messages: allMessages.length,
            unread_messages: allMessages.filter(m => m.status === 'unread').length,
            messages_this_week: allMessages.filter(m => new Date(m.created_at) >= weekAgo).length,
            messages_this_month: allMessages.filter(m => new Date(m.created_at) >= monthAgo).length
        };

        // Estadísticas por tipo de servicio
        const serviceStats = {};
        allMessages.forEach(message => {
            if (message.service_type) {
                serviceStats[message.service_type] = (serviceStats[message.service_type] || 0) + 1;
            }
        });

        const serviceStatsArray = Object.entries(serviceStats)
            .map(([service_type, count]) => ({ service_type, count }))
            .sort((a, b) => b.count - a.count);

        res.json({
            success: true,
            data: {
                general: stats,
                byService: serviceStatsArray
            }
        });

    } catch (error) {
        console.error('Error en estadísticas:', error);
        next(createError(500, 'Error interno del servidor'));
    }
});

// Función para actualizar estadísticas generales
async function updateStats(statName) {
    try {
        const { data: existingStat, error: selectError } = await supabase
            .from('site_stats')
            .select('stat_value')
            .eq('stat_name', statName)
            .single();

        if (selectError && selectError.code !== 'PGRST116') {
            console.error('Error al obtener estadística:', selectError);
            return;
        }

        if (existingStat) {
            // Actualizar estadística existente
            const { error: updateError } = await supabase
                .from('site_stats')
                .update({ 
                    stat_value: existingStat.stat_value + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('stat_name', statName);

            if (updateError) {
                console.error('Error al actualizar estadística:', updateError);
            }
        } else {
            // Crear nueva estadística
            const { error: insertError } = await supabase
                .from('site_stats')
                .insert([{
                    stat_name: statName,
                    stat_value: 1
                }]);

            if (insertError) {
                console.error('Error al crear estadística:', insertError);
            }
        }
    } catch (error) {
        console.error('Error en updateStats:', error);
    }
}

// Función para enviar notificación por email
async function sendNotificationEmail(messageData) {
    try {
        console.log('📧 Enviando notificación de nuevo mensaje:', {
            id: messageData.id,
            name: messageData.name,
            email: messageData.email,
            service: messageData.service_type || 'No especificado'
        });

        const transporter = createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_PORT == 465,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
            subject: `Nuevo mensaje de contacto - ${messageData.name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                        Nuevo mensaje de contacto
                    </h2>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Nombre:</strong> ${messageData.name}</p>
                        <p><strong>Email:</strong> <a href="mailto:${messageData.email}">${messageData.email}</a></p>
                        <p><strong>Teléfono:</strong> ${messageData.phone || 'No proporcionado'}</p>
                        <p><strong>Empresa:</strong> ${messageData.company || 'No proporcionada'}</p>
                        <p><strong>Servicio:</strong> ${messageData.service_type || 'No especificado'}</p>
                        <p><strong>Fecha:</strong> ${new Date(messageData.created_at).toLocaleString('es-ES')}</p>
                    </div>
                    <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px;">
                        <h3 style="color: #333; margin-top: 0;">Mensaje:</h3>
                        <p style="line-height: 1.6; color: #555;">${messageData.message}</p>
                    </div>
                    <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 5px; font-size: 12px; color: #6c757d;">
                        <p>ID del mensaje: ${messageData.id}</p>
                        <p>Este email fue enviado automáticamente desde el sitio web de Inversiones Guerroa C.A.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Email de notificación enviado correctamente');

    } catch (error) {
        console.error('❌ Error al enviar email de notificación:', error);
        throw error;
    }
}

module.exports = router;