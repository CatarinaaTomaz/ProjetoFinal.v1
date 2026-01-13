const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rotas CRUD para Gestão de Utilizadores 
router.get('/', userController.listarTodos); //Listar
router.put('/:id', userController.updateUser);        // Editar dados
router.put('/:id/status', userController.toggleStatus); // Mudar estado
router.delete('/:id', userController.deleteUser);     // Eliminar

module.exports = router;