const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rotas CRUD para Gestão de Utilizadores 
router.get('/', userController.getAllUsers);       // Listar todos
router.get('/:id', userController.getUserById);    // Ver um específico
router.put('/:id', userController.updateUser);     // Editar
router.delete('/:id', userController.deleteUser);  // Apagar

module.exports = router;