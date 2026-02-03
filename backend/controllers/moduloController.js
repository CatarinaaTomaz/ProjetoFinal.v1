const { Modulo, User, Sala, Curso } = require('../models/associations');

// 1. LISTAR (GET)
exports.listarModulos = async (req, res) => {
    try {
        // Recebe cursoId E formadorId da URL
        const { cursoId, formadorId } = req.query;
        
        const whereClause = {};
        
        // Se vier cursoId, filtra por curso
        if (cursoId) whereClause.cursoId = cursoId;
        
        // Se vier formadorId, filtra por formador (userId na BD)
        if (formadorId) whereClause.userId = formadorId;

        const modulos = await Modulo.findAll({
            where: whereClause,
            include: [
                { model: Sala, attributes: ['nome'] },
                { model: User, as: 'Formador', attributes: ['id_user', 'nome_completo'] },
                // Adicionei o Curso para aparecer "Programação (TGPSI)" na lista
                { model: Curso, attributes: ['nome'] } 
            ]
        });
        res.json(modulos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao listar módulos." });
    }
};

// 2. CRIAR (POST)
exports.criarModulo = async (req, res) => {
    try {
        const { nome, descricao, cursoId, formadorId, userId, salaId, duracao } = req.body;

        // Lógica para apanhar o ID do formador venha ele como vier
        const idFinalFormador = formadorId || userId || null;

        await Modulo.create({
            nome,
            descricao,
            duracao: duracao || 50,
            cursoId,
            userId: idFinalFormador, // Grava na coluna correta (userId)
            salaId: salaId || null
        });

        res.status(201).json({ msg: "Módulo criado!" });
    } catch (error) {
        console.error("Erro criar módulo:", error);
        res.status(500).json({ msg: "Erro ao criar módulo." });
    }
};

// 3. ATUALIZAR (PUT)
exports.atualizarModulo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, cursoId, formadorId, userId, salaId, duracao } = req.body;

        const modulo = await Modulo.findByPk(id);
        if (!modulo) return res.status(404).json({ msg: "Módulo não encontrado." });

        const idFinalFormador = formadorId || userId || null;

        modulo.nome = nome;
        modulo.descricao = descricao;
        modulo.duracao = duracao;
        modulo.cursoId = cursoId;
        modulo.userId = idFinalFormador;
        modulo.salaId = salaId || null;

        await modulo.save();

        res.json({ msg: "Módulo atualizado!" });
    } catch (error) {
        console.error("Erro atualizar:", error);
        res.status(500).json({ msg: "Erro ao atualizar." });
    }
};

// 4. ELIMINAR (DELETE) - ESTA ERA A QUE FALTAVA!
exports.eliminarModulo = async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await Modulo.destroy({ where: { id_modulo: id } });

        if (!resultado) return res.status(404).json({ msg: "Módulo não encontrado." });

        res.json({ msg: "Módulo eliminado com sucesso!" });
    } catch (error) {
        console.error("Erro ao apagar:", error);
        res.status(500).json({ msg: "Erro ao eliminar módulo." });
    }
};