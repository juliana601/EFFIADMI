const Cliente = require('../models/Cliente');
const Product = require('../models/Product');
const Pedido = require('../models/Pedido');
const PedidoDetalle = require('../models/PedidoDetalle');
const Factura = require('../models/Factura');
const FacturaDetalle = require('../models/FacturaDetalle');
const Inventory = require('../models/Inventory');
const InventoryLog = require('../models/InventoryLog');
const Branch = require('../models/Branch');
const { crearNotificacion, idsAdmins, notificarStockBajo } = require('../utils/notificaciones');

// ==================== UTILIDAD ====================
const siguienteNumero = async (modelo) => {
    const ultimo = await modelo.findOne().sort({ numero: -1 }).select('numero');
    return (ultimo && ultimo.numero ? ultimo.numero : 0) + 1;
};

// ==================== LISTAR ====================
const listaPedidos = async (req, res) => {
    try {
        const pedidos = await Pedido.find()
            .populate('cliente', 'nombre correo')
            .sort({ createdAt: -1 });

        res.render('pedidos/lista', {
            titulo: 'Pedidos',
            pedidos,
            rutaActiva: 'pedidos',
        });
    } catch (error) {
        req.flash('error', `Error al listar pedidos: ${error.message}`);
        return res.redirect('/auth/dashboard');
    }
};

// ==================== CREAR (Vista) ====================
const renderCrearPedido = async (req, res) => {
    try {
        const clientes = await Cliente.find({ activo: true }).sort({ nombre: 1 });
        const productos = await Product.find({ activo: true })
            .select('nombre precio_venta')
            .sort({ nombre: 1 });

        res.render('pedidos/crear', {
            titulo: 'Crear Pedido',
            clientes,
            productos,
            rutaActiva: 'pedidos',
        });
    } catch (error) {
        req.flash('error', `Error al cargar el formulario: ${error.message}`);
        return res.redirect('/pedidos');
    }
};

// ==================== CREAR (POST) ====================
const crearPedido = async (req, res) => {
    try {
        const clientes = await Cliente.find({ activo: true }).sort({ nombre: 1 });
        const productos = await Product.find({ activo: true })
            .select('nombre precio_venta')
            .sort({ nombre: 1 });
        const _ctx = { titulo: 'Crear Pedido', clientes, productos, rutaActiva: 'pedidos' };

        const clienteId = req.body.cliente;
        const productosIds = Array.isArray(req.body.producto) ? req.body.producto : [req.body.producto].filter(Boolean);
        const cantidades = Array.isArray(req.body.cantidad) ? req.body.cantidad : [req.body.cantidad].filter(Boolean);

        if (!clienteId) {
            req.flash('error', 'Debes seleccionar un cliente.');
            return res.render('pedidos/crear', _ctx);
        }

        const cliente = await Cliente.findOne({ _id: clienteId, activo: true });
        if (!cliente) {
            req.flash('error', 'El cliente seleccionado no es válido.');
            return res.render('pedidos/crear', _ctx);
        }

        if (!productosIds || productosIds.filter(Boolean).length === 0) {
            req.flash('error', 'Debes agregar al menos un producto.');
            return res.render('pedidos/crear', _ctx);
        }

        const pedido = await Pedido.create({
            numero: await siguienteNumero(Pedido),
            cliente: cliente._id,
            usuario: req.session.logueado ? req.session.logueado.id : null,
            estado: 'pendiente',
            total: 0,
        });

        let total = 0;
        for (let i = 0; i < productosIds.length; i++) {
            if (!productosIds[i]) continue;

            const producto = await Product.findOne({ _id: productosIds[i], activo: true });
            if (!producto) {
                req.flash('error', 'Uno de los productos seleccionados no es válido.');
                await Pedido.deleteOne({ _id: pedido._id });
                return res.render('pedidos/crear', _ctx);
            }

            const cantidad = parseInt(cantidades[i] || '0', 10);
            if (isNaN(cantidad) || cantidad <= 0) {
                req.flash('error', `La cantidad para '${producto.nombre}' debe ser mayor a 0.`);
                await Pedido.deleteOne({ _id: pedido._id });
                return res.render('pedidos/crear', _ctx);
            }

            const subtotal = cantidad * producto.precio_venta;
            await PedidoDetalle.create({
                pedido: pedido._id,
                producto: producto._id,
                cantidad,
                precio_unitario: producto.precio_venta,
                subtotal,
            });
            total += subtotal;
        }

        pedido.total = total;
        await pedido.save();

        const usuario = req.session.logueado || {};
        await crearNotificacion(
            await idsAdmins(),
            `Nuevo pedido #${pedido.numero} de ${cliente.nombre} (creado por ${usuario.nombre || ''}).`,
            `pedidos/${pedido._id}/`
        );

        req.flash('success', '¡Pedido creado exitosamente!');
        return res.redirect('/pedidos');
    } catch (error) {
        req.flash('error', `Error al crear el pedido: ${error.message}`);
        return res.redirect('/pedidos');
    }
};

