const { Curso } = require('../models/associations');

exports.listarCursos = async (req, res) => {
    try {
        const cursos = await Curso.findAll();
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ msg: "Erro ao listar cursos." });
    }
};

exports.criarCurso = async (req, res) => {
    try {
        const { nome, area, data_inicio, data_fim, status } = req.body; 
        
        // MUDANÇA: Se não vier nada, assume FALSE (Inativo)
        const estadoFinal = (status === undefined) ? false : status;

        await Curso.create({ 
            nome, 
            area, 
            data_inicio, 
            data_fim, 
            status: estadoFinal 
        });
        
        res.status(201).json({ msg: "Curso criado!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao criar curso." });
    }
};

exports.atualizarCurso = async (req, res) => {
    try {
        const { id } = req.params;
        // MUDANÇA: Adicionei 'status' aqui também
        const { nome, area, data_inicio, data_fim, status } = req.body;

        const curso = await Curso.findByPk(id);
        if (!curso) return res.status(404).json({ msg: "Curso não encontrado" });

        curso.nome = nome;
        curso.area = area;
        curso.data_inicio = data_inicio;
        curso.data_fim = data_fim;
        
        // Atualizar o status (se foi enviado)
        if (status !== undefined) {
            curso.status = status;
        }

        await curso.save();

        res.json({ msg: "Curso atualizado!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao atualizar." });
    }
};

exports.eliminarCurso = async (req, res) => {
    try {
        const { id } = req.params;
        await Curso.destroy({ where: { id_curso: id } });
        res.json({ msg: "Curso eliminado!" });
    } catch (error) {
        res.status(500).json({ msg: "Erro ao eliminar." });
    }
};