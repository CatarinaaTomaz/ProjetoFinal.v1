const Curso = require('../models/Curso'); // Certifica-te que o modelo existe

//  Listar Cursos
exports.listarCursos = async (req, res) => {
    try {
        const cursos = await Curso.findAll();
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ msg: "Erro ao listar cursos." });
    }
};

//  Criar Curso
exports.criarCurso = async (req, res) => {
    try {
        const { nome, area, data_inicio, data_fim } = req.body;
        const novoCurso = await Curso.create({ nome, area, data_inicio, data_fim });
        res.json({ msg: "Curso criado!", id: novoCurso.id_curso });
    } catch (error) {
        res.status(500).json({ msg: "Erro ao criar curso." });
    }
};

// Atualizar Curso
exports.atualizarCurso = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, area, data_inicio, data_fim } = req.body;
        
        await Curso.update(
            { nome, area, data_inicio, data_fim },
            { where: { id_curso: id } }
        );

        res.json({ msg: "Curso atualizado!" });
    } catch (error) {
        res.status(500).json({ msg: "Erro ao atualizar." });
    }
};

// Apagar Curso
exports.apagarCurso = async (req, res) => {
    try {
        const { id } = req.params;
        await Curso.destroy({ where: { id_curso: id } });
        res.json({ msg: "Curso eliminado!" });
    } catch (error) {
        res.status(500).json({ msg: "Erro ao eliminar." });
    }
};