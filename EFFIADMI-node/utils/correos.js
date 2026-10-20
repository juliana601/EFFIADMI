// ============================================================
// Correos - envio de correos SMTP con Nodemailer
// (equivalente a utilidades/enviar_correo en la version Django
// de referencia, pero usando variables de entorno SMTP).
// Si no hay configuracion SMTP, degrada a "modo simulacion"
// guardando el correo en la base de datos (CorreoEnviado).
// ============================================================
const nodemailer = require('nodemailer');
const CorreoEnviado = require('../models/CorreoEnviado');

const _obtenerTransporter = () => {
    if (!process.env.SMTP_HOST) return null;
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

const _correoDesdeCreadoPor = async (creadoPor) => {
    if (!creadoPor) return { rol: 'custom', nombre: 'EFFIADMI' };
    try {
        const User = require('../models/User');
        const usuario = await User.findById(creadoPor).lean();
        if (usuario) return { rol: usuario.rol, nombre: usuario.nombre };
    } catch (_) {
        // ignorar
    }
    return { rol: 'custom', nombre: 'EFFIADMI' };
};

// Envia un correo y lo registra en la BD.
// adjuntos: opcional, arreglo de { filename, path } para archivos adjuntos.
// Devuelve { exito, correo, simulacion }
const enviarCorreo = async ({ para, asunto, cuerpo, tipo = 'custom', creadoPor = null, adjuntos = null }) => {
    const correo = await CorreoEnviado.create({
        para,
        asunto,
        cuerpo,
        tipo,
        creadoPor,
    });

    const transporte = _obtenerTransporter();
    if (!transporte) {
        // MODO SIMULACION: no hay SMTP configurado, el correo queda registrado.
        await CorreoEnviado.findByIdAndUpdate(correo._id, { $set: { simulacion: true } });
        return { exito: true, simulacion: true, correo };
    }

    try {
        const opcionesCorreo = {
            from: `"${process.env.SMTP_FROM_NOMBRE || 'EFFIADMI'}" <${process.env.SMTP_USER}>`,
            to: para,
            subject: asunto,
            text: cuerpo,
        };
        if (adjuntos && adjuntos.length > 0) {
            opcionesCorreo.attachments = adjuntos;
        }
        await transporte.sendMail(opcionesCorreo);
        await CorreoEnviado.findByIdAndUpdate(correo._id, { $set: { enviadoReal: true } });
        return { exito: true, simulacion: false, correo };
    } catch (error) {
        await CorreoEnviado.findByIdAndUpdate(correo._id, { $set: { errorEnvio: error.message } });
        return { exito: false, simulacion: false, correo, error: error.message };
    }
};

module.exports = { enviarCorreo };
