document.addEventListener('DOMContentLoaded', function() {
    // 1. Manejo del formulario de contacto
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');

    if (contactForm) { // Asegurarse de que el formulario existe antes de añadir el evento
        contactForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Evita que el formulario se envíe de la forma tradicional (recargue la página)

            // Validación básica (ya tenemos el 'required' en HTML, esto es adicional)
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();

            if (name === '' || email === '' || message === '') {
                displayFormMessage('Por favor, completa todos los campos.', 'error');
                return; // Detiene la función si hay campos vacíos
            }

            // Validación de email simple (regex básico)
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                displayFormMessage('Por favor, introduce un correo electrónico válido.', 'error');
                return;
            }

            // Si la validación es exitosa, simular envío
            displayFormMessage('¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.', 'success');
            contactForm.reset(); // Limpia los campos del formulario

            // En un entorno real, aquí enviarías los datos a un servidor usando Fetch API o XMLHttpRequest.
            // Ejemplo (descomenta para ver la estructura, NO funcionará sin un backend real):
            /*
            fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, message }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayFormMessage('¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.', 'success');
                    contactForm.reset();
                } else {
                    displayFormMessage('Hubo un error al enviar tu mensaje. Intenta de nuevo.', 'error');
                }
            })
            .catch((error) => {
                console.error('Error:', error);
                displayFormMessage('Error de conexión. Intenta de nuevo más tarde.', 'error');
            });
            */
        });
    }

    // Función para mostrar mensajes del formulario
    function displayFormMessage(msg, type) {
        formMessage.textContent = msg; // Establece el texto del mensaje
        formMessage.className = 'form-message'; // Reinicia las clases
        formMessage.classList.add(type); // Añade la clase 'success' o 'error'
        formMessage.style.display = 'block'; // Hace visible el mensaje

        // Ocultar el mensaje después de unos segundos
        setTimeout(() => {
            formMessage.style.display = 'none';
            formMessage.textContent = '';
            formMessage.classList.remove(type);
        }, 5000); // 5 segundos
    }

    // 2. Desplazamiento suave (Smooth Scrolling)
    // Esto hace que, al hacer clic en los enlaces de la navegación, la página se desplace suavemente
    // hasta la sección en lugar de saltar instantáneamente.
    document.querySelectorAll('nav ul li a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault(); // Evita el comportamiento predeterminado del enlace

            const targetId = this.getAttribute('href'); // Obtiene el ID de la sección (ej. #inicio)
            const targetElement = document.querySelector(targetId); // Selecciona el elemento con ese ID

            if (targetElement) {
                // `behavior: 'smooth'` hace el efecto de desplazamiento suave
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // 3. Efecto de botones al pasar el cursor (YA IMPLEMENTADO EN CSS)
    // El efecto visual de los botones que se mueven al pasar el cursor ya se maneja
    // completamente con CSS (`transform: translateY` y `box-shadow` en `:hover`).
    // JavaScript no es necesario para este efecto en particular.

    // 4. Pequeña animación para la galería al cargar la página (opcional)
    // Añade una clase 'loaded' a las imágenes después de que la página cargue
    // para poder aplicar una animación de entrada con CSS si se desea.
    const galleryImages = document.querySelectorAll('.gallery-grid img');
    galleryImages.forEach((img, index) => {
        img.style.opacity = '0'; // Oculta las imágenes inicialmente
        img.style.transform = 'translateY(20px)'; // Las desplaza un poco hacia abajo
        img.style.transition = 'opacity 0.6s ease-out ' + (index * 0.1) + 's, transform 0.6s ease-out ' + (index * 0.1) + 's';

        // Una vez cargadas, hazlas aparecer con un pequeño retraso
        setTimeout(() => {
            img.style.opacity = '1';
            img.style.transform = 'translateY(0)';
        }, 100 + (index * 100)); // Retraso progresivo para cada imagen
    });
});
document.addEventListener('DOMContentLoaded', function() {
    // ... (Tu código JavaScript existente) ...

    // NUEVO CÓDIGO PARA EXPANDIR/CONTRAER LOS ARTÍCULOS DEL BLOG
    const blogReadMoreButtons = document.querySelectorAll('.blog-post .btn-small');

    blogReadMoreButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault(); // Evita que el enlace salte a #

            const blogPostArticle = this.closest('.blog-post'); // Encuentra el <article> padre
            const contentWrapper = blogPostArticle.querySelector('.blog-content-wrapper'); // Encuentra el envoltorio de contenido

            if (contentWrapper) {
                // Alterna la clase 'expanded'
                contentWrapper.classList.toggle('expanded');

                // Cambia el texto del botón
                if (contentWrapper.classList.contains('expanded')) {
                    this.textContent = 'Ver Menos';
                } else {
                    this.textContent = 'Leer Más';
                }
            }
        });
    });
});
