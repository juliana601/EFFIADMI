const express = require('express');
const router = express.Router();

const reportesController = require('../controllers/reportes.controller');
const { requireLogin } = require('../middleware/auth');
const { requireRole, requireRoleApi } = require('../middleware/roles');

// ==================== API (JSON) ====================
router.get('/api', requireLogin, requireRoleApi('admin', 'operador'), reportesController.apiListarReportes);

// ==================== VISTAS (EJS) ====================
// listar/crear: admin + operador | responder: solo admin
router.get('/', requireLogin, requireRole('admin', 'operador'), reportesController.listaReportes);
router.post('/', requireLogin, requireRole('admin', 'operador'), reportesController.crearReporte);

// GET: detalle (operador solo el suyo) | POST: responder (admin)
router.get('/:id/', requireLogin, requireRole('admin', 'operador'), reportesController.detalleReporte);
router.post('/:id/', requireLogin, requireRole('admin'), reportesController.detalleReporte);

module.exports = router;