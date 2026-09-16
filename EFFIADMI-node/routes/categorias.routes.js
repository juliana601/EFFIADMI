const express = require('express');
const router = express.Router();

const categoriaController = require('../controllers/categorias.controller');
const { requireLogin } = require('../middleware/auth');
const { requireRole, requireRoleApi } = require('../middleware/roles');

// ==================== API (JSON) - Solo admin ====================
router.get('/api', requireLogin, requireRoleApi('admin'), categoriaController.apiListarCategorias);
router.post('/api', requireLogin, requireRoleApi('admin'), categoriaController.apiCrearCategoria);

// ==================== VISTAS (EJS) - Solo admin ====================
router.get('/', requireLogin, requireRole('admin'), categoriaController.listarCategorias);
router.get('/crear', requireLogin, requireRole('admin'), categoriaController.renderCrearCategoria);
router.post('/crear', requireLogin, requireRole('admin'), categoriaController.crearCategoria);
router.get('/:id/editar', requireLogin, requireRole('admin'), categoriaController.renderEditarCategoria);
router.post('/:id/editar', requireLogin, requireRole('admin'), categoriaController.editarCategoria);
router.post('/:id/eliminar', requireLogin, requireRole('admin'), categoriaController.eliminarCategoria);

module.exports = router;