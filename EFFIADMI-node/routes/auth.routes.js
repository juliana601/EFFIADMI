const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { requireLogin, requireLoginApi } = require('../middleware/auth');

// ==================== VISTAS (EJS) ====================
router.get('/login', authController.renderLogin);
router.post('/login', authController.iniciarSesion);
router.get('/registro', authController.renderRegistro);
router.post('/registro', authController.registrarUsuario);
router.get('/logout', requireLogin, authController.cerrarSesion);

router.get('/dashboard', requireLogin, authController.dashboard);
router.get('/perfil', requireLogin, authController.verPerfil);
router.post('/perfil', requireLogin, authController.actualizarPerfil);

// ==================== API (JSON) ====================
router.post('/api/login', authController.iniciarSesionApi);
router.get('/api/sesion', requireLoginApi, authController.sesionActual);

module.exports = router;