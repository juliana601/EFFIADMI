require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const morgan = require('morgan');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');

const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const clientesRoutes = require('./routes/clientes.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const productosRoutes = require('./routes/productos.routes');
const inventarioRoutes = require('./routes/inventario.routes');
const proveedoresRoutes = require('./routes/proveedores.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const facturasRoutes = require('./routes/facturas.routes');
const estadisticasRoutes = require('./routes/estadisticas.routes');
const reportesRoutes = require('./routes/reportes.routes');

const app = express();

// ==================== BASE DE DATOS ====================
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch((err) => {
        console.error('Error conectando a MongoDB:', err.message);
        process.exit(1);
    });

// ==================== MIDDLEWARES ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'clave_secreta_effiadmi',
        resave: false,
        saveUninitialized: false,
    })
);
app.use(flash());

app.use((req, res, next) => {
    res.locals.messages = req.flash();
    res.locals.session = req.session.logueado || null;
    res.locals.cop = (n) => `$ ${Number(n || 0).toLocaleString('es-CO')}`;
    res.locals.fmtFecha = (d) => {
        if (!d) return '-';
        const f = new Date(d);
        if (isNaN(f.getTime())) return '-';
        const pad = (x) => String(x).padStart(2, '0');
        return `${pad(f.getDate())}/${pad(f.getMonth() + 1)}/${f.getFullYear()} ${pad(f.getHours())}:${pad(f.getMinutes())}`;
    };
    next();
});

// ==================== VISTAS (EJS) ====================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// ==================== ARCHIVOS ESTÁTICOS ====================
app.use(express.static(path.join(__dirname, 'public')));

// ==================== RUTAS ====================
app.use('/auth', authRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/clientes', clientesRoutes);
app.use('/categorias', categoriasRoutes);
app.use('/productos', productosRoutes);
app.use('/inventario', inventarioRoutes);
app.use('/proveedores', proveedoresRoutes);
app.use('/pedidos', pedidosRoutes);
app.use('/facturas', facturasRoutes);
app.use('/estadisticas', estadisticasRoutes);
app.use('/reportes', reportesRoutes);

app.get('/', (req, res) => {
    if (req.session.logueado) {
        return res.redirect('/auth/dashboard');
    }
    res.redirect('/auth/login');
});

app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        data: {
            nombre: 'EFFIADMI API',
            estado: 'operativo',
            fecha: new Date().toISOString(),
        },
    });
});

// ==================== MANEJO DE ERRORES 404 ====================
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor EFFIADMI ejecutándose en el puerto ${PORT}`);
});

module.exports = app;