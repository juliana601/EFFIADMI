const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const { requireLogin } = require('../middleware/auth');

// ==================== DASHBOARD (EJS) ====================
router.get('/', requireLogin, dashboardController.renderDashboard);

module.exports = router;
