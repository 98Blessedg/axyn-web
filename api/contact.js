// api/contact.js
// Este archivo debe estar en una carpeta /api en tu proyecto

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Solo permitir POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, message } = req.body;

    // Validación básica
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Conectar a Neon
    const sql = neon(process.env.VITE_NEON_DATABASE_URL);

    // Insertar en la base de datos
    const result = await sql`
      INSERT INTO contact_submissions (name, email, message)
      VALUES (${name}, ${email}, ${message})
      RETURNING id, created_at
    `;

    return res.status(200).json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      data: result[0]
    });

  } catch (error) {
    console.error('Error al procesar el formulario:', error);
    return res.status(500).json({
      error: 'Error al procesar el mensaje. Por favor intenta nuevamente.'
    });
  }
}
