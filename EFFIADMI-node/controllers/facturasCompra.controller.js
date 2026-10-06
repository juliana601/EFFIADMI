// ============================================================
// Controllers de Facturas de Compra
// Registro de facturas emitidas por proveedores (compra/compra
// de mercancía), con línea de detalle y control de inventario.
// ============================================================
const mongoose = require('mongoose');
const FacturaCompra = require('../models/FacturaCompra');
const FacturaCompraDetalle = require('../models/FacturaCompraDetalle');
const Proveedor = require('../models/Proveedor');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

// ==================== LISTAR (Vista) ====================
const listaFacturasCompra = async (req, res) => {
    try {
        const facturas = await FacturaCompra.find()
            .populate('proveedor', 'nombre')
            .sort({ createdAt: -1 })
            .limit(200);
        return res.render('facturasCompra/lista', {
            titulo: 'Facturas de compra',
            facturas,
            rutaActiva: 'facturasCompra',
        });
    } catch (error) {
        req.flash('error', `Error al listar facturas de compra: ${error.message}`);
        return res.redirect('/auth/dashboard');
    }
};

// ==================== VISTA CREAR ====================
const renderCrearFacturaCompra = async (req, res) => {
    try {
        const [proveedores, productos] = await Promise.all([
            Proveedor.find({ activo: true }).select('nombre'),
            Product.find({ activo: true }).select('nombre sku'),
        ]);
        return res.render('facturasCompra/crear', {
            titulo: 'Nueva factura de compra',
            proveedores,
            productos,
            rutaActiva: 'facturasCompra',
        });
    } catch (error) {
        req.flash('error', `Error: ${error.message}`);
        return res.redirect('/facturas-compra');
    }
};

// ==================== CREAR (POST) ====================
const crearFacturaCompra = async (req, res) => {
    try {
        const proveedor = (req.body.proveedor || '').trim();
        const numeroFactura = (req.body.numeroFactura || '').trim();
        const fechaEmision = req.body.fechaEmision || new Date();
        const notas = (req.body.notas || '').trim();

        if (!mongoose.Types.ObjectId.isValid(proveedor) || !numeroFactura) {
            req.flash('error', 'Selecciona un proveedor y escribe el número de factura.');
            return res.redirect('/facturas-compra/crear');
        }

        // Líneas: el formulario envía arreglos paralelos producto[], cantidad[], precioUnitario[]
        const productos = [].concat(req.body.producto || []);
        const cantidades = [].concat(req.body.cantidad || []);
        const precios = [].concat(req.body.precioUnitario || []);

        let subtotal = 0;
        const detallesGuardados = [];

        for (let i = 0; i < productos.length; i++) {
            const productoId = (productos[i] || '').trim();
            const cantidad = Number(cantidades[i]) || 0;
            const precioUnitario = Number(precios[i]) || 0;

            if (!mongoose.Types.ObjectId.isValid(productoId) || cantidad <= 0 || precioUnitario <= 0) continue;

            subtotal += cantidad * precioUnitario;
            detallesGuardados.push({ producto: productoId, cantidad, precio_unitario: precioUnitario });
        }

        if (detallesGuardados.length === 0) {
            req.flash('error', 'Agrega al menos una línea válida de producto.');
            return res.redirect('/facturas-compra/crear');
        }

        const iva = Math.round(subtotal * 0.19 * 100) / 100;

        const factura = await FacturaCompra.create({
            proveedor,
            numeroFactura,
            fechaEmision,
            notas,
            subtotal,
            iva,
            total: subtotal + iva,
            registradoPor: req.session.logueado ? req.session.logueado.id : null,
        });

        for (const detalle of detallesGuardados) {
            await FacturaCompraDetalle.create({
                facturaCompra: factura._id,
                producto: detalle.producto,
                cantidad: detalle.cantidad,
                precioUnitario: detalle.precio_unitario,
            });

            // Sumar al inventario existente del producto (entrada de stock).
            const inventario = await Inventory.findOne({ product: detalle.producto });
            if (inventario) {
                inventario.cantidad_disponible = (inventario.cantidad_disponible || 0) + detalle.cantidad;
                await inventario.save();
            }
        }

        req.flash('success', 'Factura de compra registrada exitosamente.');
        return res.redirect('/facturas-compra');
    } catch (error) {
        req.flash('error', `Error al crear la factura de compra: ${error.message}`);
        return res.redirect('/facturas-compra/crear');
    }
};

// ==================== DETALLE ====================
const detalleFacturaCompra = async (req, res) => {
    try {
        const factura = await FacturaCompra.findById(req.params.id)
            .populate('proveedor', 'nombre')
            .populate('registradoPor', 'nombre');
        if (!factura) {
            req.flash('error', 'Factura de compra no encontrada.');
            return res.redirect('/facturas-compra');
        }
        const detalles = await FacturaCompraDetalle.find({ facturaCompra: factura._id })
            .populate('producto', 'nombre sku');
        return res.render('facturasCompra/detalle', {
            titulo: 'Detalle de factura de compra',
            factura,
            detalles,
            rutaActiva: 'facturasCompra',
        });
    } catch (error) {
        req.flash('error', `Error: ${error.message}`);
        return res.redirect('/facturas-compra');
    }
};

// ==================== EXPORTAR A EXCEL ====================
const exportarExcel = async (req, res) => {
    try {
        const XLSX = require('xlsx');
        const facturas = await FacturaCompra.find()
            .populate('proveedor', 'nombre')
            .sort({ createdAt: -1 });

        const datos = facturas.map((f) => ({
            'Número': f.numeroFactura,
            'Proveedor': f.proveedor ? f.proveedor.nombre : '-',
            'Fecha de emisión': f.fechaEmision ? new Date(f.fechaEmision).toISOString().slice(0, 10) : '',
            Subtotal: f.subtotal || 0,
            IVA: f.iva || 0,
            Total: f.total || (f.subtotal || 0) + (f.iva || 0),
            Notas: f.notas || '',
        }));

        const hoja = XLSX.utils.json_to_sheet(datos);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, 'Facturas de compra');

        const buffer = XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="facturas_compra.xlsx"');
        return res.send(buffer);
    } catch (error) {
        req.flash('error', `Error al exportar a Excel: ${error.message}`);
        return res.redirect('/facturas-compra');
    }
};

// ==================== ELIMINAR ====================
const eliminarFacturaCompra = async (req, res) => {
    try {
        await Promise.all([
            FacturaCompraDetalle.deleteMany({ facturaCompra: req.params.id }),
            FacturaCompra.findByIdAndDelete(req.params.id),
        ]);
        req.flash('success', 'Factura de compra eliminada.');
    } catch (error) {
        req.flash('error', `Error: ${error.message}`);
    }
    return res.redirect('/facturas-compra');
};

module.exports = {
    listaFacturasCompra,
    renderCrearFacturaCompra,
    crearFacturaCompra,
    detalleFacturaCompra,
    exportarExcel,
    eliminarFacturaCompra,
};
