const Notificacion = require('../models/Notificacion');
const { crearNotificacion, idsAdmins } = require('../utils/notificaciones');

// ==================== LISTAR (Vista) ====================
const listaNotificaciones = async (req, res) => {
    try {
        const filtro = { usuario: req.session.logueado.id };
        const estado = req.query.estado || '';
        if (estado === 'noLeidas') filtro.leido = false   ;
        else if (estado === 'leidas') filtro.leido = true;

        const [notificaciones, noLeidas] = await Promise.all([
            Notificacion.find(filtro).sort({ createdAt: -1 }).limit(200),
            Notificacion.countDocuments({ usuario: req.session.logueado.id, leido: false }),
        ]);

        return res.render('notificaciones/lista', {
            titulo: 'Notificaciones',
            notificaciones,
            noLeidas,
            filtroEstado: estado,
            rutaActiva: 'notificaciones',
        });
    } catch (error) {
        req.flash('error', `Error al listar notificaciones: ${error.message}`);
        return res.redirect('/auth/dashboard');
    }
};

// ==================== MARCAR COMO LEÃÍDA ====================
const marcarLeida = async (req, res) => {
    try {
        await Notificacion.findOneAndUpdate(
            { _id: req.params.id, usuario: req.session.logueado.id },
            { $set: { leido: true } }
        );
        req.flash('success', 'Notificación marcada como leída.');
    } catch (error) {
        req.flash('error', `Error: ${error.message}`);
    }
    return res.redirect('/notificaciones');
};

// ==================== MARCAR TODAS COMO LEÃÍDAS ====================
const marcarTodasLeidas = async (req, res) => {
    try {
        await Notificacion.updateMany(
            { usuario: req.session.logueado.id, leido: false },
            { $set: { leido: true } }
        );
        req.flash('success', 'Todas las notificaciones fueron marcadas como leídas.');
    } catch (error) {
        req.flash('error', `Error: ${error.message}`);
    }
    return res.redirect('/notificaciones');
};

// ==================== ELIMINAR (POST) ====================
const eliminarNotificacion = async (req, res) => {
    try {
        await Notificacion.findOneAndDelete({ _id: req.params.id, usuario: req.session.logueado.id });
        req.flash('success', 'Notificación eliminada.');
    } catch (error) {
        req.flash('error', `Error: ${error.message}`);
    }
    return res.redirect('/notificaciones');
};

// ==================== API: CONTADOR NO LEÃÍDAS (badge sidebar) ====================
const apiContadorNoLeidas = async (req, res) => {
    try {
        const count = await Notificacion.countDocuments({ usuario: req.session.logueado.id, leido: false });
        return res.json({ success: true, count });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

module.exports = {
    listaNotificaciones,
    marcarLeida,
    marcarTodasLeidas,
    eliminarNotificacion,
    apiContadorNoLeidas,
};
