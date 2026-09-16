const Cliente = require('../models/Cliente');

// ==================== LISTAR ====================
const listarClientes = async (req, res) => {
    try {
        const clientes = await Cliente.find().sort({ createdAt: -1 });
        res.render('clientes/lista', {
            titulo: 'Clientes',
            clientes,
            rutaActiva: 'clientes',
        });
    } catch (error) {
        req.flash('error', `Error al listar clientes: ${error.message}`);
        return res.redirect('/auth/dashboard');
    }
};

// ==================== DETALLE ====================
const detalleCliente = async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id);
        if (!cliente) {
            req.flash('error', 'Cliente no encontrado.');
            return res.redirect('/clientes');
        }
        res.render('clientes/detalle', {
            titulo: 'Detalle Cliente',
            cliente,
            rutaActiva: 'clientes',
        });
    } catch (error) {
        req.flash('error', `Error al cargar el cliente: ${error.message}`);
        return res.redirect('/clientes');
    }
};

// ==================== CREAR (Vista) ====================
const renderCrearCliente = (req, res) => {
    res.render('clientes/formulario', { titulo: 'Nuevo Cliente', cliente: null, rutaActiva: 'clientes' });
};

// ==================== CREAR (POST) ====================
const crearCliente = async (req, res) => {
    try {
        const { nombre, correo, telefono, direccion } = req.body;

        if (!nombre || !correo || !telefono || !direccion) {
            req.flash('error', 'Por favor completa todos los campos.');
            return res.render('clientes/formulario', { titulo: 'Nuevo Cliente', cliente: null, rutaActiva: 'clientes' });
        }

        const existe = await Cliente.findOne({ correo: correo.toLowerCase().trim() });
        if (existe) {
            req.flash('error', 'El correo ya está registrado.');
            return res.render('clientes/formulario', { titulo: 'Nuevo Cliente', cliente: null, rutaActiva: 'clientes' });
        }

        await Cliente.create({
            nombre: nombre.trim(),
            correo: correo.toLowerCase().trim(),
            telefono: telefono.trim(),
            direccion: direccion.trim(),
        });

        req.flash('success', '¡Cliente creado exitosamente!');
        return res.redirect('/clientes');
    } catch (error) {
        if (error.code === 11000) {
            req.flash('error', 'El correo ya está registrado.');
        } else {
            req.flash('error', `Error al crear el cliente: ${error.message}`);
        }
        return res.render('clientes/formulario', { titulo: 'Nuevo Cliente', cliente: null, rutaActiva: 'clientes' });
    }
};

// ==================== EDITAR (Vista) ====================
const renderEditarCliente = async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id);
        if (!cliente) {
            req.flash('error', 'Cliente no encontrado.');
            return res.redirect('/clientes');
        }
        res.render('clientes/formulario', {
            titulo: 'Editar Cliente',
            cliente,
            rutaActiva: 'clientes',
        });
    } catch (error) {
        req.flash('error', `Error al cargar el cliente: ${error.message}`);
        return res.redirect('/clientes');
    }
};

// ==================== EDITAR (POST) ====================
const editarCliente = async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id);
        if (!cliente) {
            req.flash('error', 'Cliente no encontrado.');
            return res.redirect('/clientes');
        }

        const { nombre, correo, telefono, direccion } = req.body;

        const correoNormalizado = (correo || '').toLowerCase().trim();
        if (correoNormalizado !== cliente.correo) {
            const duplicado = await Cliente.findOne({
                correo: correoNormalizado,
                _id: { $ne: cliente._id },
            });
            if (duplicado) {
                req.flash('error', 'El correo ya está registrado.');
                return res.render('clientes/formulario', {
                    titulo: 'Editar Cliente',
                    cliente,
                    rutaActiva: 'clientes',
                });
            }
            cliente.correo = correoNormalizado;
        }

        cliente.nombre = (nombre || '').trim();
        cliente.telefono = (telefono || '').trim();
        cliente.direccion = (direccion || '').trim();

        await cliente.save();

        req.flash('success', '¡Cliente actualizado exitosamente!');
        return res.redirect('/clientes');
    } catch (error) {
        if (error.code === 11000) {
            req.flash('error', 'El correo ya está registrado.');
        } else {
            req.flash('error', `Error al actualizar el cliente: ${error.message}`);
        }
        return res.redirect(`/clientes/${req.params.id}/editar`);
    }
};

// ==================== ACTIVAR / DESACTIVAR ====================
const alternarEstadoCliente = async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id);
        if (!cliente) {
            req.flash('error', 'Cliente no encontrado.');
            return res.redirect('/clientes');
        }

        cliente.activo = !cliente.activo;
        await cliente.save();

        const estado = cliente.activo ? 'activado' : 'desactivado';
        req.flash('success', `Cliente ${estado} exitosamente.`);
        return res.redirect('/clientes');
    } catch (error) {
        req.flash('error', `Error al cambiar el estado: ${error.message}`);
        return res.redirect('/clientes');
    }
};

// ==================== API (JSON) ====================
const apiListarClientes = async (req, res) => {
    try {
        const clientes = await Cliente.find().sort({ createdAt: -1 });
        return res.json({ success: true, data: clientes });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

const apiCrearCliente = async (req, res) => {
    try {
        const { nombre, correo, telefono, direccion } = req.body;

        if (!nombre || !correo || !telefono || !direccion) {
            return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
        }

        const existe = await Cliente.findOne({ correo: correo.toLowerCase().trim() });
        if (existe) {
            return res.status(409).json({ success: false, message: 'El correo ya está registrado.' });
        }

        const cliente = await Cliente.create({
            nombre: nombre.trim(),
            correo: correo.toLowerCase().trim(),
            telefono: telefono.trim(),
            direccion: direccion.trim(),
        });

        return res.status(201).json({ success: true, data: cliente });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

const apiDetalleCliente = async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id);
        if (!cliente) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
        }
        return res.json({ success: true, data: cliente });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

module.exports = {
    listarClientes,
    detalleCliente,
    renderCrearCliente,
    crearCliente,
    renderEditarCliente,
    editarCliente,
    alternarEstadoCliente,
    apiListarClientes,
    apiCrearCliente,
    apiDetalleCliente,
};