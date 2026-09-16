const Inventory = require('../models/Inventory');
const InventoryLog = require('../models/InventoryLog');
const Branch = require('../models/Branch');
const Categoria = require('../models/Categoria');

// ==================== LISTAR ====================
const listaInventario = async (req, res) => {
    try {
        const sucursalId = req.query.sucursal;
        const categoriaId = req.query.categoria;

        const filtro = {};
        if (sucursalId) filtro.branch = sucursalId;
        if (categoriaId) {
            const productosIds = (await require('../models/Product').find({ categoria: categoriaId }).select('_id')).map((p) => p._id);
            filtro.product = { $in: productosIds };
        }

        const inventario = await Inventory.find(filtro)
            .populate({ path: 'product', populate: { path: 'categoria' } })
            .populate('branch')
            .sort({ 'product.nombre': 1 });

        const sucursales = await Branch.find().sort({ es_principal: -1 });
        const categorias = await Categoria.find({ activa: true }).sort({ nombre: 1 });

        res.render('inventario/lista', {
            titulo: 'Inventario',
            inventario,
            sucursales,
            categorias,
            sucursalSeleccionada: sucursalId || '',
            categoriaSeleccionada: categoriaId || '',
            rutaActiva: 'inventario',
        });
    } catch (error) {
        req.flash('error', `Error al listar el inventario: ${error.message}`);
        return res.redirect('/auth/dashboard');
    }
};

// ==================== DETALLE ====================
const detalleInventario = async (req, res) => {
    try {
        const inventario = await Inventory.findById(req.params.id)
            .populate({ path: 'product', populate: { path: 'categoria' } })
            .populate('branch');
        if (!inventario) {
            req.flash('error', 'Registro de inventario no encontrado.');
            return res.redirect('/inventario');
        }

        const movimientos = await InventoryLog.find({ inventory: inventario._id })
            .populate('usuario', 'username nombre apellido')
            .sort({ fecha: -1 })
            .limit(50);

        res.render('inventario/detalle', {
            titulo: 'Detalle de inventario',
            inventario,
            movimientos,
            rutaActiva: 'inventario',
        });
    } catch (error) {
        req.flash('error', `Error al cargar el detalle: ${error.message}`);
        return res.redirect('/inventario');
    }
};

// ==================== MOVIMIENTO (Vista) ====================
const renderMovimiento = async (req, res) => {
    try {
        const inventario = await Inventory.findById(req.params.id)
            .populate({ path: 'product', populate: { path: 'categoria' } })
            .populate('branch');
        if (!inventario) {
            req.flash('error', 'Registro de inventario no encontrado.');
            return res.redirect('/inventario');
        }

        res.render('inventario/movimientos', {
            titulo: 'Registrar movimiento',
            inventario,
            rutaActiva: 'inventario',
        });
    } catch (error) {
        req.flash('error', `Error al cargar el formulario: ${error.message}`);
        return res.redirect('/inventario');
    }
};

// ==================== MOVIMIENTO (POST) ====================
const registrarMovimiento = async (req, res) => {
    const inventarioId = req.params.id;
    try {
        const inventario = await Inventory.findById(inventarioId)
            .populate('product', 'nombre')
            .populate('branch', 'nombre');
        if (!inventario) {
            req.flash('error', 'Registro de inventario no encontrado.');
            return res.redirect('/inventario');
        }

        const tipo = req.body.tipo_movimiento || '';
        const cantidadStr = req.body.cantidad || '0';
        const motivo = (req.body.motivo || '').trim();

        const cantidad = parseInt(cantidadStr, 10);
        if (isNaN(cantidad)) {
            req.flash('error', 'La cantidad no es válida.');
            return res.redirect(`/inventario/${inventarioId}/movimiento`);
        }
        if (cantidad <= 0) {
            req.flash('error', 'La cantidad debe ser mayor a 0.');
            return res.redirect(`/inventario/${inventarioId}/movimiento`);
        }

        if (tipo === 'ENTRADA') {
            inventario.cantidad_disponible += cantidad;
        } else if (tipo === 'SALIDA') {
            if (inventario.cantidad_disponible < cantidad) {
                req.flash(
                    'error',
                    `Stock insuficiente. Disponible: ${inventario.cantidad_disponible}, solicitado: ${cantidad}`
                );
                return res.redirect(`/inventario/${inventarioId}/movimiento`);
            }
            inventario.cantidad_disponible -= cantidad;
        } else if (tipo === 'AJUSTE') {
            inventario.cantidad_disponible = cantidad;
        } else {
            req.flash('error', 'Tipo de movimiento no válido.');
            return res.redirect(`/inventario/${inventarioId}/movimiento`);
        }

        await inventario.save();

        await InventoryLog.create({
            inventory: inventario._id,
            tipo_movimiento: tipo,
            cantidad,
            cantidad_resultante: inventario.cantidad_disponible,
            motivo,
            usuario: req.session.logueado ? req.session.logueado.id : null,
        });

        if (inventario.cantidad_disponible <= inventario.stock_minimo) {
            req.flash(
                'warning',
                `¡Alerta! Stock bajo para '${inventario.product.nombre}' (${inventario.cantidad_disponible}/${inventario.stock_minimo})`
            );
        }

        req.flash('success', `¡${tipo === 'AJUSTE' ? 'Ajuste registrado' : tipo === 'ENTRADA' ? 'Entrada registrada' : 'Salida registrada'} exitosamente!`);
        return res.redirect(`/inventario/${inventarioId}`);
    } catch (error) {
        req.flash('error', `Error al registrar el movimiento: ${error.message}`);
        return res.redirect('/inventario');
    }
};

// ==================== API (JSON) ====================
const apiListarInventario = async (req, res) => {
    try {
        const inventario = await Inventory.find()
            .populate({ path: 'product', populate: { path: 'categoria' } })
            .populate('branch')
            .sort({ 'product.nombre': 1 });
        return res.json({ success: true, data: inventario });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

const apiDetalleInventario = async (req, res) => {
    try {
        const inventario = await Inventory.findById(req.params.id)
            .populate({ path: 'product', populate: { path: 'categoria' } })
            .populate('branch');
        if (!inventario) {
            return res.status(404).json({ success: false, message: 'Registro de inventario no encontrado.' });
        }
        const movimientos = await InventoryLog.find({ inventory: inventario._id }).sort({ fecha: -1 }).limit(50);
        return res.json({ success: true, data: { inventario, movimientos } });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

module.exports = {
    listaInventario,
    detalleInventario,
    renderMovimiento,
    registrarMovimiento,
    apiListarInventario,
    apiDetalleInventario,
};