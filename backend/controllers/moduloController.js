const { Modulo } = require('../models/associations');

// Listar Módulos
exports.listarModulos = async (req, res) => {
    try {
        const { cursoId } = req.query;
        const whereCondition = cursoId ? { cursoId } : {};

        // Simplifiquei: Removi o 'include' que estava a causar conflito
        const modulos = await Modulo.findAll({
            where: whereCondition
        });
        
        res.json(modulos);
    } catch (error) {
        // AGORA JÁ VAIS VER O ERRO NO TERMINAL SE ACONTECER
        console.error("Erro crítico ao listar módulos:", error); 
        res.status(500).json({ msg: "Erro ao listar módulos." });
    }
};

// Criar Módulo
exports.criarModulo = async (req, res) => {
    try {
        const { nome, descricao, cursoId } = req.body;
        
        if (!cursoId) return res.status(400).json({ msg: "O curso é obrigatório!" });

        await Modulo.create({ nome, descricao, cursoId });
        res.status(201).json({ msg: "Módulo criado com sucesso!" });
    } catch (error) {
        console.error("Erro ao criar:", error);
        res.status(500).json({ msg: "Erro ao criar módulo." });
    }
};

// Atualizar Módulo
exports.atualizarModulo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao } = req.body;

        const modulo = await Modulo.findByPk(id);
        if (!modulo) return res.status(404).json({ msg: "Módulo não encontrado" });

        modulo.nome = nome;
        modulo.descricao = descricao;
        await modulo.save();

        res.json({ msg: "Módulo atualizado!" });
    } catch (error) {
        console.error("Erro ao atualizar:", error);
        res.status(500).json({ msg: "Erro ao atualizar." });
    }
};

// Eliminar Módulo
exports.eliminarModulo = async (req, res) => {
    try {
        const { id } = req.params;
        await Modulo.destroy({ where: { id_modulo: id } });
        res.json({ msg: "Módulo eliminado!" });
    } catch (error) {
        console.error("Erro ao eliminar:", error);
        res.status(500).json({ msg: "Erro ao eliminar." });
    }
};