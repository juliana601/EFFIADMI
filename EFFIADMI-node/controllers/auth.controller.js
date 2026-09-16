const User = require('../models/User');

// ==================== LOGIN ====================
const renderLogin = (req, res) => {
    if (req.session.logueado) {
        return res.redirect('/auth/dashboard');
    }
    res.render('auth/login', {
        titulo: 'Iniciar sesión',
        errores: {},
        valores: {},
    });
};

const iniciarSesion = async (req, res) => {
    try {
        const { username, password } = req.body;

        const valores = { username: (username || '').trim() };
        const errores = {};

        if (!valores.username) {
            errores.username = 'Ingresa tu correo electrónico.';
        }
        if (!password) {
            errores.password = 'Ingresa tu contraseña.';
        }

        if (Object.keys(errores).length > 0) {
            return res.status(400).render('auth/login', {
                titulo: 'Iniciar sesión',
                errores,
                valores,
            });
        }

        const usuario = await User.findOne({ email: valores.username.toLowerCase() });

        if (!usuario) {
            errores.username = 'Correo o contraseña incorrectos.';
            errores.password = 'Correo o contraseña incorrectos.';
            return res.status(401).render('auth/login', {
                titulo: 'Iniciar sesión',
                errores,
                valores,
            });
        }

        if (!usuario.activo) {
            errores.username = 'Tu cuenta está desactivada. Contacta al administrador.';
            return res.status(403).render('auth/login', {
                titulo: 'Iniciar sesión',
                errores,
                valores,
            });
        }

        const contrasenaValida = await usuario.compararContrasena(password);
        if (!contrasenaValida) {
            errores.username = 'Correo o contraseña incorrectos.';
            errores.password = 'Correo o contraseña incorrectos.';
            return res.status(401).render('auth/login', {
                titulo: 'Iniciar sesión',
                errores,
                valores,
            });
        }

        req.session.logueado = {
            id: usuario._id,
            nombre: usuario.nombreCompleto(),
            email: usuario.email,
            rol: usuario.rol,
        };

        req.flash('success', `¡Bienvenido, ${usuario.nombreCompleto()}!`);
        return res.redirect('/auth/dashboard');
    } catch (error) {
        req.flash('error', `Error al iniciar sesión: ${error.message}`);
        return res.redirect('/auth/login');
    }
};

// ==================== API LOGIN (JSON) ====================
const iniciarSesionApi = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Correo y contraseña son obligatorios.' });
        }

        const usuario = await User.findOne({ email: username.toLowerCase().trim() });

        if (!usuario) {
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
        }

        if (!usuario.activo) {
            return res.status(403).json({ success: false, message: 'Cuenta desactivada.' });
        }

        const contrasenaValida = await usuario.compararContrasena(password);
        if (!contrasenaValida) {
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
        }

        req.session.logueado = {
            id: usuario._id,
            nombre: usuario.nombreCompleto(),
            email: usuario.email,
            rol: usuario.rol,
        };

        return res.json({
            success: true,
            data: {
                usuario: usuario.toJSON(),
                sesion: req.session.logueado,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

// ==================== REGISTRO ====================
const renderRegistro = (req, res) => {
    if (req.session.logueado) {
        return res.redirect('/auth/dashboard');
    }
    res.render('auth/registro', {
        titulo: 'Crear cuenta',
        errores: {},
        valores: {},
    });
};

const registrarUsuario = async (req, res) => {
    try {
        const valores = {
            nombre: (req.body.nombre || '').trim(),
            apellido: (req.body.apellido || '').trim(),
            email: (req.body.email || '').trim(),
        };
        const errores = {};

        const emailNormalizado = valores.email.toLowerCase();
        const password = req.body.password || '';
        const confirmarPassword = req.body.confirmarPassword || '';

        if (!valores.nombre) {
            errores.nombre = 'El nombre es obligatorio.';
        }
        if (!valores.apellido) {
            errores.apellido = 'El apellido es obligatorio.';
        }
        if (!valores.email) {
            errores.email = 'El correo electrónico es obligatorio.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
            errores.email = 'Ingresa un correo electrónico válido.';
        }
        if (!password) {
            errores.password = 'La contraseña es obligatoria.';
        } else if (password.length < 6) {
            errores.password = 'La contraseña debe tener al menos 6 caracteres.';
        } else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) {
            errores.password = 'La contraseña debe incluir letras y números.';
        }
        if (!confirmarPassword) {
            errores.confirmarPassword = 'Confirma tu contraseña.';
        } else if (password !== confirmarPassword) {
            errores.confirmarPassword = 'Las contraseñas no coinciden.';
        }

        if (!errores.email && !errores.password) {
            const existe = await User.findOne({
                $or: [{ email: emailNormalizado }, { username: emailNormalizado }],
            });
            if (existe) {
                errores.email = 'El correo ya está registrado.';
            }
        }

        if (Object.keys(errores).length > 0) {
            return res.status(400).render('auth/registro', {
                titulo: 'Crear cuenta',
                errores,
                valores,
            });
        }

        await User.create({
            username: emailNormalizado,
            email: emailNormalizado,
            password,
            nombre: valores.nombre,
            apellido: valores.apellido,
            rol: 'operador',
            activo: true,
        });

        req.flash('success', '¡Cuenta creada exitosamente! Ya puedes iniciar sesión.');
        return res.redirect('/auth/login');
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).render('auth/registro', {
                titulo: 'Crear cuenta',
                errores: { email: 'El correo ya está registrado.' },
                valores,
            });
        }
        return res.status(500).render('auth/registro', {
            titulo: 'Crear cuenta',
            errores: { general: `Error al crear la cuenta: ${error.message}` },
            valores,
        });
    }
};

