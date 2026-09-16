const express = require('express');
const router = express.Router();

const clienteController = require('../controllers/clientes.controller');
const { requireLogin } = require('../middleware/auth');
const { requireRole, requireRoleApi } = require('../middleware/roles');

// ==================== API (JSON) ====================
router.get('/api', requireLogin, requireRoleApi('admin', 'operador'), clienteController.apiListarClientes);
router.get('/api/:id', requireLogin, requireRoleApi('admin', 'operador'), clienteController.apiDetalleCliente);
router.post('/api', requireLogin, requireRoleApi('admin', 'operador'), clienteController.apiCrearCliente);

// ==================== VISTAS (EJS) ====================
// crear: admin + operador | editar/alternar estado: solo admin (como en Django)
router.get('/', requireLogin, requireRole('admin', 'operador'), clienteController.listarClientes);
router.get('/crear', requireLogin, requireRole('admin', 'operador'), clienteController.renderCrearCliente);
router.post('/crear', requireLogin, requireRole('admin', 'operador'), clienteController.crearCliente);
router.get('/:id', requireLogin, requireRole('admin', 'operador'), clienteController.detalleCliente);
router.get('/:id/editar', requireLogin, requireRole('admin'), clienteController.renderEditarCliente);
router.post('/:id/editar', requireLogin, requireRole('admin'), clienteController.editarCliente);
router.post('/:id/estado', requireLogin, requireRole('admin'), clienteController.alternarEstadoCliente);

module.exports = router;