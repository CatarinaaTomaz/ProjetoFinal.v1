const { Sala } = require('../models/associations');

exports.listarSalas = async (req, res) => {
    try {
        const salas = await Sala.findAll();
        res.json(salas);
    } catch (error) {
        console.error("Erro ao listar salas:", error);
        res.status(500).json({ msg: "Erro ao buscar salas." });
    }
};

exports.criarSala = async (req, res) => {
    try {
        const { nome, tipo, capacidade } = req.body;
        await Sala.create({ nome, tipo, capacidade });
        res.status(201).json({ msg: "Sala criada com sucesso!" });
    } catch (error) {
        console.error("Erro ao criar sala:", error);
        res.status(500).json({ msg: "Erro ao criar sala." });
    }
};

exports.atualizarSala = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, tipo, capacidade } = req.body;
        
        const sala = await Sala.findByPk(id);
        if (!sala) return res.status(404).json({ msg: "Sala não encontrada" });

        sala.nome = nome;
        sala.tipo = tipo;
        sala.capacidade = capacidade;
        await sala.save();

        res.json({ msg: "Sala atualizada!" });
    } catch (error) {
        console.error("Erro ao atualizar sala:", error);
        res.status(500).json({ msg: "Erro ao atualizar." });
    }
};

exports.eliminarSala = async (req, res) => {
    try {
        const { id } = req.params;
        await Sala.destroy({ where: { id_sala: id } });
        res.json({ msg: "Sala eliminada!" });
    } catch (error) {
        console.error("Erro ao eliminar sala:", error);
        res.status(500).json({ msg: "Erro ao eliminar." });
    }
};