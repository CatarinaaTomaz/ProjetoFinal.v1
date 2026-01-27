const express = require('express');
const router = express.Router();
const moduloController = require('../controllers/moduloController');

// Se não tiveres middleware, remove o 'authMiddleware' das linhas abaixo
router.get('/', moduloController.listarModulos);
router.post('/', moduloController.criarModulo);
router.put('/:id', moduloController.atualizarModulo);
router.delete('/:id', moduloController.eliminarModulo);
router.get('/formador/:id', moduloController.listarModulosDoFormador);

module.exports = router;