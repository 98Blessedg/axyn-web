// server.js - Versión con notificaciones por email (Resend)
import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar Resend (servicio de email)
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Función para enviar email de notificación
async function sendEmailNotification(formData) {
    try {
        const emailContent = {
            from: process.env.EMAIL_FROM || 'Axyn Services <onboarding@resend.dev>',
            to: process.env.EMAIL_TO || 'tu-email@ejemplo.com',
            subject: `🔔 Nuevo mensaje de contacto de ${formData.name}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                            color: #FFD700;
                            padding: 30px;
                            border-radius: 10px 10px 0 0;
                            text-align: center;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 24px;
                        }
                        .content {
                            background: #f9f9f9;
                            padding: 30px;
                            border-radius: 0 0 10px 10px;
                        }
                        .field {
                            margin-bottom: 20px;
                            padding: 15px;
                            background: white;
                            border-radius: 8px;
                            border-left: 4px solid #FFD700;
                        }
                        .field-label {
                            font-weight: bold;
                            color: #666;
                            font-size: 12px;
                            text-transform: uppercase;
                            margin-bottom: 5px;
                        }
                        .field-value {
                            color: #333;
                            font-size: 16px;
                        }
                        .message-box {
                            background: white;
                            padding: 20px;
                            border-radius: 8px;
                            border: 1px solid #e0e0e0;
                            margin-top: 10px;
                            white-space: pre-wrap;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #e0e0e0;
                            color: #666;
                            font-size: 12px;
                        }
                        .btn {
                            display: inline-block;
                            padding: 12px 30px;
                            background: #FFD700;
                            color: #1a1a1a;
                            text-decoration: none;
                            border-radius: 5px;
                            font-weight: bold;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>⭐ Nuevo Mensaje de Contacto</h1>
                    </div>
                    
                    <div class="content">
                        <div class="field">
                            <div class="field-label">Nombre</div>
                            <div class="field-value">${formData.name}</div>
                        </div>
                        
                        <div class="field">
                            <div class="field-label">Email</div>
                            <div class="field-value">
                                <a href="mailto:${formData.email}" style="color: #FFD700;">${formData.email}</a>
                            </div>
                        </div>
                        
                        <div class="field">
                            <div class="field-label">Mensaje</div>
                            <div class="message-box">${formData.message}</div>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="mailto:${formData.email}" class="btn">Responder a ${formData.name}</a>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Este mensaje fue enviado desde el formulario de contacto de Axyn Services</p>
                        <p>Fecha: ${new Date().toLocaleString('es-ES', { 
                            dateStyle: 'full', 
                            timeStyle: 'short' 
                        })}</p>
                    </div>
                </body>
                </html>
            `,
        };

        const result = await resend.emails.send(emailContent);
        console.log('✅ Email enviado:', result);
        return result;
    } catch (error) {
        console.error('❌ Error al enviar email:', error);
        throw error;
    }
}

// Endpoint principal para el formulario de contacto
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Validación de campos requeridos
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos son requeridos'
            });
        }

        // Validar longitud de campos
        if (name.length < 2 || name.length > 100) {
            return res.status(400).json({
                success: false,
                error: 'El nombre debe tener entre 2 y 100 caracteres'
            });
        }

        if (message.length < 10 || message.length > 1000) {
            return res.status(400).json({
                success: false,
                error: 'El mensaje debe tener entre 10 y 1000 caracteres'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Por favor ingresa un email válido'
            });
        }

        // Verificar que existe la variable de entorno
        if (!process.env.VITE_NEON_DATABASE_URL) {
            console.error('Error: VITE_NEON_DATABASE_URL no está configurado');
            return res.status(500).json({
                success: false,
                error: 'Error de configuración del servidor'
            });
        }

        // Conectar a Neon Database
        const sql = neon(process.env.VITE_NEON_DATABASE_URL);

        // Insertar en la base de datos
        const result = await sql`
            INSERT INTO contact_submissions (name, email, message)
            VALUES (${name.trim()}, ${email.trim().toLowerCase()}, ${message.trim()})
            RETURNING id, name, email, created_at
        `;

        console.log('✅ Mensaje guardado en BD:', result[0].id);

        // Enviar notificación por email
        try {
            await sendEmailNotification({
                name: name.trim(),
                email: email.trim(),
                message: message.trim()
            });
            console.log('✅ Notificación por email enviada');
        } catch (emailError) {
            // Si falla el email, aún así guardamos en BD
            console.error('⚠️ Error al enviar email (pero mensaje guardado):', emailError);
        }

        // Responder con éxito
        res.status(201).json({
            success: true,
            message: '¡Mensaje enviado exitosamente! Te contactaremos pronto.',
            data: {
                id: result[0].id,
                created_at: result[0].created_at
            }
        });

    } catch (error) {
        console.error('❌ Error al procesar el formulario:', error);
        
        // Manejar errores específicos de la base de datos
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                error: 'Este mensaje ya fue enviado'
            });
        }

        // Error genérico
        res.status(500).json({
            success: false,
            error: 'Hubo un error al enviar el mensaje. Por favor intenta nuevamente.'
        });
    }
});

// Endpoint para obtener estadísticas (opcional - solo para admin)
app.get('/api/stats', async (req, res) => {
    try {
        const sql = neon(process.env.VITE_NEON_DATABASE_URL);

        const stats = await sql`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed,
                COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted,
                COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today
            FROM contact_submissions
        `;

        res.json({
            success: true,
            stats: stats[0]
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada'
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('');
    console.log('🚀 Servidor iniciado exitosamente');
    console.log(`📡 Escuchando en: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`📮 API Contact: http://localhost:${PORT}/api/contact`);
    console.log(`📧 Email notifications: ${process.env.RESEND_API_KEY ? '✅ Configuradas' : '❌ No configuradas'}`);
    console.log('');
    console.log('✅ Presiona Ctrl+C para detener el servidor');
    console.log('');
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
    console.log('\n\n👋 Cerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 Cerrando servidor...');
    process.exit(0);
});