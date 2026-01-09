const path = require('path');
// 1. Carregar as variáveis de ambiente PRIMEIRO
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
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

// --- NOVA ESTRATÉGIA FACEBOOK ---
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email'] // Importante: Pedir estes campos
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        console.log("Facebook Login:", profile);

        // O Facebook às vezes não devolve email (se o user usou nº telemóvel)
        const email = profile.emails ? profile.emails[0].value : `fb_${profile.id}@no-email.com`;

        // 1. Verificar se user existe
        let user = await User.findOne({ where: { email: email }, include: Role });

        if (user) {
            if (!user.facebookId) {
                user.facebookId = profile.id;
                await user.save();
            }
            return done(null, user);
        }

        // 2. Criar novo user (Formando)
        let roleAluno = await Role.findOne({ where: { descricao: 'Formando' } });
        if (!roleAluno) roleAluno = await Role.create({ descricao: 'Formando' });

        const dummyPassword = await bcrypt.hash(Math.random().toString(36), 10);

        const newUser = await User.create({
            nome_completo: profile.displayName,
            email: email,
            password_hash: dummyPassword,
            facebookId: profile.id,
            conta_ativa: true,
            roleId: roleAluno.id_role
        });

        const userWithRole = await User.findByPk(newUser.id_user, { include: Role });
        return done(null, userWithRole);

    } catch (err) {
        console.error("Erro Facebook:", err);
        return done(err, null);
    }
  }
));

module.exports = passport;