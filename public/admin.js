// Panel de Administración - Guerroa C.A.
console.log('🚀 Cargando admin.js...');

const API_URL = '/api';
const token = localStorage.getItem('adminToken');

// Variables globales
let currentMessages = [];
let currentServices = [];
let currentGalleryImages = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 DOM cargado, iniciando panel...');
    
    if (!token) {
        console.error('❌ No hay token, redirigiendo al login...');
        window.location.href = '/login';
        r
    // Cargar dashboard inicial
    loadDashboard();
});

// ==================== FUNCIONES DE NAVEGACIÓN ====================

function showSection(sectionName) {
    console.log(`🔄 Cambiando a sección: ${sectionName}`);
    
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Actualizar navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');

    // Actualizar título
    const titles = {
        'dashboard': 'Dashboard',
        'messages': 'Mensajes',
        'gallery': 'Galería',
        'services': 'Servicios',
        'settings': 'Configuración'
    };
    document.getElementById('page-title').textContent = titles[sectionName] || 'Panel';

    // Cargar datos específicos de la sección
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'messages':
            loadMessages('all');
            break;
        case 'gallery':
            loadGallery();
            break;
        case 'services':
            loadServices();
            break;
    }
}

// ==================== DASHBOARD ====================

async function loadDashboard() {
    try {
        console.log('📊 Cargando dashboard...');
        
        const response = await fetch(`${API_URL}/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            updateDashboardStats(result.data);
            renderServiceChart(result.data.serviceStats);
            renderMonthlyChart(result.data.monthlyStats);
            renderRecentMessages(result.data.recentMessages);
        }
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
        showNotification('Error al cargar dashboard', 'error');
    }
}

function updateDashboardStats(data) {
    const stats = data.messageStats;
    
    document.getElementById('dash-total').textContent = stats.total_messages || 0;
    document.getElementById('dash-unread').textContent = stats.unread_messages || 0;
    
    // Actualizar estadísticas adicionales si existen
    const readElement = document.getElementById('dash-read');
    const repliedElement = document.getElementById('dash-replied');
    
    if (readElement) readElement.textContent = stats.read_messages || 0;
    if (repliedElement) repliedElement.textContent = stats.replied_messages || 0;
}

function renderServiceChart(serviceStats) {
    const chartContainer = document.getElementById('service-chart');
    if (!chartContainer || !serviceStats.length) return;

    const maxCount = Math.max(...serviceStats.map(s => s.count));
    
    chartContainer.innerHTML = `
        <h4>Servicios Más Solicitados</h4>
        <div class="chart-bars">
            ${serviceStats.map(service => `
                <div class="chart-bar-item">
                    <div class="chart-bar">
                        <div class="chart-bar-fill" style="width: ${(service.count / maxCount) * 100}%"></div>
                    </div>
                    <div class="chart-label">
                        <span>${service.service_type}</span>
                        <strong>${service.count}</strong>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderMonthlyChart(monthlyStats) {
    const chartContainer = document.getElementById('monthly-chart');
    if (!chartContainer || !monthlyStats.length) return;

    const maxCount = Math.max(...monthlyStats.map(m => m.count));
    
    chartContainer.innerHTML = `
        <h4>Mensajes por Mes</h4>
        <div class="chart-bars horizontal">
            ${monthlyStats.map(month => `
                <div class="chart-bar-item">
                    <div class="chart-label">${formatMonth(month.month)}</div>
                    <div class="chart-bar">
                        <div class="chart-bar-fill" style="height: ${maxCount > 0 ? (month.count / maxCount) * 100 : 0}%"></div>
                    </div>
                    <div class="chart-value">${month.count}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function formatMonth(monthStr) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const [year, month] = monthStr.split('-');
    return `${months[parseInt(month) - 1]} ${year}`;
}

function renderRecentMessages(messages) {
    const tableBody = document.getElementById('dash-recent-table');
    if (!tableBody) return;

    if (messages.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #999;">No hay mensajes recientes</td></tr>';
        return;
    }

    tableBody.innerHTML = messages.map(msg => `
        <tr>
            <td>
                <strong>${msg.name || 'Sin nombre'}</strong><br>
                <small style="color: #666;">${msg.email || 'Sin email'}</small>
            </td>
            <td>${new Date(msg.created_at).toLocaleDateString('es-ES')}</td>
            <td>
                <button class="btn btn-action btn-primary" onclick="viewMessage(${msg.id})">
                    Ver
                </button>
            </td>
        </tr>
    `).join('');
}

// ==================== MENSAJES ====================

async function loadMessages(filter = 'all') {
    try {
        console.log(`📧 Cargando mensajes (filtro: ${filter})...`);
        
        let url = `${API_URL}/admin/messages`;
        if (filter !== 'all') {
            url += `?status=${filter}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            currentMessages = result.data;
            renderMessagesTable(result.data);
        } else {
            showNotification('Error al cargar mensajes', 'error');
        }
    } catch (error) {
        console.error('Error al cargar mensajes:', error);
        showNotification('Error al cargar mensajes', 'error');
    }
}

function renderMessagesTable(messages) {
    const tbody = document.getElementById('messages-table-body');
    if (!tbody) return;

    if (messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No hay mensajes</td></tr>';
        return;
    }

    tbody.innerHTML = messages.map(msg => `
        <tr>
            <td>
                <strong>${msg.name}</strong><br>
                <small>${msg.email}</small>
            </td>
            <td>${msg.service_type || 'N/A'}</td>
            <td>${new Date(msg.created_at).toLocaleDateString('es-ES')}</td>
            <td>
                <span class="badge ${getBadgeClass(msg.status)}">
                    ${getStatusText(msg.status)}
                </span>
            </td>
            <td>
                <button class="btn btn-action btn-primary" onclick="viewMessage(${msg.id})" title="Ver mensaje">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-action btn-success" onclick="markAsRead(${msg.id})" title="Marcar como leído">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-action btn-danger" onclick="deleteMessage(${msg.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getBadgeClass(status) {
    const classes = {
        'unread': 'badge-unread',
        'read': 'badge-read',
        'replied': 'badge-success',
        'archived': 'badge-secondary'
    };
    return classes[status] || 'badge-secondary';
}

function getStatusText(status) {
    const texts = {
        'unread': 'Sin leer',
        'read': 'Leído',
        'replied': 'Respondido',
        'archived': 'Archivado'
    };
    return texts[status] || status;
}

async function viewMessage(id) {
    try {
        const response = await fetch(`${API_URL}/admin/messages/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            showMessageModal(result.data);
        } else {
            showNotification('Error al cargar el mensaje', 'error');
        }
    } catch (error) {
        console.error('Error al ver mensaje:', error);
        showNotification('Error al cargar el mensaje', 'error');
    }
}

function showMessageModal(message) {
    const modal = document.getElementById('messageModal');
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <div class="message-details">
            <div class="detail-row">
                <strong>Nombre:</strong>
                <span>${message.name}</span>
            </div>
            <div class="detail-row">
                <strong>Email:</strong>
                <span><a href="mailto:${message.email}">${message.email}</a></span>
            </div>
            <div class="detail-row">
                <strong>Teléfono:</strong>
                <span>${message.phone || 'No proporcionado'}</span>
            </div>
            <div class="detail-row">
                <strong>Empresa:</strong>
                <span>${message.company || 'No proporcionada'}</span>
            </div>
            <div class="detail-row">
                <strong>Servicio:</strong>
                <span>${message.service_type || 'No especificado'}</span>
            </div>
            <div class="detail-row">
                <strong>Estado:</strong>
                <span class="badge ${getBadgeClass(message.status)}">${getStatusText(message.status)}</span>
            </div>
            <div class="detail-row">
                <strong>Fecha:</strong>
                <span>${new Date(message.created_at).toLocaleString('es-ES')}</span>
            </div>
            <div class="detail-row full-width">
                <strong>Mensaje:</strong>
                <div class="message-content">${message.message}</div>
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn btn-success" onclick="updateMessageStatus(${message.id}, 'replied')">
                <i class="fas fa-reply"></i> Marcar como Respondido
            </button>
            <button class="btn btn-warning" onclick="updateMessageStatus(${message.id}, 'archived')">
                <i class="fas fa-archive"></i> Archivar
            </button>
            <button class="btn btn-danger" onclick="deleteMessage(${message.id}); closeModal();">
                <i class="fas fa-trash"></i> Eliminar
            </button>
        </div>
    `;
    
    modal.classList.add('open');
}

async function markAsRead(id) {
    await updateMessageStatus(id, 'read');
}

async function updateMessageStatus(id, status) {
    try {
        const response = await fetch(`${API_URL}/admin/messages/${id}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Estado actualizado correctamente', 'success');
            loadMessages('all'); // Recargar mensajes
            closeModal();
        } else {
            showNotification('Error al actualizar estado', 'error');
        }
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        showNotification('Error al actualizar estado', 'error');
    }
}

async function deleteMessage(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/messages/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Mensaje eliminado correctamente', 'success');
            loadMessages('all'); // Recargar mensajes
        } else {
            showNotification('Error al eliminar mensaje', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar mensaje:', error);
        showNotification('Error al eliminar mensaje', 'error');
    }
}

// ==================== SERVICIOS ====================

async function loadServices() {
    try {
        console.log('🛠️ Cargando servicios...');
        
        const response = await fetch(`${API_URL}/admin/services`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            currentServices = result.data;
            renderServicesTable(result.data);
        } else {
            showNotification('Error al cargar servicios', 'error');
        }
    } catch (error) {
        console.error('Error al cargar servicios:', error);
        showNotification('Error al cargar servicios', 'error');
    }
}

function renderServicesTable(services) {
    const container = document.getElementById('services-container');
    if (!container) return;

    container.innerHTML = `
        <div class="services-header">
            <h3>Gestión de Servicios</h3>
            <button class="btn btn-primary" onclick="showAddServiceModal()">
                <i class="fas fa-plus"></i> Agregar Servicio
            </button>
        </div>
        <div class="services-grid">
            ${services.map(service => `
                <div class="service-card ${service.is_active ? '' : 'inactive'}">
                    <div class="service-icon">
                        <i class="${service.icon}"></i>
                    </div>
                    <div class="service-content">
                        <h4>${service.title}</h4>
                        <p>${service.description || 'Sin descripción'}</p>
                        <div class="service-meta">
                            <span class="badge ${service.is_active ? 'badge-success' : 'badge-secondary'}">
                                ${service.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                            <span class="service-order">Orden: ${service.display_order}</span>
                        </div>
                    </div>
                    <div class="service-actions">
                        <button class="btn btn-sm btn-primary" onclick="editService(${service.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteService(${service.id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function showAddServiceModal() {
    showServiceModal();
}

function showServiceModal(service = null) {
    const isEdit = service !== null;
    const modal = document.getElementById('serviceModal') || createServiceModal();
    
    const modalBody = modal.querySelector('.modal-body');
    modalBody.innerHTML = `
        <h3>${isEdit ? 'Editar' : 'Agregar'} Servicio</h3>
        <form id="serviceForm">
            <div class="form-group">
                <label>Título *</label>
                <input type="text" id="serviceTitle" value="${service?.title || ''}" required>
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea id="serviceDescription" rows="3">${service?.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Ícono (clase CSS)</label>
                <input type="text" id="serviceIcon" value="${service?.icon || 'fas fa-cog'}" placeholder="fas fa-cog">
            </div>
            <div class="form-group">
                <label>Orden de visualización</label>
                <input type="number" id="serviceOrder" value="${service?.display_order || 0}" min="0">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="serviceActive" ${service?.is_active !== false ? 'checked' : ''}>
                    Activo
                </label>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeServiceModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">
                    ${isEdit ? 'Actualizar' : 'Crear'} Servicio
                </button>
            </div>
        </form>
    `;
    
    modal.classList.add('open');
    
    // Manejar envío del formulario
    document.getElementById('serviceForm').onsubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            updateService(service.id);
        } else {
            createService();
        }
    };
}

