const express = require('express');
const router = express.Router();

const facturaController = require('../controllers/facturas.controller');
const { requireLogin } = require('../middleware/auth');
const { requireRole, requireRoleApi } = require('../middleware/roles');

// ==================== API (JSON) - Antes de /:id ====================
router.get('/api', requireLogin, requireRoleApi('admin', 'operador'), facturaController.apiListarFacturas);
router.get('/api/:id', requireLogin, requireRoleApi('admin', 'operador'), facturaController.apiDetalleFactura);

// ==================== VISTAS (EJS) ====================
// listar/detalle: admin + operador | anular/eliminar/editar: solo admin (como en Django)
router.get('/', requireLogin, requireRole('admin', 'operador'), facturaController.listaFacturas);
router.post('/:id/anular', requireLogin, requireRole('admin'), facturaController.anularFactura);
router.post('/:id/eliminar', requireLogin, requireRole('admin'), facturaController.eliminarFactura);
router.get('/:id/editar', requireLogin, requireRole('admin'), facturaController.editarFactura);
router.get('/:id/', requireLogin, requireRole('admin', 'operador'), facturaController.detalleFactura);

module.exports = router;