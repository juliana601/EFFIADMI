const ChatHistorial = require('../models/ChatHistorial');
const { consultarAsistenteEFFIADMI } = require('../utils/servicio_ia');

// ==================== RENDER VISTA + HISTORIAL ====================
const renderChat = async (req, res) => {
    try {
        const historial = await ChatHistorial.find({
            usuario: req.session.logueado ? req.session.logueado.id : null,
        })
            .sort({ createdAt: -1 })
            .limit(50);

        return res.render('chatIA/index', {
            titulo: 'Asistente EFFI',
            historial: historial.reverse(),
            rutaActiva: 'chatIA',
            messages: req.flash(),
        });
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        return res.redirect('/chat-ia');
    }
};

// ==================== ENVIAR MENSAJE ====================
const enviarMensaje = async (req, res) => {
    const mensajeUsuario = (req.body.mensaje || '').trim();
    if (!mensajeUsuario) {
        req.flash('error', 'Escribe un mensaje para el asistente.');
        return res.redirect('/chat-ia');
    }
    try {
        const respuestaIA = await consultarAsistenteEFFIADMI(mensajeUsuario, {
            usuarioId: req.session.logueado ? req.session.logueado.id : null,
        });

        await ChatHistorial.create({
            usuario: req.session.logueado ? req.session.logueado.id : null,
            mensajeUsuario,
            respuestaIA: respuestaIA || 'No pude procesar tu consulta.',
        });
        req.flash('success', 'Mensaje enviado al asistente.');
    } catch (error) {
        req.flash('error', 'Error al consultar el asistente: ' + error.message);
    }
    return res.redirect('/chat-ia');
};

// ==================== BORRAR HISTORIAL ====================
const borrarHistorial = async (req, res) => {
    try {
        await ChatHistorial.deleteMany({
            usuario: req.session.logueado ? req.session.logueado.id : null,
        });
        req.flash('success', 'Historial de conversacion borrado.');
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
    }
    return res.redirect('/chat-ia');
};

module.exports = { renderChat, enviarMensaje, borrarHistorial };
