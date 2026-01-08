const path = require('path');
// 1. Carregar as variáveis de ambiente PRIMEIRO
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        console.log("Google Login:", profile.emails[0].value);

        // 1. Verificar se o user já existe
        let user = await User.findOne({ 
            where: { email: profile.emails[0].value },
            include: Role
        });

        if (user) {
            // Se já existe, atualiza o GoogleID se não tiver
            if (!user.googleId) {
                user.googleId = profile.id;
                await user.save();
            }
            return done(null, user);
        }

        // 2. SE O USER É NOVO -> ATRIBUIR ROLE 'FORMANDO'
        // Procurar a Role 'Formando' na base de dados
        let roleAluno = await Role.findOne({ where: { descricao: 'Formando' } });
        
        // --- CORREÇÃO DE SEGURANÇA ---
        // Se a role 'Formando' não existir, CRIAMOS AGORA em vez de dar ID 1
        if (!roleAluno) {
             console.log("Aviso: Role 'Formando' não existia. A criar agora...");
             roleAluno = await Role.create({ descricao: 'Formando' });
        }

        // Criar password falsa
        const dummyPassword = await bcrypt.hash(Math.random().toString(36), 10);

        // Criar o utilizador com o ID da role 'Formando' garantido
        const newUser = await User.create({
            nome_completo: profile.displayName,
            email: profile.emails[0].value,
            password_hash: dummyPassword,
            googleId: profile.id,
            conta_ativa: true,
            roleId: roleAluno.id_role // <--- Agora usa sempre o ID correto!
        });
        
        const userWithRole = await User.findByPk(newUser.id_user, { include: Role });
        return done(null, userWithRole);

    } catch (err) {
        console.error("Erro Google:", err);
        return done(err, null);
    }
  }
));

module.exports = passport;