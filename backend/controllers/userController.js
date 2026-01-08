const { User, Role } = require('../models/associations');
const bcrypt = require('bcryptjs');

// 2.a Consultar todos os utilizadores (READ) 
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password_hash'] } // Não queremos mostrar as passwords!
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2.a Obter um utilizador pelo ID (READ) 
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password_hash'] }
        });
        if (!user) return res.status(404).json({ msg: "Utilizador não encontrado" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2.a Alterar utilizador (UPDATE) 
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ msg: "Utilizador não encontrado" });

        // Atualizar campos (apenas os que vierem no body)
        // Nota: Se a password vier, teríamos de a encriptar de novo!
        await user.update(req.body); 
        
        res.json({ msg: "Utilizador atualizado com sucesso", user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2.a Eliminar utilizador (DELETE) 
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ msg: "Utilizador não encontrado" });

        await user.destroy();
        res.json({ msg: "Utilizador eliminado com sucesso" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};