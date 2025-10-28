// main.js - Versión con Neon Database (via Backend API)

// URL del backend - cambia esto si tu servidor está en otro puerto o dominio
const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initMobileMenu();
    initSmoothScroll();
    initHeaderScroll();
    initContactForm();
});

function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');

    const revealOnScroll = () => {
        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (elementTop < windowHeight - 100) {
                element.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();
}

function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const nav = document.getElementById('nav');

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');
        nav.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('active');
            nav.classList.remove('active');
        });
    });

    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            mobileMenuBtn.classList.remove('active');
            nav.classList.remove('active');
        }
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initHeaderScroll() {
    const header = document.getElementById('header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });
}

function initContactForm() {
    const form = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Enviando...';
        submitButton.disabled = true;

        const formData = {
            name: form.name.value.trim(),
            email: form.email.value.trim(),
            message: form.message.value.trim()
        };

        // Validación en el frontend
        if (!formData.name || !formData.email || !formData.message) {
            showFormMessage('Por favor completa todos los campos.', 'error');
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            return;
        }

        if (!isValidEmail(formData.email)) {
            showFormMessage('Por favor ingresa un email válido.', 'error');
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            return;
        }

        if (formData.message.length < 10) {
            showFormMessage('El mensaje debe tener al menos 10 caracteres.', 'error');
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            return;
        }

        try {
            // Enviar datos a la API backend
            const response = await fetch(`${API_URL}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showFormMessage(
                    data.message || '¡Mensaje enviado exitosamente! Te contactaremos pronto.', 
                    'success'
                );
                form.reset();

                // Ocultar mensaje después de 5 segundos
                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 5000);

            } else {
                showFormMessage(
                    data.error || 'Hubo un error al enviar el mensaje. Por favor intenta nuevamente.', 
                    'error'
                );
            }

        } catch (error) {
            console.error('Error al enviar el formulario:', error);
            
            // Mensaje específico si no se puede conectar al servidor
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                showFormMessage(
                    'No se pudo conectar con el servidor. Asegúrate de que el backend esté corriendo en ' + API_URL, 
                    'error'
                );
            } else {
                showFormMessage(
                    'Hubo un error al enviar el mensaje. Por favor intenta nuevamente.', 
                    'error'
                );
            }
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });
}

function showFormMessage(message, type) {
    const formMessage = document.getElementById('formMessage');
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Intersection Observer para animaciones
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal').forEach(element => {
    observer.observe(element);
});

// Animaciones de tarjetas de servicio
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });

    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Animación de fade-in al scroll
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.fade-in-up');
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if (elementTop < windowHeight - 100) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
};

window.addEventListener('scroll', animateOnScroll);
animateOnScroll();