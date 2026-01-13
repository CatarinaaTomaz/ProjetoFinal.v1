const express = require('express');
const router = express.Router();
const cursoController = require('../controllers/cursoController');

router.get('/', cursoController.listarCursos);
router.post('/', cursoController.criarCurso);
router.put('/:id', cursoController.atualizarCurso);
router.delete('/:id', cursoController.apagarCurso);

module.exports = router;