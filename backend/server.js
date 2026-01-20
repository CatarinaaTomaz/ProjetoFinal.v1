const express = require('express');
const cors = require('cors');
const path = require('path'); 
const bcrypt = require('bcryptjs'); 

// 2. Agora o path já existe, podemos configurar o dotenv
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Teste de Debug (Opcional)
console.log("--------------------------------------");
console.log("Estado do Servidor:");
console.log("Email User:", process.env.EMAIL_USER ? "✅ Carregado" : "❌ Falta no .env");
console.log("Google ID:", process.env.GOOGLE_CLIENT_ID ? "✅ Carregado" : "❌ Falta no .env");
console.log("--------------------------------------");

const db = require('./config/db');

// Importar Rotas
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const cursoRoutes = require('./routes/cursoRoutes');
const moduloRoutes = require('./routes/moduloRoutes');
const salaRoutes = require('./routes/salaRoutes');
const statsRoutes = require('./routes/statsRoutes');

// Importar Modelos
const { 
    User, Role, Curso, Sala, Modulo 
} = require('./models/associations');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// 3. TORNAR A PASTA UPLOADS PÚBLICA (CRUCIAL PARA AS FOTOS)
// Garante que a pasta 'uploads' existe dentro de 'backend'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use('/api/auth', authRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/modulos', moduloRoutes);
app.use('/api/salas', salaRoutes);
app.use('/api/stats', statsRoutes);

const PORT = process.env.PORT || 3000;

// --- FUNÇÕES DE INICIALIZAÇÃO ---

async function criarRolesIniciais() {
    try {
        const roles = ['Admin', 'Formando', 'Formador', 'Secretaria'];
        for (const roleName of roles) {
            await Role.findOrCreate({ where: { descricao: roleName } });
        }
        console.log('Roles verificadas/criadas com sucesso!');
    } catch (error) { console.error('Erro ao criar roles:', error); }
}

async function criarAdminInicial() {
    try {
        const emailAdmin = 'shidysuns7@gmail.com'; 
        const adminExiste = await User.findOne({ where: { email: emailAdmin } });
        
        if (!adminExiste) {
            const roleAdmin = await Role.findOne({ where: { descricao: 'Admin' } });
            if (roleAdmin) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('pass614', salt);
                
                // Verifica no teu modelo User.js se o campo é 'password' ou 'password_hash'
                // Assumi 'password' com base no código anterior, se der erro, muda para password_hash
                await User.create({
                    nome_completo: 'Administrador Principal',
                    email: emailAdmin,
                    password: hashedPassword, 
                    conta_ativa: true,
                    roleId: roleAdmin.id_role
                });
                console.log('✅ Utilizador ADMIN criado com sucesso!');
            }
        }
    } catch (error) { console.error('Erro ao criar admin:', error); }
}

// ARRANCAR SERVIDOR
db.sync({ alter: true }) 
    .then(async () => { 
        await criarRolesIniciais();
        await criarAdminInicial();
        console.log('Base de dados sincronizada!');
        app.listen(PORT, () => console.log(`🚀 Servidor a correr na porta ${PORT}`));
    })
    .catch((err) => {
        console.error('Erro ao sincronizar BD:', err);
    });