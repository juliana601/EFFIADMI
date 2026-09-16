const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuarios.controller');
const { requireLogin } = require('../middleware/auth');
const { requireRole, requireRoleApi } = require('../middleware/roles');

// ==================== VISTAS (EJS) - Solo admin ====================
router.get('/', requireLogin, requireRole('admin'), usuarioController.listarUsuarios);
router.get('/crear', requireLogin, requireRole('admin'), usuarioController.renderCrearUsuario);
router.post('/crear', requireLogin, requireRole('admin'), usuarioController.crearUsuario);
router.get('/:id/editar', requireLogin, requireRole('admin'), usuarioController.renderEditarUsuario);
router.post('/:id/editar', requireLogin, requireRole('admin'), usuarioController.editarUsuario);
router.post('/:id/estado', requireLogin, requireRole('admin'), usuarioController.alternarEstadoUsuario);

// ==================== API (JSON) - Solo admin ====================
router.get('/api', requireLogin, requireRoleApi('admin'), usuarioController.apiListarUsuarios);
router.post('/api', requireLogin, requireRoleApi('admin'), usuarioController.apiCrearUsuario);

module.exports = router;