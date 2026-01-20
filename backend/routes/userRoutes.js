const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// GARANTIR QUE A PASTA UPLOADS EXISTE
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. CONFIGURAÇÃO DO MULTER (Caminho Absoluto)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Agora usamos o caminho completo do sistema
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// DEBUG
if (!userController) console.error("ERRO: userController em falta!");

// 2. ROTAS
router.get('/', userController.listarUsers);
router.post('/', userController.criarUser);

// ROTA DE ATUALIZAÇÃO COM UPLOAD
router.put('/:id', upload.single('foto'), userController.atualizarUser);

router.delete('/:id', userController.eliminarUser);
router.put('/:id/status', userController.alterarEstado);

module.exports = router;