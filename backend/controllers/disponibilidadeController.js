const { Disponibilidade } = require('../models/associations');

exports.adicionar = async (req, res) => {
    try {
        const { dataInicio, dataFim, formadorId } = req.body;
        await Disponibilidade.create({ data_inicio: dataInicio, data_fim: dataFim, formadorId });
        res.json({ msg: "Criado" });
    } catch (error) { res.status(500).json({ error }); }
};

exports.listar = async (req, res) => {
    try {
        // Traz as disponibilidades do formador, ordenadas por data
        const lista = await Disponibilidade.findAll({ 
            where: { formadorId: req.params.id },
            order: [['data_inicio', 'ASC']] 
        });
        res.json(lista);
    } catch (error) { res.status(500).json({ error }); }
};

exports.eliminar = async (req, res) => {
    try {
        await Disponibilidade.destroy({ where: { id: req.params.id } });
        res.json({ msg: "Apagado" });
    } catch (error) { res.status(500).json({ error }); }
};