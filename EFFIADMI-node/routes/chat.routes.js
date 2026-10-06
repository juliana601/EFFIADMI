const express = require('express');
const router = express.Router();

const chatIAController = require('../controllers/chatIA.controller');
const { requireLogin } = require('../middleware/auth');

// ==================== CHAT CON IA (EJS) ====================
router.get('/', requireLogin, chatIAController.renderChat);
router.post('/enviar', requireLogin, chatIAController.enviarMensaje);
router.post('/borrar-historial', requireLogin, chatIAController.borrarHistorial);

module.exports = router;
