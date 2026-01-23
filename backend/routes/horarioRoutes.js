const express = require('express');
const router = express.Router();
const horarioController = require('../controllers/horarioController');

router.get('/', horarioController.listarHorarios);
router.post('/', horarioController.criarHorario);
router.delete('/:id', horarioController.eliminarHorario);

module.exports = router;