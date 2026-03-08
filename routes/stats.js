const express = require('express');
const { getDatabase } = require('../database/init');
const { logActivity } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const router = express.Router();

// Obtener instancia de Supabase
const supabase = getDatabase();

// GET /api/stats/overview - Estadísticas generales del sitio
router.get('/overview', logActivity('view_stats_overview'), async (req, res, next) => {
    try {
        // Estadísticas de mensajes usando Supabase
        const { data: allMessages, error: messagesError } = await supabase
            .from('contact_messages')
            .select('id, status, created_at');

        if (messagesError) {
            return next(createError(500, 'Error al obtener estadísticas de mensajes'));
        }

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

        const messageStats = {
            total_messages: allMessages.length,
            unread_messages: allMessages.filter(m => m.status === 'unread').length,
            read_messages: allMessages.filter(m => m.status === 'read').length,
            replied_messages: allMessages.filter(m => m.status === 'replied').length,
            archived_messages: allMessages.filter(m => m.status === 'archived').length,
            messages_this_week: allMessages.filter(m => new Date(m.created_at) >= weekAgo).length,
            messages_this_month: allMessages.filter(m => new Date(m.created_at) >= monthAgo).length,
            messages_this_year: allMessages.filter(m => new Date(m.created_at) >= yearAgo).length
        };

        // Estadísticas de actividad de administradores
        const { data: allActivities, error: activitiesError } = await supabase
            .from('activity_logs')
            .select('id, admin_id, created_at')
            .not('admin_id', 'is', null);

        let activityStats = {
            active_admins: 0,
            total_activities: 0,
            activities_this_week: 0,
            activities_this_month: 0
        };

        if (!activitiesError && allActivities) {
            const uniqueAdmins = new Set(allActivities.map(a => a.admin_id));
            activityStats = {
                active_admins: uniqueAdmins.size,
                total_activities: allActivities.length,
                activities_this_week: allActivities.filter(a => new Date(a.created_at) >= weekAgo).length,
                activities_this_month: allActivities.filter(a => new Date(a.created_at) >= monthAgo).length
            };
        }

        res.json({
            success: true,
            data: {
                messages: messageStats,
                activity: activityStats
            }
        });

    } catch (error) {
        console.error('Error en overview stats:', error);
        next(createError(500, 'Error interno del servidor'));
    }
});

// GET /api/stats/messages/trends - Tendencias de mensajes por período
router.get('/messages/trends', logActivity('view_message_trends'), async (req, res, next) => {
    try {
        const { period = '30' } = req.query; // días
        const periodDays = parseInt(period);
        const periodAgo = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

        // Obtener mensajes del período
        const { data: messages, error: messagesError } = await supabase
            .from('contact_messages')
            .select('created_at, status, service_type')
            .gte('created_at', periodAgo)
            .order('created_at', { ascending: true });

        if (messagesError) {
            return next(createError(500, 'Error al obtener tendencias de mensajes'));
        }

        // Agrupar por día
        const dailyTrends = {};
        messages.forEach(message => {
            const date = message.created_at.split('T')[0]; // YYYY-MM-DD
            if (!dailyTrends[date]) {
                dailyTrends[date] = { date, count: 0, unread_count: 0 };
            }
            dailyTrends[date].count++;
            if (message.status === 'unread') {
                dailyTrends[date].unread_count++;
            }
        });

        // Obtener todos los mensajes para estadísticas de servicios
        const { data: allMessages, error: allError } = await supabase
            .from('contact_messages')
            .select('service_type, created_at')
            .not('service_type', 'is', null);

        let serviceTrends = [];
        if (!allError && allMessages) {
            const serviceStats = {};
            allMessages.forEach(message => {
                if (!serviceStats[message.service_type]) {
                    serviceStats[message.service_type] = { count: 0, recent_count: 0 };
                }
                serviceStats[message.service_type].count++;
                if (new Date(message.created_at) >= new Date(periodAgo)) {
                    serviceStats[message.service_type].recent_count++;
                }
            });

            serviceTrends = Object.entries(serviceStats)
                .map(([service_type, stats]) => ({
                    service_type,
                    count: stats.count,
                    recent_count: stats.recent_count
                }))
                .sort((a, b) => b.count - a.count);
        }

        res.json({
            success: true,
            data: {
                daily: Object.values(dailyTrends),
                byService: serviceTrends,
                period: periodDays
            }
        });

    } catch (error) {
        console.error('Error en message trends:', error);
        next(createError(500, 'Error interno del servidor'));
    }
});

