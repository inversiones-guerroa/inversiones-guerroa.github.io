document.addEventListener('DOMContentLoaded', function() {
    // ----------------------------------------------------
    // 1. DETECCIÓN DE PÁGINA Y CARGA DE DATOS
    // ----------------------------------------------------
    const isAdminPage = window.location.pathname.includes('admin.html');
    const isLoginPage = window.location.pathname.includes('login.html');

    if (isAdminPage) {
        cargarConfigAdmin();
        cargarGaleriaAdmin();
    } else if (!isLoginPage) {
        // Ejecutar funciones visuales solo en el Index
        typeWriterEffect();
        createFloatingParticles();
        initScrollAnimations();
        cargarConfigPublica();
    }

    // ----------------------------------------------------
    // 2. GESTIÓN DEL FORMULARIO DE CONTACTO (INDEX)
    // ----------------------------------------------------
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(event) { 
            event.preventDefault();
            
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');
            const phoneInput = document.getElementById('phone');
            const submitBtn = contactForm.querySelector('button[type="submit"]');

            if (!validateForm(nameInput, emailInput, messageInput)) return;

            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Enviando...';
            submitBtn.disabled = true;

            const formData = {
                name: nameInput.value,
                email: emailInput.value,
                message: messageInput.value,
                phone: phoneInput ? phoneInput.value : null
            };
            
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const result = await response.json();

                if (response.ok) {
                    displayFormMessage('¡Mensaje enviado con éxito!', 'success');
                    contactForm.reset();
                } else {
                    displayFormMessage(result.message || 'Error al enviar', 'error');
                }
            } catch (error) {
                displayFormMessage('Error de conexión con el servidor', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // ----------------------------------------------------
    // 3. FUNCIONES DEL PANEL DE ADMINISTRACIÓN
    // ----------------------------------------------------

    async function cargarConfigAdmin() {
        try {
            const res = await fetch('/api/public/config');
            const data = await res.json();
            if (data) {
                if(document.getElementById('sitio-titulo')) document.getElementById('sitio-titulo').value = data.titulo || '';
                if(document.getElementById('sitio-desc')) document.getElementById('sitio-desc').value = data.descripcion || '';
                if(document.getElementById('sitio-email')) document.getElementById('sitio-email').value = data.email || '';
                if(document.getElementById('sitio-tel')) document.getElementById('sitio-tel').value = data.telefono || '';
            }
        } catch (err) { console.error("Error cargando config admin", err); }
    }

    // Se vincula al botón "Guardar Cambios" en admin.html
    window.guardarConfiguracion = async function() {
        const nuevosDatos = {
            titulo: document.getElementById('sitio-titulo').value,
            descripcion: document.getElementById('sitio-desc').value,
            email: document.getElementById('sitio-email').value,
            telefono: document.getElementById('sitio-tel').value
        };

        try {
            const res = await fetch('/api/manage/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevosDatos)
            });
            const info = await res.json();
            alert(info.mensaje);
        } catch (err) { alert("Error al guardar"); }
    };
    // --- GESTIÓN DE GALERÍA EN EL ADMIN ---

// 1. Cargar y mostrar las imágenes con botón de borrar
async function cargarGaleriaAdmin() {
    const contenedor = document.getElementById('contenedor-galeria');
    if (!contenedor) return;

    try {
        const res = await fetch('/api/public/galeria');
        const imagenes = await res.json();
        
        contenedor.innerHTML = ''; // Limpiamos el contenedor antes de cargar

        imagenes.forEach(imgNombre => {
            const div = document.createElement('div');
            div.className = 'foto-item';
            div.style.cssText = 'position:relative; display:inline-block; margin:10px;';
            
            div.innerHTML = `
                <img src="/galeria/${imgNombre}" style="width:150px; height:150px; object-fit:cover; border-radius:10px; border: 2px solid #f3efb7;">
                <button onclick="borrarImagen('${imgNombre}')" style="position:absolute; top:5px; right:5px; background:#ff4d4d; color:white; border:none; border-radius:50%; width:30px; height:30px; cursor:pointer; font-weight:bold;">
                    X
                </button>
            `;
            contenedor.appendChild(div);
        });
    } catch (err) {
        console.error("Error al cargar galería", err);
    }
}

// 2. Subir nueva imagen
window.subirImagen = async function() {
    const input = document.getElementById('input-galeria');
    if (!input.files[0]) return alert("Por favor, selecciona una imagen primero.");

    const formData = new FormData();
    formData.append('imagen', input.files[0]);

    try {
        const res = await fetch('/api/manage/galeria', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        alert(data.mensaje);
        input.value = ''; // Limpiar el input
        cargarGaleriaAdmin(); // Refrescar la vista
    } catch (err) {
        alert("Error al subir la imagen");
    }
};

// 3. Borrar imagen física del servidor
window.borrarImagen = async function(nombre) {
    if (!confirm("¿Estás seguro de que deseas eliminar esta imagen de forma permanente?")) return;

    try {
        const res = await fetch(`/api/manage/galeria/${nombre}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        alert(data.mensaje);
        cargarGaleriaAdmin(); // Refrescar la vista
    } catch (err) {
        alert("Error al eliminar la imagen");
    }
};

    // ----------------------------------------------------
    // 4. FUNCIONES PÚBLICAS Y ANIMACIONES
    // ----------------------------------------------------

    async function cargarConfigPublica() {
        try {
            const res = await fetch('/api/public/config');
            const data = await res.json();
            // Actualiza elementos del index si existen
            const heroTitle = document.querySelector('.hero h1');
            if (heroTitle && data.titulo) heroTitle.innerText = data.titulo;
        } catch (err) { console.log("Carga pública omitida"); }
    }

    function typeWriterEffect() {
        const title = document.querySelector('.hero h1');
        if (!title) return;
        const text = title.textContent;
        title.textContent = '';
        let i = 0;
        const type = () => {
            if (i < text.length) {
                title.textContent += text.charAt(i);
                i++;
                setTimeout(type, 50);
            }
        };
        setTimeout(type, 1000);
    }

    // Acceso secreto: Doble clic en logo
    const logo = document.getElementById('adminLogoTrigger');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('dblclick', () => window.location.href = 'login.html');
    }

    initSmoothScroll();
});

// --- Utilidades Globales ---
function validateForm(name, email, message) {
    if (name.value.length < 2 || !email.value.includes('@') || message.value.length < 5) {
        alert("Por favor rellena correctamente los campos");
        return false;
    }
    return true;
}

function displayFormMessage(msg, type) {
    const box = document.getElementById('formMessage');
    if (!box) return;
    box.textContent = msg;
    box.className = `form-message ${type}`;
    box.style.display = 'block';
    setTimeout(() => { box.style.display = 'none'; }, 5000);
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
        });
    });
}

function createFloatingParticles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    for (let i = 0; i < 15; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.cssText = `position:absolute; width:4px; height:4px; background:rgba(255,255,255,0.3); left:${Math.random()*100}%; top:${Math.random()*100}%; border-radius:50%; pointer-events:none;`;
        hero.appendChild(p);
    }
}

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.service-item, .blog-post').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
}
// Manejo de pestañas del panel admin
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        // Quitar clase active de todos
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        
        // Añadir active al seleccionado
        this.classList.add('active');
        const sectionId = this.getAttribute('data-section');
        document.getElementById(sectionId).classList.add('active');
        
        // Actualizar el título de la barra superior
        document.getElementById('pageTitle').textContent = this.querySelector('span').textContent;
    });
});


// ============================================
// CARRUSEL DE GALERÍA - OPTIMIZADO PARA MÓVILES
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initCarousel();
});

async function initCarousel() {
    const track = document.getElementById('carouselTrack');
    const indicators = document.getElementById('carouselIndicators');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (!track) return; // No estamos en la página con carrusel
    
    try {
        // Cargar imágenes desde el servidor
        const response = await fetch('/api/public/galeria');
        const images = await response.json();
        
        if (images.length === 0) {
            track.innerHTML = '<div style="text-align:center; padding:50px; color:#666;">No hay imágenes en la galería</div>';
            return;
        }
        
        // Crear slides con lazy loading
        images.forEach((img, index) => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            
            // Usar loading="lazy" para optimizar carga
            const imgElement = document.createElement('img');
            imgElement.src = `/galeria/${img}`;
            imgElement.alt = `Trabajo ${index + 1}`;
            imgElement.loading = index === 0 ? 'eager' : 'lazy'; // Primera imagen carga inmediato
            
            const caption = document.createElement('div');
            caption.className = 'carousel-slide-caption';
            caption.innerHTML = `
                <h3>Proyecto ${index + 1}</h3>
                <p>Trabajo realizado por Guerroa C.A.</p>
            `;
            
            slide.appendChild(imgElement);
            slide.appendChild(caption);
            track.appendChild(slide);
            
            // Crear indicador
            const indicator = document.createElement('button');
            indicator.className = 'carousel-indicator';
            indicator.setAttribute('aria-label', `Ir a imagen ${index + 1}`);
            if (index === 0) indicator.classList.add('active');
            indicator.addEventListener('click', () => goToSlide(index));
            indicators.appendChild(indicator);
        });
        
        let currentSlide = 0;
        const slides = document.querySelectorAll('.carousel-slide');
        const totalSlides = slides.length;
        let isTransitioning = false;
        
        function updateCarousel() {
            if (isTransitioning) return;
            isTransitioning = true;
            
            track.style.transform = `translateX(-${currentSlide * 100}%)`;
            
            // Actualizar indicadores
            document.querySelectorAll('.carousel-indicator').forEach((ind, i) => {
                ind.classList.toggle('active', i === currentSlide);
            });
            
            setTimeout(() => {
                isTransitioning = false;
            }, 500);
        }
        
        function goToSlide(index) {
            if (isTransitioning) return;
            currentSlide = index;
            updateCarousel();
        }
        
        function nextSlide() {
            if (isTransitioning) return;
            currentSlide = (currentSlide + 1) % totalSlides;
            updateCarousel();
        }
        
        function prevSlide() {
            if (isTransitioning) return;
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateCarousel();
        }
        
        // Event listeners con debounce
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
        
        // Auto-play solo en desktop
        let autoplayInterval = null;
        const isMobile = window.innerWidth <= 768;
        
        if (!isMobile) {
            autoplayInterval = setInterval(nextSlide, 5000);
        }
        
        // Pausar autoplay al hover (solo desktop)
        const carouselContainer = document.querySelector('.carousel-container');
        if (carouselContainer && !isMobile) {
            carouselContainer.addEventListener('mouseenter', () => {
                if (autoplayInterval) clearInterval(autoplayInterval);
            });
            
            carouselContainer.addEventListener('mouseleave', () => {
                autoplayInterval = setInterval(nextSlide, 5000);
            });
        }
        
        // Soporte para gestos táctiles (móvil) - OPTIMIZADO
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartTime = 0;
        
        track.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartTime = Date.now();
        }, { passive: true });
        
        track.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const touchDuration = Date.now() - touchStartTime;
            
            // Solo procesar swipes rápidos (menos de 300ms)
            if (touchDuration < 300) {
                handleSwipe();
            }
        }, { passive: true });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
        }
        
        // Soporte para teclado (solo desktop)
        if (!isMobile) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') prevSlide();
                if (e.key === 'ArrowRight') nextSlide();
            });
        }
        
        // Limpiar interval al salir de la página
        window.addEventListener('beforeunload', () => {
            if (autoplayInterval) clearInterval(autoplayInterval);
        });
        
    } catch (error) {
        console.error('Error al cargar el carrusel:', error);
        track.innerHTML = '<div style="text-align:center; padding:50px; color:#666;">Error al cargar las imágenes</div>';
    }
}
