const Product = require('../models/Product');
const Categoria = require('../models/Categoria');
const Branch = require('../models/Branch');
const Inventory = require('../models/Inventory');
const InventoryLog = require('../models/InventoryLog');

// ==================== UTILIDAD ====================
const siguienteSku = async () => {
    const productos = await Product.find().select('sku');
    let maximo = 0;
    for (const p of productos) {
        if (/^\d+$/.test(p.sku)) {
            maximo = Math.max(maximo, parseInt(p.sku, 10));
        }
    }
    return String(maximo + 1);
};

// ==================== LISTAR ====================
const listarProductos = async (req, res) => {
    try {
        const mostrarInactivos = req.query.inactivos === '1';
        const filtro = mostrarInactivos ? {} : { activo: true };

        const productos = await Product.find(filtro)
            .populate('categoria')
            .sort({ createdAt: -1 });

        const inventarios = await Inventory.find();
        const stockMap = {};
        for (const inv of inventarios) {
            const pid = inv.product.toString();
            stockMap[pid] = (stockMap[pid] || 0) + inv.cantidad_disponible;
        }

        const productosConStock = productos.map((p) => ({
            producto: p,
            stock: stockMap[p._id.toString()] || 0,
        }));

        res.render('productos/lista', {
            titulo: 'Productos',
            productos: productosConStock,
            mostrarInactivos,
            rutaActiva: 'productos',
        });
    } catch (error) {
        req.flash('error', `Error al listar productos: ${error.message}`);
        return res.redirect('/auth/dashboard');
    }
};

// ==================== CREAR (Vista) ====================
const renderCrearProducto = async (req, res) => {
    try {
        const categorias = await Categoria.find({ activa: true }).sort({ nombre: 1 });
        const sucursales = await Branch.find().sort({ es_principal: -1 });
        const proximoId = await siguienteSku();

        res.render('productos/crear', {
            titulo: 'Nuevo Producto',
            categorias,
            sucursales,
            proximoId,
            rutaActiva: 'productos',
        });
    } catch (error) {
        req.flash('error', `Error al cargar el formulario: ${error.message}`);
        return res.redirect('/productos');
    }
};

// ==================== CREAR (POST) ====================
const crearProducto = async (req, res) => {
    try {
        const { nombre, descripcion, categoria, precio_venta, sucursal, stock_inicial, stock_minimo } = req.body;

        const categorias = await Categoria.find({ activa: true }).sort({ nombre: 1 });
        const sucursales = await Branch.find().sort({ es_principal: -1 });
        const proximoId = await siguienteSku();
        const _ctx = { titulo: 'Nuevo Producto', categorias, sucursales, proximoId, rutaActiva: 'productos' };

        if (!nombre || !precio_venta) {
            req.flash('error', 'Por favor completa los campos obligatorios.');
            return res.render('productos/crear', _ctx);
        }

        const precio = Number(precio_venta);
        if (!Number.isInteger(precio) || precio <= 0) {
            req.flash('error', 'El precio de venta debe ser un valor entero mayor a 0.');
            return res.render('productos/crear', _ctx);
        }
        if (precio < 1000 || precio > 100000000) {
            req.flash('error', 'El precio de venta debe estar entre $1.000 y $100.000.000 (pesos colombianos).');
            return res.render('productos/crear', _ctx);
        }

        const cat = categoria
            ? await Categoria.findOne({ _id: categoria, activa: true })
            : null;
        if (!cat) {
            req.flash('error', 'Debes seleccionar una categoría válida.');
            return res.render('productos/crear', _ctx);
        }

        let stockInit = 0;
        if (stock_inicial !== undefined && stock_inicial !== '') {
            stockInit = parseInt(stock_inicial, 10) || 0;
        }
        if (stockInit < 0) {
            req.flash('error', 'El stock inicial no puede ser negativo.');
            return res.render('productos/crear', _ctx);
        }

        let stockMin = 5;
        if (stock_minimo !== undefined && stock_minimo !== '') {
            stockMin = parseInt(stock_minimo, 10) || 5;
        }
        if (stockMin < 0) {
            req.flash('error', 'El stock mínimo no puede ser negativo.');
            return res.render('productos/crear', _ctx);
        }

        let branch = sucursal ? await Branch.findById(sucursal) : null;
        if (!branch) branch = await Branch.findOne({ es_principal: true });
        if (!branch) {
            branch = await Branch.create({ nombre: 'Sucursal Principal', es_principal: true });
        }

        const producto = await Product.create({
            sku: proximoId,
            nombre: nombre.trim(),
            descripcion: (descripcion || '').trim(),
            categoria: cat._id,
            precio_venta: precio,
        });

        const inventario = await Inventory.create({
            product: producto._id,
            branch: branch._id,
            cantidad_disponible: stockInit,
            stock_minimo: stockMin,
        });

        if (stockInit > 0) {
            await InventoryLog.create({
                inventory: inventario._id,
                tipo_movimiento: 'ENTRADA',
                cantidad: stockInit,
                cantidad_resultante: stockInit,
                motivo: 'Creación automática de producto con stock inicial',
                usuario: req.session.logueado.id,
            });
        }

        req.flash('success', '¡Producto creado exitosamente!');
        return res.redirect('/productos');
    } catch (error) {
        if (error.code === 11000) {
            req.flash('error', 'El SKU ya está registrado.');
        } else {
            req.flash('error', `Error al crear el producto: ${error.message}`);
        }
        const categorias = await Categoria.find({ activa: true }).sort({ nombre: 1 });
        const sucursales = await Branch.find().sort({ es_principal: -1 });
        const proximoId = await siguienteSku();
        return res.render('productos/crear', {
            titulo: 'Nuevo Producto',
            categorias,
            sucursales,
            proximoId,
            rutaActiva: 'productos',
        });
    }
};

