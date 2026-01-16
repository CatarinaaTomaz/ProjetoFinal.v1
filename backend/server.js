const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); 

// Teste de Debug (Opcional: para veres no terminal se leu)
console.log("--------------------------------------");
console.log("Estado do Servidor:");
console.log("Email User:", process.env.EMAIL_USER ? "✅ Carregado" : "❌ Falta no .env");
console.log("Google ID:", process.env.GOOGLE_CLIENT_ID ? "✅ Carregado" : "❌ Falta no .env");
console.log("--------------------------------------");

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const cursoRoutes = require('./routes/cursoRoutes');
const db = require('./config/db');
const bcrypt = require('bcryptjs')
const express = require('express');
const { 
    User, Role, Curso, Sala, Modulo, Horario, Turma, 
    Inscricao, Avaliacao, Ficheiro,
    Disponibilidade, ChatMensagem, Falta,
    UserTurma 
} = require('./models/associations');

const app = express();

// Middlewares
app.use(cors()); // Permite que o FrontEnd aceda ao BackEnd
app.use(express.json()); // Permite ler JSON no body dos pedidos
// Isto diz: "Quem pedir '/uploads', mostramos os ficheiros da pasta real 'uploads'"
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use('/api/auth', authRoutes); 
app.use('/api/users', userRoutes)
app.use('/api/cursos', cursoRoutes);

// Teste de conexão e arranque
const PORT = process.env.PORT || 3000;

// Função para criar as Roles iniciais se não existirem
async function criarRolesIniciais() {
    try {
        const roles = ['Admin', 'Formando', 'Formador', 'Secretaria'];
        
        for (const roleName of roles) {
            await Role.findOrCreate({
                where: { descricao: roleName }
            });
        }
        console.log('Roles verificadas/criadas com sucesso!');
    } catch (error) {
        console.error('Erro ao criar roles:', error);
    }
}

// --- 2. NOVA FUNÇÃO: CRIAR ADMIN POR DEFEITO ---
async function criarAdminInicial() {
    try {
        const emailAdmin = 'shidysuns7@gmail.com';
        
        // Verificar se já existe
        const adminExiste = await User.findOne({ where: { email: emailAdmin } });
        
        if (!adminExiste) {
            // Ir buscar o ID da role 'Admin'
            const roleAdmin = await Role.findOne({ where: { descricao: 'Admin' } });
            
            if (roleAdmin) {
                // Criar password encriptada
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('pass614', salt); // Password: admin123

                await User.create({
                    nome_completo: 'Administrador Principal',
                    email: emailAdmin,
                    password_hash: hashedPassword,
                    conta_ativa: true, // O Admin já nasce ativo!
                    roleId: roleAdmin.id_role
                });
                
                console.log('✅ Utilizador ADMIN criado: shidysuns7@gmail.com / pass614');
            }
        }
    } catch (error) {
        console.error('Erro ao criar admin inicial:', error);
    }
}

// Sincronizar Base de Dados e Arrancar
db.sync({ alter: true }) 
    .then(async () => { 
        
        await criarRolesIniciais();
        await criarAdminInicial();

        console.log('Base de dados sincronizada!');
        app.listen(PORT, () => console.log(`Servidor a correr na porta ${PORT}`));
    })
    .catch((err) => {
        console.error('Erro ao sincronizar BD:', err);
    });