// ==================== DETALLE ====================
const detallePedido = async (req, res) => {
    try {
        const pedido = await Pedido.findById(req.params.id)
            .populate('cliente', 'nombre correo telefono')
            .populate('usuario', 'username nombre apellido');

        if (!pedido) {
            req.flash('error', 'Pedido no encontrado.');
            return res.redirect('/pedidos');
        }

        const detalles = await PedidoDetalle.find({ pedido: pedido._id }).populate('producto', 'nombre');
        const factura = await Factura.findOne({ pedido: pedido._id });

        res.render('pedidos/detalle', {
            titulo: 'Detalle de Pedido',
            pedido,
            detalles,
            facturaAsociada: factura,
            rutaActiva: 'pedidos',
        });
    } catch (error) {
        req.flash('error', `Error al cargar el pedido: ${error.message}`);
        return res.redirect('/pedidos');
    }
};

// ==================== CONFIRMAR ====================
const confirmarPedido = async (req, res) => {
    try {
        const pedido = await Pedido.findById(req.params.id);
        if (!pedido) {
            req.flash('error', 'Pedido no encontrado.');
            return res.redirect('/pedidos');
        }

        if (req.method !== 'POST') {
            return res.redirect(`/pedidos/${pedido._id}/`);
        }

        if (pedido.estado !== 'pendiente') {
            req.flash('warning', 'Solo se pueden confirmar pedidos pendientes.');
            return res.redirect(`/pedidos/${pedido._id}/`);
        }

        const detalles = await PedidoDetalle.find({ pedido: pedido._id }).populate('producto', 'nombre');

        if (detalles.length === 0) {
            req.flash('error', 'El pedido no tiene productos.');
            return res.redirect(`/pedidos/${pedido._id}/`);
        }

        let branch = await Branch.findOne({ es_principal: true });
        if (!branch) branch = await Branch.findOne();
        if (!branch) {
            req.flash('error', 'No hay sucursales configuradas.');
            return res.redirect(`/pedidos/${pedido._id}/`);
        }

        const inventarios = await Inventory.find()
            .populate('product', 'nombre')
            .exec();

        for (const det of detalles) {
            const inv = inventarios.find(
                (i) => i.product && i.product._id.toString() === det.producto._id.toString() && i.branch.toString() === branch._id.toString()
            );
            if (!inv) {
                req.flash('error', `No hay inventario para '${det.producto.nombre}' en ${branch.nombre}.`);
                return res.redirect(`/pedidos/${pedido._id}/`);
            }
            if (inv.cantidad_disponible < det.cantidad) {
                req.flash(
                    'error',
                    `Stock insuficiente para '${det.producto.nombre}'. Disponible: ${inv.cantidad_disponible}, requerido: ${det.cantidad}.`
                );
                return res.redirect(`/pedidos/${pedido._id}/`);
            }
        }

        for (const det of detalles) {
            const inv = await Inventory.findOne({
                product: det.producto._id,
                branch: branch._id,
            });
            inv.cantidad_disponible -= det.cantidad;
            await inv.save();

            await InventoryLog.create({
                inventory: inv._id,
                tipo_movimiento: 'SALIDA',
                cantidad: det.cantidad,
                cantidad_resultante: inv.cantidad_disponible,
                motivo: `Salida por confirmación de Pedido #${pedido.numero}`,
                usuario: req.session.logueado ? req.session.logueado.id : null,
            });

            if (inv.cantidad_disponible <= inv.stock_minimo) {
                await notificarStockBajo(inv);
            }
        }

        pedido.estado = 'confirmado';
        await pedido.save();

        await crearNotificacion(
            await idsAdmins(),
            `Pedido #${pedido.numero} confirmado. Stock descontado.`,
            `pedidos/${pedido._id}/`
        );

        req.flash('success', `Pedido #${pedido.numero} confirmado. Stock descontado.`);
        return res.redirect(`/pedidos/${pedido._id}/`);
    } catch (error) {
        req.flash('error', `Error al confirmar el pedido: ${error.message}`);
        return res.redirect('/pedidos');
    }
};

// ==================== CANCELAR ====================
const cancelarPedido = async (req, res) => {
    try {
        const pedido = await Pedido.findById(req.params.id);
        if (!pedido) {
            req.flash('error', 'Pedido no encontrado.');
            return res.redirect('/pedidos');
        }

        if (req.method !== 'POST') {
            return res.redirect(`/pedidos/${pedido._id}/`);
        }

        if (pedido.estado === 'cancelado') {
            req.flash('warning', 'El pedido ya está cancelado.');
            return res.redirect(`/pedidos/${pedido._id}/`);
        }

        pedido.estado = 'cancelado';
        await pedido.save();

        const factura = await Factura.findOne({ pedido: pedido._id, estado: 'emitida' });
        if (factura) {
            factura.estado = 'anulada';
            await factura.save();
        }

        const detalles = await PedidoDetalle.find({ pedido: pedido._id }).populate('producto', 'nombre');
        for (const det of detalles) {
            const inv = await Inventory.findOne({ product: det.producto._id });
            if (inv) {
                inv.cantidad_disponible += det.cantidad;
                await inv.save();
                await InventoryLog.create({
                    inventory: inv._id,
                    tipo_movimiento: 'ENTRADA',
                    cantidad: det.cantidad,
                    cantidad_resultante: inv.cantidad_disponible,
                    motivo: `Devolución por cancelación de Pedido #${pedido.numero}`,
                    usuario: req.session.logueado ? req.session.logueado.id : null,
                });
            }
        }

        await crearNotificacion(
            await idsAdmins(),
            `Pedido #${pedido.numero} cancelado. Stock devuelto al inventario.`,
            `pedidos/${pedido._id}/`
        );

        req.flash('success', `Pedido #${pedido.numero} cancelado.`);
        return res.redirect(`/pedidos/${pedido._id}/`);
    } catch (error) {
        req.flash('error', `Error al cancelar el pedido: ${error.message}`);
        return res.redirect('/pedidos');
    }
};

