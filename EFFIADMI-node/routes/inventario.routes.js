const express = require('express');
const router = express.Router();

const inventarioController = require('../controllers/inventario.controller');
const { requireLogin } = require('../middleware/auth');
const { requireRole, requireRoleApi } = require('../middleware/roles');

// ==================== API (JSON) - Antes de /:id ====================
router.get('/api', requireLogin, requireRoleApi('admin', 'operador'), inventarioController.apiListarInventario);
router.get('/api/:id', requireLogin, requireRoleApi('admin', 'operador'), inventarioController.apiDetalleInventario);

// ==================== VISTAS (EJS) - Admin y operador ====================
router.get('/', requireLogin, requireRole('admin', 'operador'), inventarioController.listaInventario);
router.get('/:id/', requireLogin, requireRole('admin', 'operador'), inventarioController.detalleInventario);
router.get('/:id/movimiento', requireLogin, requireRole('admin', 'operador'), inventarioController.renderMovimiento);
router.post('/:id/movimiento', requireLogin, requireRole('admin', 'operador'), inventarioController.registrarMovimiento);

module.exports = router;