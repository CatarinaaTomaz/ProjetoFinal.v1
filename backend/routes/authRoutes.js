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
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

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

// --- ROTAS FACEBOOK ---
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login.html' }),
  (req, res) => {
    const user = req.user;
    
    // Gerar Token
    const token = jwt.sign(
        { id: user.id_user, role: user.Role.descricao }, 
        process.env.JWT_SECRET || 'segredo_super_secreto', 
        { expiresIn: '1h' }
    );

    // Preparar dados para URL
    const userString = encodeURIComponent(JSON.stringify({
        id: user.id_user,
        nome: user.nome_completo,
        email: user.email,
        role: user.Role.descricao
    }));

    // Redirecionar (Ajusta a porta 5500 se necessário)
    res.redirect(`http://127.0.0.1:5500/frontend/dashboard.html?token=${token}&user=${userString}`);
  }
);

module.exports = router;