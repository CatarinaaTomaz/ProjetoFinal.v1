const { User, Role } = require('../models/associations');
const bcrypt = require('bcryptjs');

// Função para listar todos os utilizadores
exports.listarTodos = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password_hash', 'token_ativacao', 'reset_token'] }, // Esconde dados sensíveis
            include: [{ model: Role, attributes: ['descricao'] }] 
        });

        res.json(users);
    } catch (error) {
        console.error("Erro ao listar users:", error);
        res.status(500).json({ msg: "Erro ao buscar utilizadores." });
    }
};

//  ATUALIZAR UTILIZADOR (Nome, Email, Role)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, roleId } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ msg: "Utilizador não encontrado" });

        // Atualiza os dados
        user.nome_completo = nome;
        user.email = email;
        user.roleId = roleId;
        
        await user.save();
        res.json({ msg: "Utilizador atualizado com sucesso!" });

    } catch (error) {
        res.status(500).json({ msg: "Erro ao atualizar." });
    }
};

// ALTERNAR ESTADO (Ativo/Inativo)
exports.toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        
        if (!user) return res.status(404).json({ msg: "Utilizador não encontrado" });

        // Inverte o estado (se true vira false, se false vira true)
        user.conta_ativa = !user.conta_ativa;
        await user.save();

        res.json({ msg: "Estado alterado!", novoEstado: user.conta_ativa });

    } catch (error) {
        res.status(500).json({ msg: "Erro ao alterar estado." });
    }
};

// ELIMINAR UTILIZADOR
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) return res.status(404).json({ msg: "Utilizador não encontrado" });

        await user.destroy(); // Apaga da base de dados
        res.json({ msg: "Utilizador eliminado!" });

    } catch (error) {
        res.status(500).json({ msg: "Erro ao eliminar." });
    }
};

// UPLOAD DE FOTO
exports.uploadFoto = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.file) {
            return res.status(400).json({ msg: "Nenhum ficheiro enviado." });
        }

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ msg: "Utilizador não encontrado" });

        // Guardar o caminho da foto na BD (ex: uploads/user-123.jpg)
        // Nota: No Windows as barras vêm trocadas, forçamos a barra normal '/'
        const fotoPath = req.file.path.replace(/\\/g, "/"); 
        
        user.foto = fotoPath;
        await user.save();

        res.json({ msg: "Foto atualizada!", foto: fotoPath });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao carregar foto." });
    }
};