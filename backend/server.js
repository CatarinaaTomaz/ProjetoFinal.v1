const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

// Configuração do ambiente
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Teste de Debug
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

// Importar Modelos
const { User, Role } = require('./models/associations');

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

const PORT = process.env.PORT || 3000;

// --- FUNÇÃO DE CORREÇÃO AUTOMÁTICA ---
async function fixTabelaDisponibilidades() {
    try {
        console.log("🛠️ A tentar corrigir a tabela 'disponibilidades'...");
        // Desliga a segurança, apaga a tabela estragada e volta a ligar
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        await db.query('DROP TABLE IF EXISTS disponibilidades');
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log("✅ Tabela limpa com sucesso! O Sequelize vai recriá-la agora.");
    } catch (error) {
        console.error("⚠️ Erro ao tentar limpar tabela (pode já não existir):", error);
    }
}

// --- FUNÇÕES DE INICIALIZAÇÃO ---
async function criarRolesIniciais() {
    try {
        const roles = ['Admin', 'Formando', 'Formador', 'Secretaria'];
        for (const roleName of roles) {
            await Role.findOrCreate({ where: { descricao: roleName } });
        }
        console.log('Roles verificadas!');
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
                const password_hash = await bcrypt.hash('pass614', salt);
                
                await User.create({
                    nome_completo: 'Administrador Principal',
                    email: emailAdmin,
                    password: password_hash, 
                    conta_ativa: true,
                    roleId: roleAdmin.id_role
                });
                console.log('✅ Admin criado!');
            }
        }
    } catch (error) { console.error('Erro ao criar admin:', error); }
}

// --- ARRANCAR SERVIDOR ---
db.authenticate()
    .then(async () => {
        // 1. Executa a correção da tabela
        await fixTabelaDisponibilidades();
        
        // 2. Sincroniza (Recria a tabela limpa)
        await db.sync({ alter: true });
        
        // 3. Cria dados iniciais
        await criarRolesIniciais();
        await criarAdminInicial();

        console.log('Base de dados sincronizada!');
        app.listen(PORT, () => console.log(`🚀 Servidor a correr na porta ${PORT}`));
    })
    .catch((err) => {
        console.error('Erro fatal ao arrancar:', err);
    });