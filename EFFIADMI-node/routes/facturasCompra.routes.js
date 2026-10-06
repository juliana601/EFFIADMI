const express = require('express');
const router = express.Router();

const facturasCompraController = require('../controllers/facturasCompra.controller');
const { requireLogin } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// ==================== VISTAS ====================
router.get('/', requireLogin, facturasCompraController.listaFacturasCompra);
router.get('/crear', requireLogin, facturasCompraController.renderCrearFacturaCompra);
router.post('/crear', requireLogin, facturasCompraController.crearFacturaCompra);
router.get('/exportar/excel', requireLogin, facturasCompraController.exportarExcel);
router.get('/:id', requireLogin, facturasCompraController.detalleFacturaCompra);
router.post('/:id/eliminar', requireLogin, requireRole('admin'), facturasCompraController.eliminarFacturaCompra);

module.exports = router;
