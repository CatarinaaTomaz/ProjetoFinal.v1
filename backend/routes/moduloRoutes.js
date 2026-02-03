const express = require('express');
const router = express.Router();
const controller = require('../controllers/moduloController');
const auth = require('../middleware/auth'); // Confirma se tens o middleware de autenticação

// ==========================================================
// ROTAS DE MÓDULOS
// ==========================================================

router.get('/', auth, controller.listarModulos); 
router.post('/', auth, controller.criarModulo);
router.put('/:id', auth, controller.atualizarModulo);
router.delete('/:id', auth, controller.eliminarModulo); 

module.exports = router;