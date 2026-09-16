const express = require('express');
const router = express.Router();

const estadisticasController = require('../controllers/estadisticas.controller');
const { requireLogin } = require('../middleware/auth');
const { requireRole, requireRoleApi } = require('../middleware/roles');

// Solo admin (como en Django)
router.get('/api', requireLogin, requireRoleApi('admin'), estadisticasController.apiEstadisticas);
router.get('/', requireLogin, requireRole('admin'), estadisticasController.estadisticas);

module.exports = router;