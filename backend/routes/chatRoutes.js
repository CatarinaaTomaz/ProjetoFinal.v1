// backend/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/', chatController.processarMensagem);

module.exports = router;