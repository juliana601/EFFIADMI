const Reporte = require('../models/Reporte');
const { crearNotificacion, idsAdmins } = require('../utils/notificaciones');

const TIPOS = {
    solicitud_producto: 'Solicitud de Producto',
    solicitud_proveedor: 'Solicitud de Proveedor',
    reporte_stock: 'Reporte de Stock',
    reporte_general: 'Reporte General',
};

const ESTADOS = {
    pendiente: 'Pendiente',
    visto: 'Visto',
    resuelto: 'Resuelto',
};

const esAdmin = (req) => req.session.logueado && req.session.logueado.rol === 'admin';

// ==================== LISTAR + CREAR ====================
const listaReportes = async (req, res) => {
    try {
        const admin = esAdmin(req);
        const filtroEstado = (req.query.estado || '').trim();

        const query = admin ? {} : { usuario: req.session.logueado.id };
        if (['pendiente', 'visto', 'resuelto'].includes(filtroEstado)) {
            query.estado = filtroEstado;
        }

        // Visto: el admin solo ve pendientes sin estados "resueltos" en el listado
        const reportes = await Reporte.find(query)
            .populate('usuario', 'username email nombre apellido')
            .sort({ createdAt: -1 });

        res.render('reportes/lista', {
            titulo: 'Reportes',
            rutaActiva: 'reportes',
            reportes,
            esAdmin: admin,
            filtroEstado,
            tipos: TIPOS,
            estados: ESTADOS,
        });
    } catch (error) {
        req.flash('error', `Error al listar reportes: ${error.message}`);
        return res.redirect('/auth/dashboard');
    }
};

const crearReporte = async (req, res) => {
    try {
        const titulo = (req.body.titulo || '').trim();
        const tipo = req.body.tipo || 'reporte_general';
        const descripcion = (req.body.descripcion || '').trim();

        if (!titulo || !descripcion) {
            req.flash('error', 'Debes completar el título y la descripción.');
            return res.redirect('/reportes');
        }

        if (!TIPOS[tipo]) {
            req.flash('error', 'Tipo de reporte inválido.');
            return res.redirect('/reportes');
        }

        const reporte = await Reporte.create({
            usuario: req.session.logueado.id,
            tipo,
            titulo,
            descripcion,
        });

        const usuario = req.session.logueado;
        const nombreOperador = (usuario.nombre || '') + ' ' + (usuario.apellido || '');
        await crearNotificacion(
            await idsAdmins(),
            `Nuevo reporte de ${(nombreOperador.trim() || usuario.username)}: ${titulo}.`,
            `reportes/${reporte._id}/`
        );

        req.flash('success', 'Reporte enviado exitosamente.');
        return res.redirect('/reportes');
    } catch (error) {
        req.flash('error', `Error al crear el reporte: ${error.message}`);
        return res.redirect('/reportes');
    }
};

// ==================== DETALLE + RESPONDER ====================
const detalleReporte = async (req, res) => {
    try {
        const admin = esAdmin(req);
        const reporte = await Reporte.findById(req.params.id).populate('usuario', 'username email nombre apellido');

        if (!reporte) {
            req.flash('error', 'Reporte no encontrado.');
            return res.redirect('/reportes');
        }

        // Operador solo ve sus propios reportes
        if (!admin && reporte.usuario._id.toString() !== req.session.logueado.id) {
            req.flash('warning', 'No tienes acceso a este reporte.');
            return res.redirect('/reportes');
        }

        if (req.method === 'POST') {
            if (!admin) {
                req.flash('warning', 'Solo los administradores pueden responder reportes.');
                return res.redirect(`/reportes/${reporte._id}/`);
            }

            const respuesta = (req.body.respuesta || '').trim();
            const nuevoEstado = req.body.estado || reporte.estado;
            if (!['pendiente', 'visto', 'resuelto'].includes(nuevoEstado)) {
                req.flash('error', 'Estado inválido.');
                return res.redirect(`/reportes/${reporte._id}/`);
            }

            if (respuesta) reporte.respuesta = respuesta;
            reporte.estado = nuevoEstado;
            reporte.fecha_respuesta = new Date();
            await reporte.save();

            const sesion = req.session.logueado;
            const nombreAdmin = ((sesion.nombre || '') + ' ' + (sesion.apellido || '')).trim() || sesion.username || 'Administrador';
            await crearNotificacion(
                [reporte.usuario._id],
                `Tu reporte '${reporte.titulo}' fue respondido por ${nombreAdmin}.`,
                `reportes/${reporte._id}/`
            );

            req.flash('success', 'Reporte actualizado exitosamente.');
            return res.redirect(`/reportes/${reporte._id}/`);
        }

        // Cuando un admin ve un pendiente, pasa a "visto"
        if (admin && reporte.estado === 'pendiente') {
            reporte.estado = 'visto';
            await reporte.save();
        }

        res.render('reportes/detalle', {
            titulo: `Reporte: ${reporte.titulo}`,
            rutaActiva: 'reportes',
            reporte,
            esAdmin: admin,
            tipos: TIPOS,
            estados: ESTADOS,
        });
    } catch (error) {
        req.flash('error', `Error al cargar el reporte: ${error.message}`);
        return res.redirect('/reportes');
    }
};

// ==================== API (JSON) ====================
const apiListarReportes = async (req, res) => {
    try {
        const admin = esAdmin(req);
        const query = admin ? {} : { usuario: req.session.logueado.id };
        const reportes = await Reporte.find(query)
            .populate('usuario', 'username email nombre apellido')
            .sort({ createdAt: -1 });
        return res.json({ success: true, data: reportes });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

module.exports = {
    listaReportes,
    crearReporte,
    detalleReporte,
    apiListarReportes,
};