// ==================== LOGOUT ====================
const cerrarSesion = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            req.flash('warning', `Error al cerrar sesión: ${err.message}`);
            return res.redirect('/auth/dashboard');
        }
        res.clearCookie('connect.sid');
        req.flash('success', '¡Sesión cerrada exitosamente!');
        return res.redirect('/auth/login');
    });
};

// ==================== DASHBOARD ====================
const dashboard = (req, res) => {
    res.render('dashboard/index', {
        titulo: 'Panel principal',
        usuarioSesion: req.session.logueado,
        rutaActiva: 'dashboard',
    });
};

// ==================== PERFIL ====================
const verPerfil = async (req, res) => {
    try {
        const usuario = await User.findById(req.session.logueado.id);
        if (!usuario) {
            req.flash('error', 'Usuario no encontrado.');
            return res.redirect('/auth/logout');
        }
        res.render('auth/perfil', {
            titulo: 'Mi perfil',
            usuario: usuario,
            rutaActiva: 'perfil',
        });
    } catch (error) {
        req.flash('error', `Error al cargar el perfil: ${error.message}`);
        return res.redirect('/auth/dashboard');
    }
};

const actualizarPerfil = async (req, res) => {
    try {
        const usuario = await User.findById(req.session.logueado.id);
        if (!usuario) {
            req.flash('error', 'Usuario no encontrado.');
            return res.redirect('/auth/logout');
        }

        usuario.nombre = req.body.nombre || '';
        usuario.apellido = req.body.apellido || '';
        usuario.email = req.body.email || usuario.email;
        usuario.telefono = req.body.telefono || '';
        usuario.direccion = req.body.direccion || '';

        if (req.body.password) {
            usuario.password = req.body.password;
        }

        await usuario.save();

        req.session.logueado.nombre = usuario.nombreCompleto();
        req.session.logueado.email = usuario.email;

        req.flash('success', '¡Perfil actualizado exitosamente!');
        return res.redirect('/auth/perfil');
    } catch (error) {
        req.flash('error', `Error al actualizar el perfil: ${error.message}`);
        return res.redirect('/auth/perfil');
    }
};

// ==================== SESIÓN ACTUAL (API JSON) ====================
const sesionActual = (req, res) => {
    if (!req.session.logueado) {
        return res.status(401).json({ success: false, message: 'Sin sesión activa.' });
    }
    return res.json({ success: true, data: req.session.logueado });
};

module.exports = {
    renderLogin,
    iniciarSesion,
    iniciarSesionApi,
    cerrarSesion,
    renderRegistro,
    registrarUsuario,
    dashboard,
    verPerfil,
    actualizarPerfil,
    sesionActual,
};