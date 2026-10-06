// ============================================================
// Controllers de Correos
// Gestión del módulo de correos (enviar mediante utils/correos.js
// con Nodemailer SMTP, consultar, marcar leído, eliminar).
// ============================================================
const CorreoEnviado = require('../models/CorreoEnviado');
const { enviarCorreo } = require('../utils/correos');

// ==================== LISTAR (Vista) ====================
const listaCorreos = async (req, res) => {
    try {
        const { estado } = req.query;
        const filtro = {};
        if (estado === 'noLeido') filtro.leido = false;
        else if (estado === 'leido') filtro.leido = true;

        const [correos, noLeidos] = await Promise.all([
            CorreoEnviado.find(filtro)
                .populate('creadoPor', 'nombre email')
                .sort({ createdAt: -1 })
                .limit(200),
            CorreoEnviado.countDocuments({ leido: false }),
        ]);

        return res.render('correos/lista', {
            titulo: 'Correos enviados',
            correos,
            noLeidos,
            filtroEstado: estado || '',
            rutaActiva: 'correos',
        });
    } catch (error) {
        req.flash('error', `Error al listar correos: ${error.message}`);
        return res.redirect('/auth/dashboard');
    }
};

// ==================== VISTA ENVIAR ====================
const renderEnviarCorreo = (req, res) => {
    return res.render('correos/enviar', {
        titulo: 'Enviar correo',
        rutaActiva: 'correos',
    });
};

// ==================== ENVIAR (POST) ====================
const enviarCorreoHandler = async (req, res) => {
    try {
        const para = (req.body.para || '').trim();
        const asunto = (req.body.asunto || '').trim();
        const cuerpo = (req.body.cuerpo || '').trim();

        if (!para || !asunto || !cuerpo) {
            req.flash('error', 'Todos los campos son obligatorios (para, asunto, cuerpo).');
            return res.redirect('/correos/enviar');
        }

        const resultado = await enviarCorreo({
            para,
            asunto,
            cuerpo,
            creadoPor: req.session.logueado ? req.session.logueado.id : null,
        });

        if (resultado.exito) {
            if (resultado.simulacion) {
                req.flash('warning', 'Correo registrado en modo simulación (sin SMTP configurado).');
            } else {
                req.flash('success', 'Correo enviado exitosamente.');
            }
            return res.redirect('/correos');
        }
        req.flash('error', `Error al enviar el correo: ${resultado.error || 'error desconocido'}`);
        return res.redirect('/correos/enviar');
    } catch (error) {
        req.flash('error', `Error al enviar el correo: ${error.message}`);
        return res.redirect('/correos/enviar');
    }
};

// ==================== MARCAR COMO LEÍDO ====================
const marcarLeido = async (req, res) => {
    try {
        await CorreoEnviado.findByIdAndUpdate(req.params.id, { $set: { leido: true } });
        req.flash('success', 'Correo marcado como leído.');
    } catch (error) {
        req.flash('error', `Error: ${error.message}`);
    }
    return res.redirect('/correos');
};

// ==================== ELIMINAR ====================
const eliminarCorreo = async (req, res) => {
    try {
        await CorreoEnviado.findByIdAndDelete(req.params.id);
        req.flash('success', 'Correo eliminado.');
    } catch (error) {
        req.flash('error', `Error: ${error.message}`);
    }
    return res.redirect('/correos');
};

module.exports = {
    listaCorreos,
    renderEnviarCorreo,
    enviarCorreoHandler,
    marcarLeido,
    eliminarCorreo,
};
