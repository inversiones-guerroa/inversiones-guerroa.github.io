const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../database/supabaseClient'); 
const { authenticateToken, requireRole, logActivity } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');
const router = express.Router();

// APLICAR PROTECCIÓN GLOBAL A TODAS LAS RUTAS DE ESTE ARCHIVO
router.use(authenticateToken);

// ==================== MENSAJES ====================

// 1. GET /api/admin/messages - Obtener mensajes con filtros
router.get('/messages', logActivity('view_messages'), async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, search, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase.from('contact_messages').select('*', { count: 'exact' });

        if (status) query = query.eq('status', status);
        if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,message.ilike.%${search}%`);

        const { data: messages, count, error } = await query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(from, to);

        if (error) throw error;

        res.json({
            success: true,
            data: messages,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        next(createError(500, 'Error al obtener mensajes', error.message));
    }
});

// 2. GET /api/admin/messages/:id - Obtener un mensaje específico
router.get('/messages/:id', logActivity('view_message'), async (req, res, next) => {
    try {
        const { data: message, error } = await supabase
            .from('contact_messages')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) {
            return next(createError(404, 'Mensaje no encontrado'));
        }

        // Marcar como leído si está sin leer
        if (message.status === 'unread') {
            await supabase
                .from('contact_messages')
                .update({ status: 'read', updated_at: new Date().toISOString() })
                .eq('id', req.params.id);
            
            message.status = 'read';
        }

        res.json({
            success: true,
            data: message
        });
    } catch (error) {
        next(createError(500, 'Error al obtener el mensaje'));
    }
});

// 3. PUT /api/admin/messages/:id/status - Cambiar estado del mensaje
router.put('/messages/:id/status', logActivity('update_message_status'), async (req, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ['unread', 'read', 'replied', 'archived'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Estado inválido',
                message: 'Estados válidos: unread, read, replied, archived'
            });
        }

        const { error } = await supabase
            .from('contact_messages')
            .update({ 
                status, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Estado actualizado correctamente'
        });
    } catch (error) {
        next(createError(500, 'Error al actualizar estado del mensaje'));
    }
});

// 4. DELETE /api/admin/messages/:id - Eliminar mensaje
router.delete('/messages/:id', requireRole(['admin', 'super_admin']), logActivity('delete_message'), async (req, res, next) => {
    try {
        const { error } = await supabase.from('contact_messages').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true, message: 'Mensaje eliminado correctamente' });
    } catch (error) {
        next(createError(500, 'No se pudo eliminar el mensaje'));
    }
});

// ==================== DASHBOARD ====================

// 5. GET /api/admin/dashboard - Dashboard con estadísticas y gráficos
router.get('/dashboard', logActivity('view_dashboard'), async (req, res, next) => {
    try {
        // Obtener estadísticas de mensajes
        const { data: allMessages, error: messagesError } = await supabase
            .from('contact_messages')
            .select('id, status, created_at, service_type');

        if (messagesError) throw messagesError;

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Estadísticas generales
        const messageStats = {
            total_messages: allMessages.length,
            unread_messages: allMessages.filter(m => m.status === 'unread').length,
            read_messages: allMessages.filter(m => m.status === 'read').length,
            replied_messages: allMessages.filter(m => m.status === 'replied').length,
            messages_this_week: allMessages.filter(m => new Date(m.created_at) >= weekAgo).length,
            messages_this_month: allMessages.filter(m => new Date(m.created_at) >= monthAgo).length
        };

        // Estadísticas por tipo de servicio (para gráficos)
        const serviceStats = {};
        allMessages.forEach(message => {
            if (message.service_type) {
                serviceStats[message.service_type] = (serviceStats[message.service_type] || 0) + 1;
            }
        });

        const serviceStatsArray = Object.entries(serviceStats)
            .map(([service_type, count]) => ({ service_type, count }))
            .sort((a, b) => b.count - a.count);

        // Mensajes recientes
        const recentMessages = allMessages
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        // Estadísticas por mes (últimos 6 meses)
        const monthlyStats = {};
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
            monthlyStats[monthKey] = 0;
        }

        allMessages.forEach(message => {
            const monthKey = message.created_at.substring(0, 7);
            if (monthlyStats.hasOwnProperty(monthKey)) {
                monthlyStats[monthKey]++;
            }
        });

        const monthlyStatsArray = Object.entries(monthlyStats)
            .map(([month, count]) => ({ month, count }));

        res.json({
            success: true,
            data: {
                messageStats,
                serviceStats: serviceStatsArray,
                recentMessages,
                monthlyStats: monthlyStatsArray
            }
        });
    } catch (error) {
        next(createError(500, 'Error en el dashboard', error.message));
    }
});

// ==================== SERVICIOS ====================

// 6. GET /api/admin/services - Obtener todos los servicios
router.get('/services', logActivity('view_services'), async (req, res, next) => {
    try {
        const { data: services, error } = await supabase
            .from('services')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data: services
        });
    } catch (error) {
        next(createError(500, 'Error al obtener servicios'));
    }
});

// 7. POST /api/admin/services - Crear nuevo servicio
router.post('/services', [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('El título debe tener entre 3 y 200 caracteres'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),
    body('icon').optional().trim().isLength({ max: 100 }).withMessage('El ícono no puede exceder 100 caracteres')
], logActivity('create_service'), async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos inválidos',
                details: errors.array()
            });
        }

        const { title, description, icon, display_order } = req.body;

        const { data: newService, error } = await supabase
            .from('services')
            .insert([{
                title,
                description: description || null,
                icon: icon || 'fas fa-cog',
                display_order: display_order || 0,
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: newService,
            message: 'Servicio creado correctamente'
        });
    } catch (error) {
        next(createError(500, 'Error al crear servicio'));
    }
});

// 8. PUT /api/admin/services/:id - Actualizar servicio
router.put('/services/:id', [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('El título debe tener entre 3 y 200 caracteres'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),
    body('icon').optional().trim().isLength({ max: 100 }).withMessage('El ícono no puede exceder 100 caracteres')
], logActivity('update_service'), async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos inválidos',
                details: errors.array()
            });
        }

        const { title, description, icon, display_order, is_active } = req.body;

        const { error } = await supabase
            .from('services')
            .update({
                title,
                description,
                icon,
                display_order,
                is_active,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Servicio actualizado correctamente'
        });
    } catch (error) {
        next(createError(500, 'Error al actualizar servicio'));
    }
});

// 9. DELETE /api/admin/services/:id - Eliminar servicio
router.delete('/services/:id', requireRole(['admin', 'super_admin']), logActivity('delete_service'), async (req, res, next) => {
    try {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Servicio eliminado correctamente'
        });
    } catch (error) {
        next(createError(500, 'Error al eliminar servicio'));
    }
});

// ==================== GALERÍA ====================

// 10. GET /api/admin/gallery - Obtener imágenes de la galería
router.get('/gallery', logActivity('view_gallery'), async (req, res, next) => {
    try {
        const { data: images, error } = await supabase
            .from('gallery_images')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data: images
        });
    } catch (error) {
        next(createError(500, 'Error al obtener galería'));
    }
});

// 11. POST /api/admin/gallery - Agregar imagen a la galería
router.post('/gallery', logActivity('add_gallery_image'), async (req, res, next) => {
    try {
        const { filename, original_name, title, description, file_size, mime_type } = req.body;

        // Verificar límite de 6 imágenes
        const { count, error: countError } = await supabase
            .from('gallery_images')
            .select('id', { count: 'exact' })
            .eq('is_active', true);

        if (countError) throw countError;

        if (count >= 6) {
            return res.status(400).json({
                error: 'Límite excedido',
                message: 'Solo se permiten máximo 6 imágenes en la galería'
            });
        }

        const { data: newImage, error } = await supabase
            .from('gallery_images')
            .insert([{
                filename,
                original_name,
                title: title || null,
                description: description || null,
                file_size: file_size || null,
                mime_type: mime_type || null,
                display_order: count + 1,
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: newImage,
            message: 'Imagen agregada a la galería'
        });
    } catch (error) {
        next(createError(500, 'Error al agregar imagen a la galería'));
    }
});

// 12. PUT /api/admin/gallery/:id - Actualizar imagen de la galería
router.put('/gallery/:id', logActivity('update_gallery_image'), async (req, res, next) => {
    try {
        const { title, description, display_order } = req.body;

        const { error } = await supabase
            .from('gallery_images')
            .update({
                title,
                description,
                display_order,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Imagen actualizada correctamente'
        });
    } catch (error) {
        next(createError(500, 'Error al actualizar imagen'));
    }
});

// 13. DELETE /api/admin/gallery/:id - Eliminar imagen de la galería
router.delete('/gallery/:id', requireRole(['admin', 'super_admin']), logActivity('delete_gallery_image'), async (req, res, next) => {
    try {
        const { error } = await supabase
            .from('gallery_images')
            .update({ is_active: false })
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Imagen eliminada de la galería'
        });
    } catch (error) {
        next(createError(500, 'Error al eliminar imagen'));
    }
});

module.exports = router;