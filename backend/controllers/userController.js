const { User, Role } = require('../models/associations');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// 1. Listar
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            include: [{ model: Role, attributes: ['id_role', 'descricao'] }]
        });
        res.json(users);
    } catch (error) { res.status(500).json({ msg: "Erro geral." }); }
};

// 2. Obter um
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, { include: [{ model: Role }] });
        if (!user) return res.status(404).json({ msg: "Não encontrado" });
        res.json(user);
    } catch (error) { res.status(500).json({ msg: "Erro." }); }
};

// 3. ATUALIZAR (CORREÇÃO DA ROLE AQUI)
exports.updateUser = async (req, res) => {
    console.log("=== PEDIDO DE UPDATE INICIADO ===");
    console.log("ID do User:", req.params.id);
    console.log("Dados recebidos (Body):", req.body);

    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ msg: "User não encontrado" });

        // Atualizar Campos Texto
        // Nota: O Multer coloca os campos de texto no req.body
        if (req.body.nome) user.nome_completo = req.body.nome;
        if (req.body.email) user.email = req.body.email;
        if (req.body.horas_lecionadas) user.horas_lecionadas = req.body.horas_lecionadas;

        // --- CORREÇÃO DA ROLE ---
        // Verificamos se roleId existe e forçamos a ser um número (parseInt)
        if (req.body.roleId) {
            const novaRole = parseInt(req.body.roleId);
            console.log(`🔄 A alterar Role: ${user.roleId} -> ${novaRole}`);
            user.roleId = novaRole;
        } else {
            console.log("⚠️ Nenhuma Role enviada no pedido.");
        }

        // Atualizar Foto
        if (req.file) {
            console.log("📸 Nova foto recebida:", req.file.filename);
            if (user.foto && !user.foto.startsWith('http')) {
                const caminhoAntigo = path.join(__dirname, '../uploads', user.foto);
                if (fs.existsSync(caminhoAntigo)) fs.unlinkSync(caminhoAntigo);
            }
            user.foto = req.file.filename;
        }

        await user.save();
        console.log("✅ Dados guardados na BD!");

        // Devolve o user atualizado para a tabela
        const userAtualizado = await User.findByPk(id, { include: [Role] });
        res.json(userAtualizado);

    } catch (error) {
        console.error("❌ ERRO NO UPDATE:", error);
        res.status(500).json({ msg: "Erro ao atualizar." });
    }
};

// 4. Eliminar
exports.deleteUser = async (req, res) => {
    try {
        await User.destroy({ where: { id_user: req.params.id } });
        res.json({ msg: "Eliminado." });
    } catch (error) { res.status(500).json({ msg: "Erro." }); }
};

// 5. Criar
exports.createUser = async (req, res) => {
    try {
        const { nome, email, password, roleId } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        await User.create({
            nome_completo: nome,
            email,
            password_hash: hash,
            roleId: roleId || 2,
            conta_ativa: true
        });
        res.status(201).json({ msg: "Criado!" });
    } catch (error) { res.status(500).json({ msg: "Erro." }); }
};