function createServiceModal() {
    const modal = document.createElement('div');
    modal.id = 'serviceModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeServiceModal()">&times;</span>
            <div class="modal-body"></div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

async function createService() {
    const serviceData = {
        title: document.getElementById('serviceTitle').value,
        description: document.getElementById('serviceDescription').value,
        icon: document.getElementById('serviceIcon').value,
        display_order: parseInt(document.getElementById('serviceOrder').value),
        is_active: document.getElementById('serviceActive').checked
    };

    try {
        const response = await fetch(`${API_URL}/admin/services`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(serviceData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Servicio creado correctamente', 'success');
            closeServiceModal();
            loadServices();
        } else {
            showNotification('Error al crear servicio', 'error');
        }
    } catch (error) {
        console.error('Error al crear servicio:', error);
        showNotification('Error al crear servicio', 'error');
    }
}

async function updateService(id) {
    const serviceData = {
        title: document.getElementById('serviceTitle').value,
        description: document.getElementById('serviceDescription').value,
        icon: document.getElementById('serviceIcon').value,
        display_order: parseInt(document.getElementById('serviceOrder').value),
        is_active: document.getElementById('serviceActive').checked
    };

    try {
        const response = await fetch(`${API_URL}/admin/services/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(serviceData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Servicio actualizado correctamente', 'success');
            closeServiceModal();
            loadServices();
        } else {
            showNotification('Error al actualizar servicio', 'error');
        }
    } catch (error) {
        console.error('Error al actualizar servicio:', error);
        showNotification('Error al actualizar servicio', 'error');
    }
}

function editService(id) {
    const service = currentServices.find(s => s.id === id);
    if (service) {
        showServiceModal(service);
    }
}

async function deleteService(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/services/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Servicio eliminado correctamente', 'success');
            loadServices();
        } else {
            showNotification('Error al eliminar servicio', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar servicio:', error);
        showNotification('Error al eliminar servicio', 'error');
    }
}

function closeServiceModal() {
    const modal = document.getElementById('serviceModal');
    if (modal) {
        modal.classList.remove('open');
    }
}

// ==================== GALERÍA ====================

async function loadGallery() {
    try {
        console.log('🖼️ Cargando galería...');
        
        const response = await fetch(`${API_URL}/admin/gallery`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            currentGalleryImages = result.data;
            renderGallery(result.data);
        } else {
            showNotification('Error al cargar galería', 'error');
        }
    } catch (error) {
        console.error('Error al cargar galería:', error);
        showNotification('Error al cargar galería', 'error');
    }
}

function renderGallery(images) {
    const container = document.getElementById('gallery-container');
    if (!container) return;

    const canAddMore = images.length < 6;

    container.innerHTML = `
        <div class="gallery-header">
            <h3>Galería de Imágenes (${images.length}/6)</h3>
            ${canAddMore ? `
                <div class="upload-area" onclick="document.getElementById('file-upload').click()">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Subir nueva imagen</p>
                    <input type="file" id="file-upload" hidden accept="image/*" onchange="uploadImage(this)">
                </div>
            ` : `
                <div class="upload-disabled">
                    <p>Límite de 6 imágenes alcanzado</p>
                </div>
            `}
        </div>
        <div class="gallery-grid">
            ${images.map(img => `
                <div class="gallery-item">
                    <img src="/galeria/${img.filename}" alt="${img.title || img.original_name}">
                    <div class="gallery-overlay">
                        <div class="gallery-info">
                            <h5>${img.title || img.original_name}</h5>
                            <p>${img.description || ''}</p>
                        </div>
                        <div class="gallery-actions">
                            <button class="btn btn-sm btn-primary" onclick="editGalleryImage(${img.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteGalleryImage(${img.id})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function uploadImage(input) {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('imagen', file);

    try {
        console.log('📤 Subiendo imagen...');
        
        const response = await fetch(`${API_URL}/manage/galeria`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            // Agregar a la base de datos de galería
            await fetch(`${API_URL}/admin/gallery`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: result.archivo,
                    original_name: file.name,
                    file_size: file.size,
                    mime_type: file.type
                })
            });

            showNotification('Imagen subida correctamente', 'success');
            loadGallery();
        } else {
            showNotification(`Error: ${result.error || 'Error al subir imagen'}`, 'error');
        }
    } catch (error) {
        console.error('Error al subir imagen:', error);
        showNotification('Error al subir imagen', 'error');
    }

    // Limpiar input
    input.value = '';
}

async function deleteGalleryImage(id) {
    if (!confirm('¿Eliminar esta imagen de la galería?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/gallery/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showNotification('Imagen eliminada', 'success');
            loadGallery();
        } else {
            showNotification('Error al eliminar imagen', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar imagen:', error);
        showNotification('Error al eliminar imagen', 'error');
    }
}

// ==================== UTILIDADES ====================

function closeModal() {
    const modal = document.getElementById('messageModal');
    if (modal) {
        modal.classList.remove('open');
    }
}

function showNotification(message, type = 'info') {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Mostrar y ocultar después de 3 segundos
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// ==================== FUNCIONES GLOBALES ====================

window.showSection = showSection;
window.loadMessages = loadMessages;
window.viewMessage = viewMessage;
window.markAsRead = markAsRead;
window.deleteMessage = deleteMessage;
window.updateMessageStatus = updateMessageStatus;
window.uploadImage = uploadImage;
window.deleteGalleryImage = deleteGalleryImage;
window.editGalleryImage = editGalleryImage;
window.showAddServiceModal = showAddServiceModal;
window.editService = editService;
window.deleteService = deleteService;
window.closeModal = closeModal;
window.closeServiceModal = closeServiceModal;

window.logout = function() {
    console.log('👋 Cerrando sesión...');
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
};