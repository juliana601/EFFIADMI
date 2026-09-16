const express = require('express');
const router = express.Router();

const proveedorController = require('../controllers/proveedores.controller');
const { requireLogin } = require('../middleware/auth');
const { requireRole, requireRoleApi } = require('../middleware/roles');

// ==================== API (JSON) - Antes de /:id ====================
router.get('/api', requireLogin, requireRoleApi('admin', 'operador'), proveedorController.apiListarProveedores);
router.post('/api', requireLogin, requireRoleApi('admin'), proveedorController.apiCrearProveedor);

// ==================== VISTAS (EJS) ====================
// listar: admin + operador | crear/editar/estado: solo admin (como en Django)
router.get('/', requireLogin, requireRole('admin', 'operador'), proveedorController.listaProveedores);
router.get('/crear', requireLogin, requireRole('admin'), proveedorController.renderCrearProveedor);
router.post('/crear', requireLogin, requireRole('admin'), proveedorController.crearProveedor);
router.get('/:id/editar', requireLogin, requireRole('admin'), proveedorController.renderEditarProveedor);
router.post('/:id/editar', requireLogin, requireRole('admin'), proveedorController.editarProveedor);
router.post('/:id/eliminar', requireLogin, requireRole('admin'), proveedorController.alternarEstadoProveedor);

module.exports = router;