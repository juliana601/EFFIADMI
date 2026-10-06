const express = require('express');
const router = express.Router();

const correosController = require('../controllers/correos.controller');
const { requireLogin } = require('../middleware/auth');

// ==================== VISTAS ====================
router.get('/', requireLogin, correosController.listaCorreos);
router.get('/enviar', requireLogin, correosController.renderEnviar);
router.post('/enviar', requireLogin, correosController.enviarCorreo);
router.get('/:id', requireLogin, correosController.verCorreo);
router.post('/:id/leer', requireLogin, correosController.marcarLeido);
router.post('/:id/eliminar', requireLogin, correosController.eliminarCorreo);

module.exports = router;
