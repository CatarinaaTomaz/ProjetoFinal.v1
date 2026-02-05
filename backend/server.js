const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

// Configuração do ambiente
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log("--------------------------------------");
console.log("Estado do Servidor:");
console.log("Email User:", process.env.EMAIL_USER ? "✅ Carregado" : "❌ Falta no .env");
console.log("Google ID:", process.env.GOOGLE_CLIENT_ID ? "✅ Carregado" : "❌ Falta no .env");
console.log("--------------------------------------");

const db = require('./config/db'); 

// Importar Rotas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const cursoRoutes = require('./routes/cursoRoutes');
const moduloRoutes = require('./routes/moduloRoutes');
const salaRoutes = require('./routes/salaRoutes');
const statsRoutes = require('./routes/statsRoutes');
const chatRoutes = require('./routes/chatRoutes');
const horarioRoutes = require('./routes/horarioRoutes');
const disponibilidadeRoutes = require('./routes/disponibilidadeRoutes');
const inscricaoRoutes = require('./routes/inscricaoRoutes');

// Importar Associações
require('./models/associations'); 

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use('/api/auth', authRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/modulos', moduloRoutes);
app.use('/api/salas', salaRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/disponibilidades', disponibilidadeRoutes);
app.use('/api/inscricoes', inscricaoRoutes);

const PORT = process.env.PORT || 3000;
// O '0.0.0.0' diz ao servidor: "Aceita pedidos de qualquer lado!"
app.listen(PORT, '0.0.0.0', () => { 
    console.log(`🚀 Servidor a ouvir em todas as interfaces na porta ${PORT}`);
});

// --- FUNÇÕES DE INICIALIZAÇÃO ---
const { Role, User } = require('./models/associations');

async function criarRolesIniciais() {
    try {
        const roles = ['Admin', 'Formando', 'Formador', 'Secretaria'];
        for (const roleName of roles) {
            await Role.findOrCreate({ where: { descricao: roleName } });
        }
        console.log('✅ Roles verificadas!');
    } catch (error) { console.error('Erro roles:', error); }
}

async function criarAdminInicial() {
    try {
        const emailAdmin = 'shidysuns7@gmail.com'; 
        const adminExiste = await User.findOne({ where: { email: emailAdmin } });
        
        if (!adminExiste) {
            const roleAdmin = await Role.findOne({ where: { descricao: 'Admin' } });
            if (roleAdmin) {
                const salt = await bcrypt.genSalt(10);
                const password_hash_gerada = await bcrypt.hash('pass614', salt);
                
                await User.create({
                    nome_completo: 'Administrador Principal',
                    email: emailAdmin,
                    password_hash: password_hash_gerada,
                    conta_ativa: true,
                    roleId: roleAdmin.id_role
                });
                console.log('✅ Admin criado com sucesso!');
            }
        } else {
            console.log('✅ Admin já existe (dados preservados).');
        }
    } catch (error) { 
        console.error('❌ Erro ao criar admin:', error.message); 
    }
}

// --- ARRANCAR SERVIDOR (MODO DEFINITIVO) ---
db.authenticate()
    .then(async () => {
        console.log('✅ Ligação à BD estabelecida.');

        // ALTER: TRUE -> Mantém os dados e só atualiza colunas se necessário
        await db.sync({ alter: true }); 
        
        console.log('💾 Base de Dados sincronizada (Dados Preservados)!');

        await criarRolesIniciais();
        await criarAdminInicial();

        app.listen(PORT, () => console.log(`🚀 Servidor a correr na porta ${PORT}`));
    })
    .catch((err) => {
        console.error('❌ Erro fatal ao arrancar:', err);
    });