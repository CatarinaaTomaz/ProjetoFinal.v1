const { Inscricao, Curso } = require('../models/associations');

exports.obterCursoDoAluno = async (req, res) => {
    try {
        const { id } = req.params; // ID do Aluno

        // Procura uma inscrição ativa deste aluno
        const inscricao = await Inscricao.findOne({
            where: { userId: id },
            include: [{ model: Curso }] // Traz os dados do Curso
        });

        if (!inscricao) {
            return res.status(404).json({ msg: "Aluno não está inscrito em nenhum curso." });
        }

        // Devolve o ID e o Nome do Curso
        res.json(inscricao.Curso);

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao buscar curso." });
    }
};