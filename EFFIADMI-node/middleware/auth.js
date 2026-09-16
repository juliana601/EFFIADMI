// ============================================================
// Middleware de autenticación
// Protege las rutas que requieren sesión iniciada
// ============================================================

const requireLogin = (req, res, next) => {
    if (req.session && req.session.logueado) {
        return next();
    }
    req.flash('error', 'Debes iniciar sesión para acceder a esta sección.');
    return res.redirect('/auth/login');
};

// Middleware para endpoints JSON (devuelve 401 en vez de redirigir)
const requireLoginApi = (req, res, next) => {
    if (req.session && req.session.logueado) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'No autorizado: inicia sesión.' });
};

module.exports = { requireLogin, requireLoginApi };