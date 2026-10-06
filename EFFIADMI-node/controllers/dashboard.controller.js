const mongoose = require('mongoose');

const Pedido = require('../models/Pedido');
const Factura = require('../models/Factura');
const FacturaCompra = require('../models/FacturaCompra');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Cliente = require('../models/Cliente');
const Proveedor = require('../models/Proveedor');
const Notificacion = require('../models/Notificacion');

// ==================== DASHBOARD: KPIs REALES ====================
async function renderDashboard(req, res) {
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1-5);
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    const kpis = {
        ventasHoy: 0,
        ventasMes: 0,
        totalVentas: 0,
        totalCompras: 0,
        totalInventario: 0,
        numProductos: 0,
        numClientes: 0,
        numProveedores: 0,
        numPedidos: 0,
        numFacturasMes: 0,
        stockBajo: 0,
        productosSinMovimiento: 0,
    };
    const ventas7Dias = [];
    let estadoPedidos = {};
    let clienteTop = null;
    let productoMasVendido = null;

    try {
        const [pedidos, facturasMesRaw, compras, inventario, productos, clientes, proveedores] =
            await Promise.all([
                Pedido.find().populate('cliente').sort({ createdAt: -1 }).limit(500),
                Factura.find({ fechaEmision: { $gte: inicioMes } }),
                FacturaCompra.find({ fechaEmision: { $gte: inicioMes } }),
                Inventory.find().populate('product'),
                Product.find(),
                Cliente.find(),
                Proveedor.find(),
            ]);

        // ===== KPIs de pedidos / ventas =====
        for (const p of pedidos) {
            const total = Number(p.total || p.monto) || 0;
            kpis.totalVentas += total;
            const clave = (p.estado || 'pendiente').toLowerCase();
            estadoPedidos[clave] = (estadoPedidos[clave] || 0) + 1;
            if (p.fechaCreacion && p.fechaCreacion >= inicioDia) kpis.ventasHoy += total;
            if (p.fechaCreacion && p.fechaCreacion >= inicioMes) kpis.ventasMes += total;
            if (clave === 'pendiente' || clave === 'en_proceso') kpis.numPedidos += 0;
        }
        kpis.numPedidos = pedidos.length === 0 ? 0 : pedidos.length;

        // ===== Facturas del mes =====
        kpis.numFacturasMes = facturasMesRaw.length;
        kpis.totalCompras = compras.reduce((a, f) => a + (Number(f.total) || 0), 0);

        // ===== Inventario / stock bajo =====
        let stockBajo = 0;
        for (const it of inventario) {
            const cant = Number(it.cantidadExistencia) || Number(it.cantidad_disponible) || 0;
            const minimo = Number(it.stockMinimo || it.stock_minimo) || 5;
            if (cant <= minimo) stockBajo += 1;
            const precio = it.product ? Number(it.product.precioVenta || it.product.precio_venta) || 0 : 0;
            kpis.totalInventario += cant * precio;
        }
        kpis.stockBajo = stockBajo;
        kpis.numProductos = productos.length;
        kpis.numClientes = clientes.length;
        kpis.numProveedores = proveedores.length;

        // ===== Ventas ultimos 7 dias =====
        for (let i = 6; i >= 0; i--) {
            const d1 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
            const d2 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i + 1);
            let monto = 0;
            for (const p of pedidos) {
                const f = p.fechaCreacion || p.createdAt;
                if (f && f >= d1 && f < d2) monto += Number(p.total || p.monto) || 0;
            }
            ventas7Dias.push({
                fecha: d1.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
                monto: Math.round(monto),
            });
        }

        // ===== Cliente top (por monto acumulado) =====
        const porCliente = {};
        for (const p of pedidos) {
            const id = p.cliente ? String(p.cliente._id || p.cliente) : 'sin-cliente';
            if (!porCliente[id]) porCliente[id] = { nombre: p.cliente ? (p.cliente.nombre || 'Cliente') : 'Sin cliente', monto: 0 };
            porCliente[id].monto += Number(p.total || p.monto) || 0;
        }
        const top = Object.values(porCliente).sort((a, b) => b.monto - a.monto)[0];
        clienteTop = top ? { nombre: top.nombre, monto: Math.round(top.monto) } : null;

        // ===== Sin movimiento 30 dias =====
        const corte = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const stats = await Pedido.aggregate([
            { $unwind: '$detalles' },
            { $group: { _id: '$detalles.producto', total: { $sum: '$detalles.cantidad' } } },
        ]);
        const idsMovidos = new Set(stats.map((s) => String(s._id)));
        kpis.productosSinMovimiento = productos.filter((pr) => !idsMovidos.has(String(pr._id))).length;

        // ===== Producto mas vendido =====
        const max = stats.sort((a, b) => b.total - a.total)[0];
        if (max) {
            const prod = productos.find((pr) => String(pr._id) === String(max._id));
            productoMasVendido = prod ? { nombre: prod.nombre, total: max.total } : null;
        }

        // ===== Notificacion de stock bajo (una por sesion) =====
        if (stockBajo > 0 && !req.session.avisoStock) {
            await Notificacion.create({
                usuario: req.session.logueado ? req.session.logueado.id : null,
                mensaje: 'Hay ' + stockBajo + ' producto(s) con stock bajo. Revisa el inventario.',
                enlace: '/inventario',
                leido: false,
            });
            req.session.avisoStock = true;
        }
    } catch (error) {
        console.error('Error en KPIs del dashboard:', error.message);
    }

    return res.render('dashboard/index', {
        titulo: 'Panel EFFIADMI',
        rutaActiva: 'dashboard',
        messages: req.flash(),
        session: req.session,
        kpis,
        ventas7Dias,
        estadoPedidos,
        clienteTop,
        productoMasVendido,
    });
}

module.exports = { renderDashboard };
