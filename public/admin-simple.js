// Panel de Administración Simplificado - Guerroa C.A.
console.log('🚀 Cargando admin-simple.js...');

const API_URL = '/api';
const token = localStorage.getItem('adminToken');

document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 DOM cargado');
    
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Configurar event listeners para navegación
    setupEventListeners();
    
    loadDashboard();
});

// Configurar todos los event listeners
function setupEventListeners() {
    console.log('🔧 Configurando event listeners...');
    
    // Navegación del sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const section = e.currentTarget.getAttribute('data-section');
            if (section) {
                showSection(section);
            }
        });
    });
    
    // Botón de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Botones de filtro de mensajes
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.currentTarget.getAttribute('data-filter');
            loadMessages(filter);
        });
    });
    
    // Botones de modal
    const closeModalBtn = document.getElementById('close-modal-btn');
    const btnCloseModal = document.getElementById('btn-close-modal');
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    
    console.log('✅ Event listeners configurados');
}

// ==================== NAVEGACIÓN ====================
function showSection(sectionName) {
    console.log(`🔄 Cambiando a: ${sectionName}`);
    
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    // Mostrar sección seleccionada
    const section = document.getElementById(sectionName);
    if (section) {
        section.classList.add('active');
        console.log(`✅ Sección ${sectionName} activada`);
    } else {
        console.error(`❌ No se encontró la sección: ${sectionName}`);
    }
    
    // Actualizar navegación - buscar el elemento clickeado
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Activar el elemento correcto
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const itemText = item.textContent.toLowerCase().trim();
        const sectionMap = {
            'dashboard': 'dashboard',
            'mensajes': 'messages',
            'galería': 'gallery', 
            'servicios': 'services',
            'configuración': 'settings'
        };
        
        if (sectionMap[itemText] === sectionName) {
            item.classList.add('active');
        }
    });
    
    // Actualizar título
    const titles = {
        'dashboard': 'Dashboard',
        'messages': 'Mensajes', 
        'gallery': 'Galería',
        'services': 'Servicios',
        'settings': 'Configuración'
    };
    
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = titles[sectionName] || 'Panel';
    
    // Cargar datos
    switch(sectionName) {
        case 'messages': 
            loadMessages('all'); 
            break;
        case 'gallery': 
            loadGallery(); 
            break;
        case 'services': 
            loadServices(); 
            break;
        case 'dashboard': 
            loadDashboard(); 
            break;
    }
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
    try {
        console.log('📊 Cargando dashboard...');
        
        const response = await fetch(`${API_URL}/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        console.log('Dashboard data:', result);
        
        if (result.success) {
            // Actualizar estadísticas
            const stats = result.data.messageStats;
            updateElement('dash-total', stats.total_messages || 0);
            updateElement('dash-unread', stats.unread_messages || 0);
            updateElement('dash-read', stats.read_messages || 0);
            
            // Renderizar gráficos
            renderServiceChart(result.data.serviceStats || []);
            renderMonthlyChart(result.data.monthlyStats || []);
            
            // Renderizar mensajes recientes
            renderRecentMessages(result.data.recentMessages || []);
        }
    } catch (error) {
        console.error('Error dashboard:', error);
        showNotification('Error al cargar dashboard: ' + error.message, 'error');
    }
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function renderServiceChart(serviceStats) {
    const chartContainer = document.getElementById('service-chart');
    if (!chartContainer) {
        console.log('⚠️ No se encontró service-chart');
        return;
    }

    if (!serviceStats || serviceStats.length === 0) {
        chartContainer.innerHTML = '<h4>Servicios Más Solicitados</h4><p style="color: #999; text-align: center; padding: 20px;">No hay datos disponibles</p>';
        return;
    }

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
    if (!chartContainer) {
        console.log('⚠️ No se encontró monthly-chart');
        return;
    }

    if (!monthlyStats || monthlyStats.length === 0) {
        chartContainer.innerHTML = '<h4>Mensajes por Mes</h4><p style="color: #999; text-align: center; padding: 20px;">No hay datos disponibles</p>';
        return;
    }

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
    const tbody = document.getElementById('dash-recent-table');
    if (!tbody) return;
    
    if (messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">No hay mensajes recientes</td></tr>';
        return;
    }
    
    tbody.innerHTML = messages.map(msg => `
        <tr>
            <td>
                <strong>${msg.name || 'Sin nombre'}</strong><br>
                <small>${msg.email || 'Sin email'}</small>
            </td>
            <td>${new Date(msg.created_at).toLocaleDateString('es-ES')}</td>
            <td>
                <button class="btn btn-action btn-primary" data-view-message="${msg.id}">Ver</button>
            </td>
        </tr>
    `).join('');
    
    // Agregar event listeners a los botones "Ver"
    tbody.querySelectorAll('[data-view-message]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const messageId = e.currentTarget.getAttribute('data-view-message');
            viewMessage(parseInt(messageId));
        });
    });
}

// ==================== MENSAJES ====================
async function loadMessages(filter = 'all') {
    try {
        console.log(`📧 Cargando mensajes: ${filter}`);
        
        let url = `${API_URL}/admin/messages`;
        if (filter !== 'all') url += `?status=${filter}`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        console.log('Messages data:', result);
        
        if (result.success) {
            renderMessagesTable(result.data || []);
        }
    } catch (error) {
        console.error('Error mensajes:', error);
    }
}

function renderMessagesTable(messages) {
    const tbody = document.getElementById('messages-table-body');
    if (!tbody) return;
    
    if (messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No hay mensajes</td></tr>';
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
                <span class="badge ${getBadgeClass(msg.status)}">${getStatusText(msg.status)}</span>
            </td>
            <td>
                <button class="btn btn-action btn-primary" data-view-message="${msg.id}" title="Ver">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-action btn-success" data-mark-read="${msg.id}" title="Marcar leído">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-action btn-danger" data-delete-message="${msg.id}" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Agregar event listeners a los botones
    tbody.querySelectorAll('[data-view-message]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const messageId = e.currentTarget.getAttribute('data-view-message');
            viewMessage(parseInt(messageId));
        });
    });
    
    tbody.querySelectorAll('[data-mark-read]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const messageId = e.currentTarget.getAttribute('data-mark-read');
            markAsRead(parseInt(messageId));
        });
    });
    
    tbody.querySelectorAll('[data-delete-message]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const messageId = e.currentTarget.getAttribute('data-delete-message');
            deleteMessage(parseInt(messageId));
        });
    });
}

function getBadgeClass(status) {
    return {
        'unread': 'badge-unread',
        'read': 'badge-read',
        'replied': 'badge-success',
        'archived': 'badge-secondary'
    }[status] || 'badge-secondary';
}

function getStatusText(status) {
    return {
        'unread': 'Sin leer',
        'read': 'Leído', 
        'replied': 'Respondido',
        'archived': 'Archivado'
    }[status] || status;
}

async function viewMessage(id) {
    try {
        console.log(`👁️ Viendo mensaje: ${id}`);
        
        const response = await fetch(`${API_URL}/admin/messages/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        console.log('Message data:', result);
        
        if (result.success) {
            showMessageModal(result.data);
        }
    } catch (error) {
        console.error('Error ver mensaje:', error);
    }
}