// GET /api/stats/activity - Estadísticas de actividad de administradores
router.get('/activity', logActivity('view_activity_stats'), async (req, res, next) => {
    try {
        const { period = '30' } = req.query; // días
        const periodDays = parseInt(period);
        const periodAgo = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

        // Obtener administradores activos
        const { data: admins, error: adminsError } = await supabase
            .from('admins')
            .select('id, username, full_name')
            .eq('is_active', true);

        if (adminsError) {
            return next(createError(500, 'Error al obtener administradores'));
        }

        // Obtener logs de actividad
        const { data: activities, error: activitiesError } = await supabase
            .from('activity_logs')
            .select('admin_id, action, created_at')
            .not('admin_id', 'is', null);

        let adminActivity = [];
        let actionTypes = {};

        if (!activitiesError && activities) {
            // Estadísticas por administrador
            const adminStats = {};
            admins.forEach(admin => {
                adminStats[admin.id] = {
                    username: admin.username,
                    full_name: admin.full_name,
                    total_actions: 0,
                    recent_actions: 0,
                    last_activity: null
                };
            });

            activities.forEach(activity => {
                if (adminStats[activity.admin_id]) {
                    adminStats[activity.admin_id].total_actions++;
                    if (new Date(activity.created_at) >= new Date(periodAgo)) {
                        adminStats[activity.admin_id].recent_actions++;
                    }
                    if (!adminStats[activity.admin_id].last_activity || 
                        new Date(activity.created_at) > new Date(adminStats[activity.admin_id].last_activity)) {
                        adminStats[activity.admin_id].last_activity = activity.created_at;
                    }
                }

                // Estadísticas por tipo de acción
                if (!actionTypes[activity.action]) {
                    actionTypes[activity.action] = { count: 0, recent_count: 0 };
                }
                actionTypes[activity.action].count++;
                if (new Date(activity.created_at) >= new Date(periodAgo)) {
                    actionTypes[activity.action].recent_count++;
                }
            });

            adminActivity = Object.values(adminStats)
                .sort((a, b) => b.recent_actions - a.recent_actions);
        }

        const actionTypesArray = Object.entries(actionTypes)
            .map(([action, stats]) => ({
                action,
                count: stats.count,
                recent_count: stats.recent_count
            }))
            .sort((a, b) => b.count - a.count);

        res.json({
            success: true,
            data: {
                byAdmin: adminActivity,
                byAction: actionTypesArray,
                period: periodDays
            }
        });

    } catch (error) {
        console.error('Error en activity stats:', error);
        next(createError(500, 'Error interno del servidor'));
    }
});

// GET /api/stats/performance - Métricas de rendimiento del sitio
router.get('/performance', logActivity('view_performance_stats'), async (req, res, next) => {
    try {
        // Tiempo de respuesta promedio (simulado)
        const responseTime = Math.random() * 100 + 50; // 50-150ms

        // Uso de almacenamiento
        const { data: messages, error: messagesError } = await supabase
            .from('contact_messages')
            .select('id');

        let storageStats = {
            total_messages: 0,
            estimated_storage_kb: 0
        };

        if (!messagesError && messages) {
            storageStats = {
                total_messages: messages.length,
                estimated_storage_kb: messages.length * 0.5
            };
        }

        // Estadísticas de sesiones
        const { data: loginActivities, error: loginError } = await supabase
            .from('activity_logs')
            .select('created_at')
            .eq('action', 'login');

        let sessionStats = {
            total_sessions: 0,
            sessions_this_week: 0
        };

        if (!loginError && loginActivities) {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            sessionStats = {
                total_sessions: loginActivities.length,
                sessions_this_week: loginActivities.filter(s => new Date(s.created_at) >= weekAgo).length
            };
        }

        res.json({
            success: true,
            data: {
                performance: {
                    averageResponseTime: Math.round(responseTime),
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage(),
                    nodeVersion: process.version
                },
                storage: storageStats,
                sessions: sessionStats
            }
        });

    } catch (error) {
        console.error('Error en performance stats:', error);
        next(createError(500, 'Error interno del servidor'));
    }
});

// GET /api/stats/export - Exportar estadísticas
router.get('/export', logActivity('export_stats'), async (req, res, next) => {
    try {
        const { format = 'json', type = 'messages' } = req.query;

        if (type === 'messages') {
            const { data: messages, error: messagesError } = await supabase
                .from('contact_messages')
                .select('id, name, email, phone, company, service_type, status, created_at, updated_at')
                .order('created_at', { ascending: false });

            if (messagesError) {
                return next(createError(500, 'Error al exportar mensajes'));
            }

            if (format === 'csv') {
                // Convertir a CSV
                const csvHeader = 'ID,Nombre,Email,Teléfono,Empresa,Servicio,Estado,Fecha Creación,Fecha Actualización\n';
                const csvData = messages.map(msg => 
                    `${msg.id},"${msg.name}","${msg.email}","${msg.phone || ''}","${msg.company || ''}","${msg.service_type || ''}","${msg.status}","${msg.created_at}","${msg.updated_at}"`
                ).join('\n');
                
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="mensajes_contacto.csv"');
                res.send(csvHeader + csvData);
            } else {
                res.json({
                    success: true,
                    data: messages,
                    exported_at: new Date().toISOString(),
                    total_records: messages.length
                });
            }

        } else if (type === 'activity') {
            const { data: activities, error: activitiesError } = await supabase
                .from('activity_logs')
                .select(`
                    action, 
                    details, 
                    created_at,
                    admins!inner(username)
                `)
                .order('created_at', { ascending: false })
                .limit(1000);

            if (activitiesError) {
                return next(createError(500, 'Error al exportar actividad'));
            }

            const formattedActivities = activities.map(activity => ({
                action: activity.action,
                details: activity.details,
                created_at: activity.created_at,
                username: activity.admins?.username || 'Unknown'
            }));

            res.json({
                success: true,
                data: formattedActivities,
                exported_at: new Date().toISOString(),
                total_records: formattedActivities.length
            });

        } else {
            res.status(400).json({
                error: 'Tipo de exportación inválido',
                message: 'Los tipos válidos son: messages, activity'
            });
        }

    } catch (error) {
        console.error('Error en export stats:', error);
        next(createError(500, 'Error interno del servidor'));
    }
});

module.exports = router;