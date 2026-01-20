const { Modulo, User, Sala } = require('../models/associations');

exports.listarModulos = async (req, res) => {
    try {
        const { cursoId } = req.query;
        const whereCondition = cursoId ? { cursoId } : {};

        const modulos = await Modulo.findAll({
            where: whereCondition,
            // AQUI ESTÁ A MAGIA: Trazer os dados das tabelas relacionadas
            include: [
                { model: User, as: 'Formador', attributes: ['nome_completo'] },
                { model: Sala, attributes: ['nome'] }
            ]
        });
        
        res.json(modulos);
    } catch (error) {
        console.error("Erro ao listar:", error);
        res.status(500).json({ msg: "Erro ao listar módulos." });
    }
};

exports.criarModulo = async (req, res) => {
    try {
        // Receber formadorId e salaId (podem vir vazios/null)
        const { nome, descricao, cursoId, formadorId, salaId } = req.body;
        
        if (!cursoId) return res.status(400).json({ msg: "Curso obrigatório!" });

        // Converter string vazia "" para null se necessário
        const fId = formadorId || null;
        const sId = salaId || null;

        await Modulo.create({ nome, descricao, cursoId, formadorId: fId, salaId: sId });
        res.status(201).json({ msg: "Módulo criado!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao criar." });
    }
};

exports.atualizarModulo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, formadorId, salaId } = req.body;

        const modulo = await Modulo.findByPk(id);
        if (!modulo) return res.status(404).json({ msg: "Não encontrado" });

        modulo.nome = nome;
        modulo.descricao = descricao;
        // Atualizar opcionais
        modulo.formadorId = formadorId || null;
        modulo.salaId = salaId || null;

        await modulo.save();
        res.json({ msg: "Atualizado!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao atualizar." });
    }
};

exports.eliminarModulo = async (req, res) => {
    try {
        const { id } = req.params;
        await Modulo.destroy({ where: { id_modulo: id } });
        res.json({ msg: "Eliminado!" });
    } catch (error) {
        res.status(500).json({ msg: "Erro ao eliminar." });
    }
};