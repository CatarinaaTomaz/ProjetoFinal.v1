const { User, Role } = require('../models/associations');
const bcrypt = require('bcryptjs');

// 1. LISTAR
exports.listarUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            include: [{ model: Role }]
        });
        res.json(users);
    } catch (error) {
        console.error("Erro listar:", error);
        res.status(500).json({ msg: "Erro ao listar." });
    }
};

// 2. CRIAR
exports.criarUser = async (req, res) => {
    try {
        const { nome, email, password, roleId } = req.body;
        const hash = password ? await bcrypt.hash(password, 10) : null;
        
        await User.create({
            nome_completo: nome,
            email,
            password: hash,
            roleId: roleId || 2
        });
        res.status(201).json({ msg: "Criado!" });
    } catch (error) {
        res.status(500).json({ msg: "Erro ao criar." });
    }
};

// 3. ATUALIZAR (Versão Robusta Ant-Crash)
exports.atualizarUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // CORREÇÃO DO ERRO: Adicionei "|| {}" para não rebentar se vier vazio
        const { nome, email, roleId, horas_lecionadas } = req.body || {};

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ msg: "Não encontrado" });

        // Só atualiza SE o dado tiver sido enviado (evita apagar dados sem querer)
        if (nome) user.nome_completo = nome;
        if (email) user.email = email;
        if (roleId) user.roleId = roleId;
        if (horas_lecionadas !== undefined) user.horas_lecionadas = horas_lecionadas;

        // --- SE HOUVER FOTO NOVA ---
        // O Multer coloca o ficheiro em req.file
        if (req.file) {
            user.foto = req.file.filename;
        }
        // ---------------------------

        await user.save();
        
        // Devolvemos a foto atualizada para o Frontend mostrar logo
        res.json({ msg: "Atualizado!", foto: user.foto });
        
    } catch (error) {
        console.error("Erro atualizar:", error);
        res.status(500).json({ msg: "Erro ao atualizar." });
    }
};

// 4. ELIMINAR
exports.eliminarUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.destroy({ where: { id_user: id } });
        res.json({ msg: "Eliminado!" });
    } catch (error) {
        res.status(500).json({ msg: "Erro ao eliminar." });
    }
};

// 5. ESTADO
exports.alterarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ msg: "Não encontrado" });

        user.conta_ativa = !user.conta_ativa;
        await user.save();
        res.json({ msg: "Estado alterado!" });
    } catch (error) {
        res.status(500).json({ msg: "Erro estado." });
    }
};