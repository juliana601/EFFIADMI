const User = require('../models/User');

// ==================== LISTAR ====================
const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await User.find().sort({ createdAt: -1 });
        res.render('usuarios/lista', {
            titulo: 'Usuarios',
            usuarios,
            rutaActiva: 'usuarios',
        });
    } catch (error) {
        req.flash('error', `Error al listar usuarios: ${error.message}`);
        return res.redirect('/auth/dashboard');
    }
};

// ==================== CREAR (Vista) ====================
const renderCrearUsuario = (req, res) => {
    res.render('usuarios/crear', { titulo: 'Nuevo Usuario', rutaActiva: 'usuarios' });
};

// ==================== CREAR (POST) ====================
const crearUsuario = async (req, res) => {
    try {
        const { nombre, apellido, email, password, rol } = req.body;

        if (!nombre || !email || !password || !rol) {
            req.flash('error', 'Por favor completa todos los campos.');
            return res.render('usuarios/crear', { titulo: 'Nuevo Usuario', rutaActiva: 'usuarios' });
        }

        const emailNormalizado = email.toLowerCase().trim();

        const existe = await User.findOne({
            $or: [{ email: emailNormalizado }, { username: emailNormalizado }],
        });
        if (existe) {
            req.flash('error', 'El correo ya está registrado.');
            return res.render('usuarios/crear', { titulo: 'Nuevo Usuario', rutaActiva: 'usuarios' });
        }

        await User.create({
            username: emailNormalizado,
            email: emailNormalizado,
            password,
            nombre: nombre.trim(),
            apellido: (apellido || '').trim(),
            rol,
            activo: true,
        });

        req.flash('success', '¡Usuario creado exitosamente!');
        return res.redirect('/usuarios');
    } catch (error) {
        if (error.code === 11000) {
            req.flash('error', 'El correo ya está registrado.');
        } else {
            req.flash('error', `Error al crear el usuario: ${error.message}`);
        }
        return res.render('usuarios/crear', { titulo: 'Nuevo Usuario', rutaActiva: 'usuarios' });
    }
};

// ==================== EDITAR (Vista) ====================
const renderEditarUsuario = async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id);
        if (!usuario) {
            req.flash('error', 'Usuario no encontrado.');
            return res.redirect('/usuarios');
        }
        res.render('usuarios/editar', {
            titulo: 'Editar Usuario',
            usuario,
            rutaActiva: 'usuarios',
        });
    } catch (error) {
        req.flash('error', `Error al cargar el usuario: ${error.message}`);
        return res.redirect('/usuarios');
    }
};

// ==================== EDITAR (POST) ====================
const editarUsuario = async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id);
        if (!usuario) {
            req.flash('error', 'Usuario no encontrado.');
            return res.redirect('/usuarios');
        }

        const { nombre, apellido, email, password, rol } = req.body;

        usuario.nombre = (nombre || '').trim();
        usuario.apellido = (apellido || '').trim();
        usuario.rol = rol || usuario.rol;

        const emailNormalizado = (email || '').toLowerCase().trim();
        if (emailNormalizado && emailNormalizado !== usuario.email) {
            const duplicado = await User.findOne({
                email: emailNormalizado,
                _id: { $ne: usuario._id },
            });
            if (duplicado) {
                req.flash('error', 'El correo ya está registrado.');
                return res.render('usuarios/editar', {
                    titulo: 'Editar Usuario',
                    usuario,
                    rutaActiva: 'usuarios',
                });
            }
            usuario.email = emailNormalizado;
            usuario.username = emailNormalizado;
        }

        if (password) {
            usuario.password = password;
        }

        await usuario.save();

        req.flash('success', '¡Usuario actualizado exitosamente!');
        return res.redirect('/usuarios');
    } catch (error) {
        if (error.code === 11000) {
            req.flash('error', 'El correo ya está registrado.');
        } else {
            req.flash('error', `Error al actualizar el usuario: ${error.message}`);
        }
        return res.redirect(`/usuarios/${req.params.id}/editar`);
    }
};

// ==================== ACTIVAR / DESACTIVAR ====================
const alternarEstadoUsuario = async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id);
        if (!usuario) {
            req.flash('error', 'Usuario no encontrado.');
            return res.redirect('/usuarios');
        }

        if (usuario._id.toString() === req.session.logueado.id.toString()) {
            req.flash('warning', 'No puedes desactivar tu propia cuenta.');
            return res.redirect('/usuarios');
        }

        usuario.activo = !usuario.activo;
        await usuario.save();

        const estado = usuario.activo ? 'activado' : 'desactivado';
        req.flash('success', `¡Usuario ${estado} exitosamente!`);
        return res.redirect('/usuarios');
    } catch (error) {
        req.flash('error', `Error al cambiar el estado: ${error.message}`);
        return res.redirect('/usuarios');
    }
};

// ==================== API (JSON) ====================
const apiListarUsuarios = async (req, res) => {
    try {
        const usuarios = await User.find().select('-password').sort({ createdAt: -1 });
        return res.json({ success: true, data: usuarios });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

const apiCrearUsuario = async (req, res) => {
    try {
        const { nombre, apellido, email, password, rol } = req.body;

        if (!nombre || !email || !password || !rol) {
            return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
        }

        const emailNormalizado = email.toLowerCase().trim();
        const existe = await User.findOne({ email: emailNormalizado });
        if (existe) {
            return res.status(409).json({ success: false, message: 'El correo ya está registrado.' });
        }

        const usuario = await User.create({
            username: emailNormalizado,
            email: emailNormalizado,
            password,
            nombre: nombre.trim(),
            apellido: (apellido || '').trim(),
            rol,
            activo: true,
        });

        return res.status(201).json({ success: true, data: usuario.toJSON() });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

module.exports = {
    listarUsuarios,
    renderCrearUsuario,
    crearUsuario,
    renderEditarUsuario,
    editarUsuario,
    alternarEstadoUsuario,
    apiListarUsuarios,
    apiCrearUsuario,
};