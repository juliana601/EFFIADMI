const Proveedor = require('../models/Proveedor');

// ==================== LISTAR ====================
const listaProveedores = async (req, res) => {
    try {
        const estado = req.query.estado || '';
        const filtro = {};
        if (estado === 'activo') filtro.activo = true;
        else if (estado === 'inactivo') filtro.activo = false;

        const proveedores = await Proveedor.find(filtro).sort({ createdAt: -1 });

        res.render('proveedores/lista', {
            titulo: 'Proveedores',
            proveedores,
            filtroEstado: estado,
            rutaActiva: 'proveedores',
        });
    } catch (error) {
        req.flash('error', `Error al listar proveedores: ${error.message}`);
        return res.redirect('/auth/dashboard');
    }
};

// ==================== CREAR (Vista) ====================
const renderCrearProveedor = (req, res) => {
    res.render('proveedores/crear', { titulo: 'Nuevo Proveedor', rutaActiva: 'proveedores' });
};

// ==================== CREAR (POST) ====================
const crearProveedor = async (req, res) => {
    try {
        const { nombre_proveedor, correo, telefono, direccion } = req.body;
        const nombre = (nombre_proveedor || '').trim();
        const email = (correo || '').trim().toLowerCase();
        const tel = (telefono || '').trim();
        const dir = (direccion || '').trim();

        if (!nombre || !email || !tel || !dir) {
            req.flash('error', 'Por favor completa todos los campos.');
            return res.render('proveedores/crear', { titulo: 'Nuevo Proveedor', rutaActiva: 'proveedores' });
        }

        await Proveedor.create({ nombre, correo: email, telefono: tel, direccion: dir });

        req.flash('success', '¡Proveedor creado exitosamente!');
        return res.redirect('/proveedores');
    } catch (error) {
        if (error.code === 11000) {
            req.flash('error', 'El correo ya está registrado.');
        } else {
            req.flash('error', `Error al crear el proveedor: ${error.message}`);
        }
        return res.render('proveedores/crear', { titulo: 'Nuevo Proveedor', rutaActiva: 'proveedores' });
    }
};

// ==================== EDITAR (Vista) ====================
const renderEditarProveedor = async (req, res) => {
    try {
        const proveedor = await Proveedor.findById(req.params.id);
        if (!proveedor) {
            req.flash('error', 'Proveedor no encontrado.');
            return res.redirect('/proveedores');
        }
        res.render('proveedores/editar', {
            titulo: 'Editar Proveedor',
            proveedor,
            rutaActiva: 'proveedores',
        });
    } catch (error) {
        req.flash('error', `Error al cargar el proveedor: ${error.message}`);
        return res.redirect('/proveedores');
    }
};

// ==================== EDITAR (POST) ====================
const editarProveedor = async (req, res) => {
    try {
        const proveedor = await Proveedor.findById(req.params.id);
        if (!proveedor) {
            req.flash('error', 'Proveedor no encontrado.');
            return res.redirect('/proveedores');
        }

        const nombre = (req.body.nombre_proveedor || '').trim();
        const correo = (req.body.correo || '').trim().toLowerCase();
        const telefono = (req.body.telefono || '').trim();
        const direccion = (req.body.direccion || '').trim();

        if (!nombre || !correo || !telefono || !direccion) {
            req.flash('error', 'Por favor completa todos los campos.');
            return res.render('proveedores/editar', {
                titulo: 'Editar Proveedor',
                proveedor,
                rutaActiva: 'proveedores',
            });
        }

        const duplicado = await Proveedor.findOne({ correo, _id: { $ne: proveedor._id } });
        if (duplicado) {
            req.flash('error', 'El correo ya está registrado.');
            return res.render('proveedores/editar', {
                titulo: 'Editar Proveedor',
                proveedor,
                rutaActiva: 'proveedores',
            });
        }

        proveedor.nombre = nombre;
        proveedor.correo = correo;
        proveedor.telefono = telefono;
        proveedor.direccion = direccion;
        await proveedor.save();

        req.flash('success', '¡Proveedor actualizado exitosamente!');
        return res.redirect('/proveedores');
    } catch (error) {
        if (error.code === 11000) {
            req.flash('error', 'El correo ya está registrado.');
        } else {
            req.flash('error', `Error al actualizar el proveedor: ${error.message}`);
        }
        return res.redirect(`/proveedores/${req.params.id}/editar`);
    }
};

// ==================== ACTIVAR / DESACTIVAR ====================
const alternarEstadoProveedor = async (req, res) => {
    try {
        if (req.method !== 'POST') {
            return res.redirect('/proveedores');
        }

        const proveedor = await Proveedor.findById(req.params.id);
        if (!proveedor) {
            req.flash('error', 'Proveedor no encontrado.');
            return res.redirect('/proveedores');
        }

        proveedor.activo = !proveedor.activo;
        await proveedor.save();

        req.flash('success', proveedor.activo ? 'Proveedor activado exitosamente.' : 'Proveedor desactivado exitosamente.');
        return res.redirect('/proveedores');
    } catch (error) {
        req.flash('error', `Error al cambiar el estado del proveedor: ${error.message}`);
        return res.redirect('/proveedores');
    }
};

// ==================== API (JSON) ====================
const apiListarProveedores = async (req, res) => {
    try {
        const proveedores = await Proveedor.find().sort({ nombre: 1 });
        return res.json({ success: true, data: proveedores });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

const apiCrearProveedor = async (req, res) => {
    try {
        const { nombre_proveedor, correo, telefono, direccion } = req.body;
        const nombre = (nombre_proveedor || '').trim();
        const email = (correo || '').trim().toLowerCase();

        if (!nombre || !email || !(telefono || '').trim() || !(direccion || '').trim()) {
            return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
        }

        const proveedor = await Proveedor.create({
            nombre,
            correo: email,
            telefono: (telefono || '').trim(),
            direccion: (direccion || '').trim(),
        });
        return res.status(201).json({ success: true, data: proveedor });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'El correo ya está registrado.' });
        }
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

module.exports = {
    listaProveedores,
    renderCrearProveedor,
    crearProveedor,
    renderEditarProveedor,
    editarProveedor,
    alternarEstadoProveedor,
    apiListarProveedores,
    apiCrearProveedor,
};