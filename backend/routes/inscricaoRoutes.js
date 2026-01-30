const express = require('express');
const router = express.Router();
const inscricaoController = require('../controllers/inscricaoController');

// Rotas do Aluno
router.get('/aluno/:id', inscricaoController.obterCursoDoAluno);
router.post('/', inscricaoController.criarInscricao); // Botão Candidatar

// Rotas de Gestão (Admin)
router.get('/pendentes', inscricaoController.listarPendentes); // Tabela "Gestão Candidaturas"
router.put('/:id', inscricaoController.gerirCandidatura); // Aprovar/Rejeitar

module.exports = router;