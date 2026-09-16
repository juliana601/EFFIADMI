const express = require('express');
const router = express.Router();

const pedidoController = require('../controllers/pedidos.controller');
const { requireLogin } = require('../middleware/auth');
const { requireRole, requireRoleApi } = require('../middleware/roles');

// ==================== API (JSON) - Antes de /:id ====================
router.get('/api', requireLogin, requireRoleApi('admin', 'operador'), pedidoController.apiListarPedidos);
router.get('/api/:id', requireLogin, requireRoleApi('admin', 'operador'), pedidoController.apiDetallePedido);

// ==================== VISTAS (EJS) ====================
router.get('/', requireLogin, requireRole('admin', 'operador'), pedidoController.listaPedidos);
router.get('/crear', requireLogin, requireRole('admin', 'operador'), pedidoController.renderCrearPedido);
router.post('/crear', requireLogin, requireRole('admin', 'operador'), pedidoController.crearPedido);
router.get('/:id/editar', requireLogin, requireRole('admin', 'operador'), pedidoController.editarPedido);
router.post('/:id/eliminar', requireLogin, requireRole('admin'), pedidoController.eliminarPedido);
router.post('/:id/confirmar', requireLogin, requireRole('admin', 'operador'), pedidoController.confirmarPedido);
router.post('/:id/cancelar', requireLogin, requireRole('admin', 'operador'), pedidoController.cancelarPedido);
router.post('/:id/pagar', requireLogin, requireRole('admin', 'operador'), pedidoController.pagarPedido);
router.get('/:id/', requireLogin, requireRole('admin', 'operador'), pedidoController.detallePedido);

module.exports = router;