// ==================== EDITAR (Vista) ====================
const renderEditarProducto = async (req, res) => {
    try {
        const producto = await Product.findById(req.params.id).populate('categoria');
        if (!producto) {
            req.flash('error', 'Producto no encontrado.');
            return res.redirect('/productos');
        }

        const categorias = await Categoria.find({ activa: true }).sort({ nombre: 1 });

        res.render('productos/editar', {
            titulo: 'Editar Producto',
            producto,
            categorias,
            rutaActiva: 'productos',
        });
    } catch (error) {
        req.flash('error', `Error al cargar el producto: ${error.message}`);
        return res.redirect('/productos');
    }
};

// ==================== EDITAR (POST) ====================
const editarProducto = async (req, res) => {
    try {
        const producto = await Product.findById(req.params.id);
        if (!producto) {
            req.flash('error', 'Producto no encontrado.');
            return res.redirect('/productos');
        }

        const { nombre, descripcion, categoria, precio_venta } = req.body;

        const categorias = await Categoria.find({ activa: true }).sort({ nombre: 1 });
        const _ctx = (msg) => ({
            titulo: 'Editar Producto',
            producto,
            categorias,
            rutaActiva: 'productos',
            error: msg,
        });

        if (!nombre || !precio_venta) {
            req.flash('error', 'Nombre y precio son obligatorios.');
            return res.render('productos/editar', _ctx());
        }

        const precio = Number(precio_venta);
        if (!Number.isInteger(precio) || precio <= 0) {
            req.flash('error', 'El precio de venta debe ser un valor entero mayor a 0.');
            return res.render('productos/editar', _ctx());
        }
        if (precio < 1000 || precio > 100000000) {
            req.flash('error', 'El precio de venta debe estar entre $1.000 y $100.000.000 (pesos colombianos).');
            return res.render('productos/editar', _ctx());
        }

        let cat = null;
        if (categoria) {
            cat = await Categoria.findOne({ _id: categoria, activa: true });
            if (!cat) {
                req.flash('error', 'La categoría seleccionada no es válida.');
                return res.render('productos/editar', _ctx());
            }
        }

        producto.nombre = nombre.trim();
        producto.descripcion = (descripcion || '').trim();
        producto.categoria = cat ? cat._id : null;
        producto.precio_venta = precio;

        await producto.save();

        req.flash('success', '¡Producto actualizado exitosamente!');
        return res.redirect('/productos');
    } catch (error) {
        req.flash('error', `Error al actualizar el producto: ${error.message}`);
        return res.redirect(`/productos/${req.params.id}/editar`);
    }
};

// ==================== ELIMINAR / ACTIVAR / DESACTIVAR ====================
const alternarEstadoProducto = async (req, res) => {
    try {
        if (req.method !== 'POST') {
            return res.redirect('/productos');
        }

        const producto = await Product.findById(req.params.id);
        if (!producto) {
            req.flash('error', 'Producto no encontrado.');
            return res.redirect('/productos');
        }

        if (!producto.activo) {
            producto.activo = true;
            await producto.save();
            req.flash('success', 'Producto activado exitosamente.');
            return res.redirect('/productos');
        }

        // Verificar si tiene historial asociado (inventario con stock > 0)
        const inventario = await Inventory.findOne({ product: producto._id });
        const tieneHistorial = inventario && inventario.cantidad_disponible > 0;

        if (tieneHistorial) {
            producto.activo = false;
            await producto.save();
            req.flash(
                'warning',
                'El producto tiene registros asociados (inventario, pedidos, facturas o proveedores), por lo que no se eliminó. Quedó desactivado.'
            );
            return res.redirect('/productos');
        }

        await Inventory.deleteMany({ product: producto._id });
        await producto.deleteOne();
        req.flash('success', 'Producto eliminado exitosamente.');
        return res.redirect('/productos');
    } catch (error) {
        req.flash('error', `Error al eliminar el producto: ${error.message}`);
        return res.redirect('/productos');
    }
};

// ==================== API (JSON) ====================
const apiListarProductos = async (req, res) => {
    try {
        const productos = await Product.find().populate('categoria').sort({ createdAt: -1 });
        return res.json({ success: true, data: productos });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

const apiDetalleProducto = async (req, res) => {
    try {
        const producto = await Product.findById(req.params.id).populate('categoria');
        if (!producto) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }
        return res.json({ success: true, data: producto });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

module.exports = {
    listarProductos,
    renderCrearProducto,
    crearProducto,
    renderEditarProducto,
    editarProducto,
    alternarEstadoProducto,
    apiListarProductos,
    apiDetalleProducto,
};