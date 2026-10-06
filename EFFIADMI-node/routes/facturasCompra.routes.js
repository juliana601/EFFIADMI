const express = require('express');
const router = express.Router();

const facturasCompraController = require('../controllers/facturasCompra.controller');
const { requireLogin } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

// ==================== VISTAS ====================
router.get('/', requireLogin, facturasCompraController.listaFacturas);
router.get('/crear', requireLogin, facturasCompraController.renderCrear);
router.post('/crear', requireLogin, facturasCompraController.crearFactura);
router.get('/:id', requireLogin, facturasCompraController.verFactura);
router.get('/exportar/excel', requireLogin, facturasCompraController.exportarExcel争);
router.post('/:id/eliminar', requireLogin, requireRole('ADMIN'), facturasCompraController.eliminarFactura);

module.exports = router;
