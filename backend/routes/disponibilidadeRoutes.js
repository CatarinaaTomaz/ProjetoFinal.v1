const express = require('express');
const router = express.Router();
const disponibilidadeController = require('../controllers/disponibilidadeController');

router.post('/', disponibilidadeController.adicionar);
router.get('/:id', disponibilidadeController.listar); // O ID aqui é do Formador
router.delete('/:id', disponibilidadeController.eliminar); // O ID aqui é da Disponibilidade

module.exports = router;