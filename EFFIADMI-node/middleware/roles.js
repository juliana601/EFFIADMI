// ============================================================
// Middleware de roles
// Controla el acceso según el cargo del usuario (admin/operador)
// Uso: router.get('/', requireLogin, requireRole('admin'), controlador)
// ============================================================

const requireRole = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.session || !req.session.logueado) {
            req.flash('error', 'Debes iniciar sesión para acceder a esta sección.');
            return res.redirect('/auth/login');
        }

        const rolUsuario = req.session.logueado.rol;
        if (rolesPermitidos.includes(rolUsuario)) {
            return next();
        }

        req.flash('error', 'No tienes permisos para acceder a esta sección.');
        return res.redirect('/auth/dashboard');
    };
};

// Versión para endpoints JSON (devuelve 403)
const requireRoleApi = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.session || !req.session.logueado) {
            return res.status(401).json({ success: false, message: 'No autorizado: inicia sesión.' });
        }

        const rolUsuario = req.session.logueado.rol;
        if (rolesPermitidos.includes(rolUsuario)) {
            return next();
        }

        return res
            .status(403)
            .json({ success: false, message: 'Acceso denegado: no tienes el rol requerido.' });
    };
};

module.exports = { requireRole, requireRoleApi };