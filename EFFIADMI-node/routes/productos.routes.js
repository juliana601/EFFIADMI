const express = require('express');
const router = express.Router();

const productoController = require('../controllers/productos.controller');
const { requireLogin } = require('../middleware/auth');
const { requireRole, requireRoleApi } = require('../middleware/roles');

// ==================== API (JSON) ====================
router.get('/api', requireLogin, requireRoleApi('admin', 'operador'), productoController.apiListarProductos);
router.get('/api/:id', requireLogin, requireRoleApi('admin', 'operador'), productoController.apiDetalleProducto);

// ==================== VISTAS (EJS) ====================
// listar/ver: admin + operador | crear/editar/eliminar: solo admin (como en Django)
router.get('/', requireLogin, requireRole('admin', 'operador'), productoController.listarProductos);
router.get('/crear', requireLogin, requireRole('admin'), productoController.renderCrearProducto);
router.post('/crear', requireLogin, requireRole('admin'), productoController.crearProducto);
router.get('/:id/editar', requireLogin, requireRole('admin'), productoController.renderEditarProducto);
router.post('/:id/editar', requireLogin, requireRole('admin'), productoController.editarProducto);
router.post('/:id/eliminar', requireLogin, requireRole('admin'), productoController.alternarEstadoProducto);

module.exports = router;