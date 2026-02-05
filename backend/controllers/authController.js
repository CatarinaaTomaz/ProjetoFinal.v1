require('dotenv').config();
const { User, Role } = require('../models/associations');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); 
const sendEmail = require('../utils/email');

// REGISTO
exports.register = async (req, res) => {
    try {
        const { nome, email, password } = req.body;

        // Verificar se user já existe
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ msg: 'Email já registado.' });
        }

        // Encriptar password (Requisito 1.c)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const activationToken = crypto.randomBytes(20).toString('hex');

        // 1. Procurar qual é o ID da role 'Formando'
            const roleFormando = await Role.findOne({ where: { descricao: 'Formando' } });
            
            if (!roleFormando) {
                return res.status(500).json({ msg: 'Erro: Role Formando não encontrada na BD.' });
            }

            // 2. Criar utilizador com o roleId certo
            const newUser = await User.create({
            nome_completo: nome,
            email,
            password_hash: hashedPassword,
            conta_ativa: false,
            roleId: roleFormando.id_role, 
            token_ativacao: activationToken 
        });

            // 3. Criar URL de ativação
        // O link vai apontar para o BackEnd, que depois redireciona para o FrontEnd
        const activationUrl = `http://localhost:3000/api/auth/verify/${activationToken}`;

        // 4. Enviar Email
        try {
            const activationUrl = `http://localhost:3000/api/auth/verify/${activationToken}`;

            await sendEmail({
                email: newUser.email,
                subject: 'Ativação de Conta - ATEC',
                // Usamos a propriedade 'html' para enviar algo bonito
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #1e3c72;">Bem-vindo ao Portal ATEC!</h2>
                        <p>Olá ${newUser.nome_completo},</p>
                        <p>Obrigado por te registares. Para ativares a tua conta, clica no botão abaixo:</p>
                        <a href="${activationUrl}" style="background-color: #1e3c72; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Ativar Minha Conta</a>
                        <p style="margin-top: 20px; font-size: 12px; color: #777;">Se o botão não funcionar, copia este link: ${activationUrl}</p>
                    </div>
                `
            });

            res.status(201).json({ 
                msg: 'Registo efetuado! Verifica o teu GMAIL para ativar a conta.' 
            });

        } catch (emailError) {
            console.error("Erro no email:", emailError);
            return res.status(500).json({ msg: 'Erro ao enviar email. Verifica se o email existe.' });
        }

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    };

    // NOVA FUNÇÃO: VERIFICAR EMAIL
    exports.verifyEmail = async (req, res) => {
        try {
            const { token } = req.params;

            // Procurar user com este token
            const user = await User.findOne({ where: { token_ativacao: token } });

            if (!user) {
                return res.status(400).json({ msg: 'Token de ativação inválido ou expirado.' });
            }

            // Ativar a conta
            user.conta_ativa = true;
            user.token_ativacao = null; // Limpar o token para não ser usado 2 vezes
            await user.save();

            // Redirecionar para o Login do FrontEnd com mensagem de sucesso
            // (Ajusta o caminho se o teu login.html estiver noutro sítio)
            res.send(`
                <h1>Conta Ativada com Sucesso!</h1>
                <p>Já podes fechar esta janela e fazer login na aplicação.</p>
                <script>setTimeout(() => window.location.href = 'http://127.0.0.1:5500/frontend/login.html', 3000);</script>
            `);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

// LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Procurar o user
        const user = await User.findOne({ 
            where: { email },
            include: Role 
        });

        if (!user) return res.status(400).json({ msg: 'Utilizador não encontrado.' });
        if (!user.conta_ativa) return res.status(403).json({ msg: 'Conta inativa.' });

        // 2. Verificar Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ msg: 'Password incorreta.' });

        // 3. Gerar Código 2FA
        const codigoOTP = Math.floor(100000 + Math.random() * 900000).toString();
        const validade = new Date();
        validade.setMinutes(validade.getMinutes() + 10);

        user.otp_codigo = codigoOTP;
        user.otp_validade = validade;
        await user.save();

        // 4. Enviar Email
        try {
            await sendEmail({
                email: user.email,
                subject: 'Código de Acesso - ATEC',
                html: `<h1>${codigoOTP}</h1><p>Código para entrar no portal.</p>`
            });
        } catch (emailError) {
            console.error("Erro email:", emailError);
        }

        // --- DEBUG FINAL (Para teres a certeza) ---
        console.log("User encontrado:", user.nome_completo);
        console.log("ID do User:", user.id_user); 
        // ------------------------------------------

        res.json({
            require2fa: true,
            userId: user.id_user, // Agora usamos o nome correto garantido!
            msg: 'Código enviado para o email!'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// --- NOVA FUNÇÃO: VERIFICAR CÓDIGO (PASSO 2 DO 2FA) ---
exports.verifyTwoFactor = async (req, res) => {
    try {
        const { userId, codigo } = req.body;

        // --- ADICIONA ISTO ---
        console.log("Tentativa de 2FA:");
        console.log("ID recebido:", userId);
        console.log("Código recebido:", codigo);
        // ---------------------

        const user = await User.findByPk(userId, { include: Role });
        if (!user) return res.status(400).json({ msg: 'Utilizador não encontrado.' });

        // Verificar se o código existe e se bate certo
        if (user.otp_codigo !== codigo) {
            return res.status(400).json({ msg: 'Código inválido.' });
        }

        // Verificar se já expirou
        if (new Date() > user.otp_validade) {
            return res.status(400).json({ msg: 'O código expirou. Faz login novamente.' });
        }

        // SUCESSO! Limpar o código e gerar Token
        user.otp_codigo = null;
        user.otp_validade = null;
        await user.save();

        const token = jwt.sign(
            { id: user.id_user, role: user.Role.descricao }, 
            process.env.JWT_SECRET, // <--- AQUI ESTÁ A CORREÇÃO!
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id_user,
                nome: user.nome_completo,
                email: user.email,
                role: user.Role.descricao
            },
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PEDIR O RESET (Envia o Email)
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ msg: 'Email não encontrado.' });
        }

        // Gerar um token aleatório seguro
        const token = crypto.randomBytes(20).toString('hex');
        
        // O token expira em 1 hora
        const now = new Date();
        now.setHours(now.getHours() + 1);

        user.reset_token = token;
        user.reset_expires = now;
        await user.save();

        // Link para o FRONTEND (Ajusta a porta 5500 se o teu Live Server for diferente)
        const resetLink = `http://127.0.0.1:5500/frontend/reset-password.html?token=${token}`;

        await sendEmail({
            email: user.email,
            subject: 'Recuperação de Password - ATEC',
            html: `
                <h3>Recuperar Password</h3>
                <p>Recebemos um pedido para alterar a tua password.</p>
                <p>Clica no link abaixo para criar uma nova:</p>
                <a href="${resetLink}">Redefinir Password</a>
                <br><br>
                <small>Este link expira em 1 hora.</small>
            `
        });

        res.json({ msg: 'Email de recuperação enviado!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Erro ao enviar email.' });
    }
};

//GRAVAR A NOVA PASSWORD
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const { Op } = require('sequelize'); // Necessário para comparar datas

        // Procurar user com este token E que o prazo ainda não tenha acabado
        const user = await User.findOne({ 
            where: { 
                reset_token: token,
                reset_expires: { [Op.gt]: new Date() } // Op.gt significa "Greater Than" (Maior que agora)
            } 
        });

        if (!user) {
            return res.status(400).json({ msg: 'Link inválido ou expirado.' });
        }

        // Encriptar a nova password
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(newPassword, salt);
        
        // Limpar os tokens usados
        user.reset_token = null;
        user.reset_expires = null;
        
        await user.save();

        res.json({ msg: 'Password alterada com sucesso! Podes fazer login.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Erro ao alterar password.' });
    }
};