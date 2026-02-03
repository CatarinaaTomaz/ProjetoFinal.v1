const express = require('express');
const router = express.Router();
const controller = require('../controllers/horarioController'); 
const auth = require('../middleware/auth');

// ==========================================================
// ROTAS DE HORÁRIOS
// ==========================================================

router.get('/', auth, controller.listarHorarios);
router.post('/', auth, controller.criarHorario);
router.delete('/:id', auth, controller.eliminarHorario);
router.post('/auto', auth, controller.gerarHorariosAuto);

module.exports = router;