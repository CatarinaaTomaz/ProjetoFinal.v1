const express = require('express');
const router = express.Router();
const inscricaoController = require('../controllers/inscricaoController');

// Rota para descobrir o curso do aluno
router.get('/aluno/:id', inscricaoController.obterCursoDoAluno);

module.exports = router;