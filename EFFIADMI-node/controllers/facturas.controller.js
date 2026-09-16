const Factura = require('../models/Factura');
const FacturaDetalle = require('../models/FacturaDetalle');
const { crearNotificacion, idsAdmins } = require('../utils/notificaciones');

// ==================== LISTAR ====================
const listaFacturas = async (req, res) => {
    try {
        const estado = req.query.estado || '';
        const filtro = {};
        if (estado === 'emitida') filtro.estado = 'emitida';
        else if (estado === 'anulada') filtro.estado = 'anulada';

        const facturas = await Factura.find(filtro)
            .populate('cliente', 'nombre')
            .populate('pedido', 'numero')
            .sort({ createdAt: -1 });

        res.render('facturas/lista', {
            titulo: 'Facturas',
            facturas,
            filtroEstado: estado,
            rutaActiva: 'facturas',
        });
    } catch (error) {
        req.flash('error', `Error al listar facturas: ${error.message}`);
        return res.redirect('/auth/dashboard');
    }
};

// ==================== DETALLE ====================
const detalleFactura = async (req, res) => {
    try {
        const factura = await Factura.findById(req.params.id)
            .populate('cliente', 'nombre correo telefono')
            .populate('usuario', 'username nombre apellido')
            .populate('pedido', 'numero');

        if (!factura) {
            req.flash('error', 'Factura no encontrada.');
            return res.redirect('/facturas');
        }

        const detalles = await FacturaDetalle.find({ factura: factura._id }).populate('producto', 'nombre');

        res.render('facturas/detalle', {
            titulo: 'Detalle de Factura',
            factura,
            detalles,
            rutaActiva: 'facturas',
        });
    } catch (error) {
        req.flash('error', `Error al cargar la factura: ${error.message}`);
        return res.redirect('/facturas');
    }
};

// ==================== ANULAR ====================
const anularFactura = async (req, res) => {
    try {
        const factura = await Factura.findById(req.params.id);
        if (!factura) {
            req.flash('error', 'Factura no encontrada.');
            return res.redirect('/facturas');
        }

        if (req.method !== 'POST') {
            return res.redirect(`/facturas/${factura._id}/`);
        }

        if (factura.estado === 'anulada') {
            req.flash('warning', 'La factura ya está anulada.');
            return res.redirect(`/facturas/${factura._id}/`);
        }

        factura.estado = 'anulada';
        await factura.save();

        await crearNotificacion(
            await idsAdmins(),
            `Factura #${factura.numero} anulada (cliente: ${req.session.logueado.nombre || ''}).`,
            `facturas/${factura._id}/`
        );

        req.flash('success', `Factura #${factura.numero} anulada.`);
        return res.redirect(`/facturas/${factura._id}/`);
    } catch (error) {
        req.flash('error', `Error al anular la factura: ${error.message}`);
        return res.redirect('/facturas');
    }
};

// ==================== ELIMINAR (anula si está emitida) ====================
const eliminarFactura = async (req, res) => {
    try {
        const factura = await Factura.findById(req.params.id);
        if (!factura) {
            req.flash('error', 'Factura no encontrada.');
            return res.redirect('/facturas');
        }

        if (req.method !== 'POST') {
            return res.redirect(`/facturas/${factura._id}/`);
        }

        if (factura.estado === 'emitida') {
            factura.estado = 'anulada';
            await factura.save();
            req.flash('success', `Factura #${factura.numero} anulada.`);
        } else {
            req.flash('warning', 'La factura ya está anulada.');
        }
        return res.redirect('/facturas');
    } catch (error) {
        req.flash('error', `Error al eliminar la factura: ${error.message}`);
        return res.redirect('/facturas');
    }
};

// ==================== EDITAR (no aplica) ====================
const editarFactura = async (req, res) => {
    req.flash('warning', 'Las facturas emitidas no se pueden editar. Anule y genere una nueva.');
    return res.redirect(`/facturas/${req.params.id}/`);
};

// ==================== API (JSON) ====================
const apiListarFacturas = async (req, res) => {
    try {
        const facturas = await Factura.find()
            .populate('cliente', 'nombre')
            .populate('pedido', 'numero')
            .sort({ createdAt: -1 });
        return res.json({ success: true, data: facturas });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

const apiDetalleFactura = async (req, res) => {
    try {
        const factura = await Factura.findById(req.params.id)
            .populate('cliente', 'nombre correo telefono')
            .populate('usuario', 'username nombre apellido')
            .populate('pedido', 'numero');
        if (!factura) {
            return res.status(404).json({ success: false, message: 'Factura no encontrada.' });
        }
        const detalles = await FacturaDetalle.find({ factura: factura._id }).populate('producto', 'nombre');
        return res.json({ success: true, data: { factura, detalles } });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

module.exports = {
    listaFacturas,
    detalleFactura,
    anularFactura,
    eliminarFactura,
    editarFactura,
    apiListarFacturas,
    apiDetalleFactura,
};