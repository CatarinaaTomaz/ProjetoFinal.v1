const express = require('express');
const router = express.Router();
const cursoController = require('../controllers/cursoController');

// Verificar se o controlador foi importado corretamente
if (!cursoController) {
    console.error("Erro: O controlador de cursos não foi importado corretamente.");
}

// Definição das Rotas
router.get('/', cursoController.listarCursos);
router.post('/', cursoController.criarCurso);
router.put('/:id', cursoController.atualizarCurso);
router.delete('/:id', cursoController.eliminarCurso);

module.exports = router;