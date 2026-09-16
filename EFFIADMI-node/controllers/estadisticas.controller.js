const Product = require('../models/Product');
const Proveedor = require('../models/Proveedor');
const Cliente = require('../models/Cliente');
const Factura = require('../models/Factura');
const FacturaDetalle = require('../models/FacturaDetalle');
const Inventory = require('../models/Inventory');
const InventoryLog = require('../models/InventoryLog');
const User = require('../models/User');

// ==================== PÁGINA DE ESTADÍSTICAS (admin) ====================
const estadisticas = async (req, res) => {
    try {
        const [totalProductos, totalProveedores, totalClientes, totalFacturas, totalUsuarios] = await Promise.all([
            Product.countDocuments({ activo: true }),
            Proveedor.countDocuments({ activo: true }),
            Cliente.countDocuments({ activo: true }),
            Factura.countDocuments({ estado: 'emitida' }),
            User.countDocuments({ activo: true }),
        ]);

        const inventario = await Inventory.find()
            .populate('product', 'nombre precio_venta')
            .populate('branch', 'nombre');

        let unidadesTotales = 0;
        let valorInventario = 0;
        const productosBajos = [];

        for (const inv of inventario) {
            if (!inv.product) continue;
            unidadesTotales += inv.cantidad_disponible;
            valorInventario += inv.product.precio_venta * inv.cantidad_disponible;
            if (inv.cantidad_disponible <= inv.stock_minimo) {
                productosBajos.push({
                    inventory_id: inv._id,
                    producto: inv.product.nombre,
                    sucursal: inv.branch ? inv.branch.nombre : null,
                    cantidad_disponible: inv.cantidad_disponible,
                    stock_minimo: inv.stock_minimo,
                });
            }
        }

        const [entradas, salidas] = await Promise.all([
            InventoryLog.countDocuments({ tipo_movimiento: 'ENTRADA' }),
            InventoryLog.countDocuments({ tipo_movimiento: 'SALIDA' }),
        ]);

        // Ventas por producto (solo facturas emitidas)
        const ventasRow = await FacturaDetalle.aggregate([
            {
                $lookup: {
                    from: 'facturas',
                    localField: 'factura',
                    foreignField: '_id',
                    as: 'fac',
                },
            },
            { $unwind: '$fac' },
            { $match: { 'fac.estado': 'emitida' } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'producto',
                    foreignField: '_id',
                    as: 'prod',
                },
            },
            { $unwind: '$prod' },
            {
                $group: {
                    _id: '$producto',
                    nombre: { $first: '$prod.nombre' },
                    totalVendido: { $sum: '$cantidad' },
                    totalFacturado: { $sum: '$subtotal' },
                },
            },
            { $sort: { totalVendido: -1 } },
            { $limit: 10 },
        ]);

        const productoMasVendido = ventasRow.length
            ? { nombre: ventasRow[0].nombre, unidades: ventasRow[0].totalVendido }
            : null;

        const movimientosRecientes = await InventoryLog.find()
            .populate({ path: 'inventory', populate: { path: 'product', select: 'nombre' } })
            .populate({ path: 'inventory', populate: { path: 'branch', select: 'nombre' } })
            .populate('usuario', 'username')
            .sort({ fecha: -1 })
            .limit(10);

        const movimientosData = movimientosRecientes.map((m) => ({
            id: m._id,
            producto: m.inventory && m.inventory.product ? m.inventory.product.nombre : null,
            sucursal: m.inventory && m.inventory.branch ? m.inventory.branch.nombre : null,
            tipo_movimiento: m.tipo_movimiento,
            cantidad: m.cantidad,
            cantidad_resultante: m.cantidad_resultante,
            fecha: m.fecha,
        }));

        res.render('estadisticas/index', {
            titulo: 'Estadísticas IA',
            rutaActiva: 'estadisticas',
            totales: {
                productos: totalProductos,
                proveedores: totalProveedores,
                clientes: totalClientes,
                facturas: totalFacturas,
                usuarios: totalUsuarios,
            },
            inventario: {
                unidadesTotales,
                valorInventario: Math.round(valorInventario),
                productosBajos: productosBajos.length,
            },
            movimientos: { entradas, salidas },
            productosBajos,
            productoMasVendido,
            ventasRows: ventasRow.map((v) => ({
                nombre: v.nombre,
                totalVendido: v.totalVendido,
                totalFacturado: v.totalFacturado,
            })),
            ventasChart: JSON.stringify(
                ventasRow.slice(0, 6).map((v) => ({ nombre: v.nombre, totalVendido: v.totalVendido }))
            ),
            ventasFacturadoTotal: ventasRow.reduce((acc, v) => acc + v.totalFacturado, 0),
            movimientosRecientes: movimientosData,
        });
    } catch (error) {
        req.flash('error', `Error al cargar estadísticas: ${error.message}`);
        return res.redirect('/auth/dashboard');
    }
};

// ==================== API (JSON, admin) ====================
const apiEstadisticas = async (req, res) => {
    try {
        const [totalProductos, totalClientes, totalFacturas, totalPedidos] = await Promise.all([
            Product.countDocuments(),
            Cliente.countDocuments(),
            Factura.countDocuments(),
            require('../models/Pedido').countDocuments(),
        ]);

        const inventario = await Inventory.find().populate('product', 'nombre precio_venta');
        let unidadesTotales = 0;
        let valorInventario = 0;
        const productosBajoStock = [];

        for (const inv of inventario) {
            if (!inv.product) continue;
            unidadesTotales += inv.cantidad_disponible;
            valorInventario += inv.product.precio_venta * inv.cantidad_disponible;
            if (inv.cantidad_disponible <= inv.stock_minimo) {
                productosBajoStock.push({
                    producto: inv.product.nombre,
                    cantidad_disponible: inv.cantidad_disponible,
                    stock_minimo: inv.stock_minimo,
                });
            }
        }

        const [entradas, salidas] = await Promise.all([
            InventoryLog.countDocuments({ tipo_movimiento: 'ENTRADA' }),
            InventoryLog.countDocuments({ tipo_movimiento: 'SALIDA' }),
        ]);

        return res.json({
            success: true,
            data: {
                totales: { productos: totalProductos, clientes: totalClientes, facturas: totalFacturas, pedidos: totalPedidos },
                inventario: {
                    unidades_totales: unidadesTotales,
                    valor_inventario: Math.round(valorInventario),
                    productos_bajo_stock: productosBajoStock.length,
                },
                movimientos: { entradas, salidas },
                reposicion_sugerida: productosBajoStock,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

module.exports = {
    estadisticas,
    apiEstadisticas,
};