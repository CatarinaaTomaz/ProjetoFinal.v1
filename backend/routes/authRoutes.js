const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

// Definir as rotas (POST porque estamos a enviar dados)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify/:token', authController.verifyEmail);
router.post('/verify-2fa', authController.verifyTwoFactor);

// --- ROTAS GOOGLE ---

// 1. Inicia o pedido (manda para a Google)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. Recebe a resposta da Google
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login.html' }),
  (req, res) => {
    // Se chegou aqui, o user está logado (req.user)
    const user = req.user;

    // Gerar o nosso Token JWT (igual ao login normal)
    const token = jwt.sign(
        { id: user.id_user, role: user.Role.descricao }, 
        process.env.JWT_SECRET || 'segredo_super_secreto', 
        { expiresIn: '1h' }
    );

    // Redirecionar para o Frontend enviando o token na URL
    // Codificamos o user em string para o frontend ler
    const userString = encodeURIComponent(JSON.stringify({
        id: user.id_user,
        nome: user.nome_completo,
        email: user.email,
        role: user.Role.descricao
    }));

    res.redirect(`http://127.0.0.1:5500/frontend/dashboard.html?token=${token}&user=${userString}`);
  }
);

module.exports = router;