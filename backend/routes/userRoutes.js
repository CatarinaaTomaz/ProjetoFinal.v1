const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');

// --- CONFIGURAÇÃO DO MULTER (UPLOAD) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Pasta onde guarda
    },
    filename: (req, file, cb) => {
        // Gera um nome único: id_do_user + data + extensão (ex: user-3-123456.jpg)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Rotas CRUD para Gestão de Utilizadores 
router.get('/', userController.listarTodos); //Listar
router.put('/:id', userController.updateUser);        // Editar dados
router.put('/:id/status', userController.toggleStatus); // Mudar estado
router.delete('/:id', userController.deleteUser);     // Eliminar

// NOVA ROTA: Upload de Foto
// 'foto' é o nome do campo que vamos enviar do frontend
router.post('/:id/foto', upload.single('foto'), userController.uploadFoto);

module.exports = router;