function showMessageModal(message) {
    // Crear modal si no existe
    let modal = document.getElementById('messageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'messageModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal()">&times;</span>
            <h2>Detalle del Mensaje</h2>
            <div class="message-details">
                <p><strong>Nombre:</strong> ${message.name}</p>
                <p><strong>Email:</strong> <a href="mailto:${message.email}">${message.email}</a></p>
                <p><strong>Teléfono:</strong> ${message.phone || 'No proporcionado'}</p>
                <p><strong>Empresa:</strong> ${message.company || 'No proporcionada'}</p>
                <p><strong>Servicio:</strong> ${message.service_type || 'No especificado'}</p>
                <p><strong>Estado:</strong> <span class="badge ${getBadgeClass(message.status)}">${getStatusText(message.status)}</span></p>
                <p><strong>Fecha:</strong> ${new Date(message.created_at).toLocaleString('es-ES')}</p>
                <div style="margin-top: 15px;">
                    <strong>Mensaje:</strong>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
                        ${message.message}
                    </div>
                </div>
            </div>
            <div style="margin-top: 20px; text-align: right;">
                <button class="btn btn-success" onclick="markAsRead(${message.id}); closeModal();">
                    <i class="fas fa-check"></i> Marcar como Leído
                </button>
                <button class="btn btn-danger" onclick="deleteMessage(${message.id}); closeModal();">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
                <button class="btn btn-primary" onclick="closeModal()">Cerrar</button>
            </div>
        </div>
    `;
    
    modal.classList.add('open');
}

async function markAsRead(id) {
    try {
        const response = await fetch(`${API_URL}/admin/messages/${id}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'read' })
        });
        
        if (response.ok) {
            showNotification('Marcado como leído', 'success');
            loadMessages('all');
            loadDashboard();
        }
    } catch (error) {
        console.error('Error marcar leído:', error);
    }
}

