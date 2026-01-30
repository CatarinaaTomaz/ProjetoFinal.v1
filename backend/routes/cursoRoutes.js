const express = require('express');
const router = express.Router();
const cursoController = require('../controllers/cursoController');
const inscricaoController = require('../controllers/inscricaoController'); 

// 1. Rotas CRUD de Cursos
router.get('/', cursoController.listarCursos);
router.post('/', cursoController.criarCurso);
router.put('/:id', cursoController.atualizarCurso);
router.delete('/:id', cursoController.eliminarCurso);

// 2. Rota Inteligente (Para a Tabela do Aluno)
router.get('/disponiveis/:userId', cursoController.listarCursosParaCandidatura);

// 3. ROTAS DE ALUNOS NOS CURSOS (ADMIN)
// Como o Admin manda pedidos para /api/cursos/:id/alunos, definimos aqui,
// mas usamos a função que está no inscricaoController.
router.get('/:id/alunos', inscricaoController.listarAlunosCurso);
router.post('/:id/alunos', inscricaoController.adicionarAluno); // <--- O BOTÃO AZUL
router.delete('/:id/alunos/:alunoId', inscricaoController.removerAluno);

module.exports = router;