// ==================== PAGAR ====================
const pagarPedido = async (req, res) => {
    try {
        const pedido = await Pedido.findById(req.params.id);
        if (!pedido) {
            req.flash('error', 'Pedido no encontrado.');
            return res.redirect('/pedidos');
        }

        if (req.method !== 'POST') {
            return res.redirect(`/pedidos/${pedido._id}/`);
        }

        if (pedido.estado !== 'confirmado') {
            req.flash('warning', 'Solo se pueden pagar pedidos confirmados.');
            return res.redirect(`/pedidos/${pedido._id}/`);
        }

        const existeFactura = await Factura.findOne({ pedido: pedido._id, estado: 'emitida' });
        if (existeFactura) {
            req.flash('warning', 'Este pedido ya tiene una factura emitida.');
            return res.redirect(`/pedidos/${pedido._id}/`);
        }

        const detalles = await PedidoDetalle.find({ pedido: pedido._id });

        const factura = await Factura.create({
            numero: await siguienteNumero(Factura),
            cliente: pedido.cliente,
            usuario: req.session.logueado ? req.session.logueado.id : null,
            pedido: pedido._id,
            total: pedido.total,
            estado: 'emitida',
        });

        for (const det of detalles) {
            await FacturaDetalle.create({
                factura: factura._id,
                producto: det.producto,
                cantidad: det.cantidad,
                precio_unitario: det.precio_unitario,
                subtotal: det.subtotal,
            });
        }

        pedido.estado = 'pagado';
        await pedido.save();

        await crearNotificacion(
            await idsAdmins(),
            `Pedido #${pedido.numero} pagado. Factura #${factura.numero} generada.`,
            `facturas/${factura._id}/`
        );

        req.flash('success', `Pedido #${pedido.numero} marcado como pagado. Factura #${factura.numero} generada.`);
        return res.redirect(`/pedidos/${pedido._id}/`);
    } catch (error) {
        req.flash('error', `Error al pagar el pedido: ${error.message}`);
        return res.redirect('/pedidos');
    }
};

// ==================== ELIMINAR (solo pendiente, admin) ====================
const eliminarPedido = async (req, res) => {
    try {
        const pedido = await Pedido.findById(req.params.id);
        if (!pedido) {
            req.flash('error', 'Pedido no encontrado.');
            return res.redirect('/pedidos');
        }

        if (req.method !== 'POST') {
            return res.redirect(`/pedidos/${pedido._id}/`);
        }

        if (pedido.estado === 'pendiente') {
            await PedidoDetalle.deleteMany({ pedido: pedido._id });
            await pedido.deleteOne();
            req.flash('success', '¡Pedido eliminado exitosamente!');
        } else {
            req.flash('warning', 'Solo se pueden eliminar pedidos pendientes.');
        }
        return res.redirect('/pedidos');
    } catch (error) {
        req.flash('error', `Error al eliminar el pedido: ${error.message}`);
        return res.redirect('/pedidos');
    }
};

// ==================== EDITAR (no aplica) ====================
const editarPedido = async (req, res) => {
    req.flash('warning', 'Los pedidos se confirman o cancelan, no se editan.');
    return res.redirect(`/pedidos/${req.params.id}/`);
};

// ==================== API (JSON) ====================
const apiListarPedidos = async (req, res) => {
    try {
        const pedidos = await Pedido.find().populate('cliente', 'nombre correo').sort({ createdAt: -1 });
        return res.json({ success: true, data: pedidos });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

const apiDetallePedido = async (req, res) => {
    try {
        const pedido = await Pedido.findById(req.params.id)
            .populate('cliente', 'nombre correo telefono')
            .populate('usuario', 'username nombre apellido');
        if (!pedido) {
            return res.status(404).json({ success: false, message: 'Pedido no encontrado.' });
        }
        const detalles = await PedidoDetalle.find({ pedido: pedido._id }).populate('producto', 'nombre');
        return res.json({ success: true, data: { pedido, detalles } });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

module.exports = {
    listaPedidos,
    renderCrearPedido,
    crearPedido,
    detallePedido,
    confirmarPedido,
    cancelarPedido,
    pagarPedido,
    eliminarPedido,
    editarPedido,
    apiListarPedidos,
    apiDetallePedido,
};