async function deleteMessage(id) {
    if (!confirm('¿Eliminar este mensaje?')) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/messages/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showNotification('Mensaje eliminado', 'success');
            loadMessages('all');
            loadDashboard();
        }
    } catch (error) {
        console.error('Error eliminar:', error);
    }
}

// ==================== SERVICIOS ====================
async function loadServices() {
    try {
        const response = await fetch(`${API_URL}/admin/services`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderServices(result.data || []);
        }
    } catch (error) {
        console.error('Error servicios:', error);
    }
}

function renderServices(services) {
    const container = document.getElementById('services-container');
    if (!container) return;
    
    container.innerHTML = `
        <h3>Gestión de Servicios</h3>
        <button class="btn btn-primary" onclick="alert('Función en desarrollo')">
            <i class="fas fa-plus"></i> Agregar Servicio
        </button>
        <div style="margin-top: 20px;">
            ${services.map(service => `
                <div style="background: white; padding: 20px; margin: 10px 0; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <h4><i class="${service.icon}"></i> ${service.title}</h4>
                    <p>${service.description || 'Sin descripción'}</p>
                    <span class="badge ${service.is_active ? 'badge-success' : 'badge-secondary'}">
                        ${service.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
            `).join('')}
        </div>
    `;
}

// ==================== GALERÍA ====================
async function loadGallery() {
    const container = document.getElementById('gallery-container');
    if (!container) return;
    
    container.innerHTML = `
        <h3>Gestión de Galería</h3>
        <div class="upload-area" onclick="document.getElementById('file-upload').click()">
            <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; margin-bottom: 10px;"></i>
            <p>Subir nueva imagen</p>
            <input type="file" id="file-upload" hidden accept="image/*" onchange="uploadImage(this)">
        </div>
        <div id="gallery-images" style="margin-top: 20px;">
            Cargando imágenes...
        </div>
    `;
    
    // Cargar imágenes existentes
    try {
        const response = await fetch('/api/public/galeria');
        const images = await response.json();
        
        const imagesContainer = document.getElementById('gallery-images');
        if (images.length === 0) {
            imagesContainer.innerHTML = '<p>No hay imágenes en la galería</p>';
        } else {
            imagesContainer.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                    ${images.map(img => `
                        <div style="position: relative; border-radius: 8px; overflow: hidden;">
                            <img src="/galeria/${img}" style="width: 100%; height: 150px; object-fit: cover;">
                            <button onclick="deleteImage('${img}')" 
                                    style="position: absolute; top: 5px; right: 5px; background: rgba(255,0,0,0.8); color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargar galería:', error);
    }
}

async function uploadImage(input) {
    if (!input.files[0]) return;
    
    const formData = new FormData();
    formData.append('imagen', input.files[0]);
    
    try {
        const response = await fetch('/api/manage/galeria', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        if (response.ok) {
            showNotification('Imagen subida', 'success');
            loadGallery();
        }
    } catch (error) {
        console.error('Error subir:', error);
    }
    
    input.value = '';
}

async function deleteImage(filename) {
    if (!confirm('¿Eliminar imagen?')) return;
    
    try {
        const response = await fetch(`/api/manage/galeria/${filename}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showNotification('Imagen eliminada', 'success');
            loadGallery();
        }
    } catch (error) {
        console.error('Error eliminar imagen:', error);
    }
}

// ==================== UTILIDADES ====================
function closeModal() {
    const modal = document.getElementById('messageModal');
    if (modal) modal.classList.remove('open');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        padding: 15px 20px; border-radius: 8px; color: white; font-weight: 500;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

// ==================== FUNCIONES GLOBALES ====================
window.showSection = showSection;
window.loadMessages = loadMessages;
window.viewMessage = viewMessage;
window.markAsRead = markAsRead;
window.deleteMessage = deleteMessage;
window.uploadImage = uploadImage;
window.deleteImage = deleteImage;
window.closeModal = closeModal;

window.logout = function() {
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
};

console.log('✅ admin-simple.js cargado completamente');