const express = require('express');
const router = express.Router();

const notificacionesController = require('../controllers/notificaciones.controller');
const { requireLogin } = require('../middleware/auth');
const { requireLoginApi } = require('../middleware/auth');

// ==================== VISTAS ====================
router.get('/', requireLogin, notificacionesController.listaNotificaciones);
router.post('/marcar-todas', requireLogin, notificacionesController.marcarTodasLeidas);
router.post('/:id/leer', requireLogin, notificacionesController.marcarLeida);
router.post('/:id/eliminar', requireLogin, notificacionesController.eliminarNotificacion);

// ==================== API ====================
router.get('/api/no-leidas', requireLoginApi, notificacionesController.apiNoLeidas);

module.exports = router;
