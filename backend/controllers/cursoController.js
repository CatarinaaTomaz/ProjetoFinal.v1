const { Curso, User, Inscricao } = require('../models/associations');
const { Op } = require('sequelize');

// 1. Listar Cursos (Simples)
exports.listarCursos = async (req, res) => {
    try {
        const cursos = await Curso.findAll();
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ msg: "Erro ao listar cursos." });
    }
};

// 2. Criar Curso
exports.criarCurso = async (req, res) => {
    try {
        const { nome, area, data_inicio, data_fim, status } = req.body;
        await Curso.create({ nome, area, data_inicio, data_fim, status });
        res.status(201).json({ msg: "Curso criado!" });
    } catch (error) {
        res.status(500).json({ msg: "Erro ao criar curso." });
    }
};

// 3. Atualizar Curso
exports.atualizarCurso = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, area, data_inicio, data_fim, status } = req.body;
        const curso = await Curso.findByPk(id);
        if (!curso) return res.status(404).json({ msg: "Curso não encontrado" });

        curso.nome = nome;
        curso.area = area;
        curso.data_inicio = data_inicio;
        curso.data_fim = data_fim;
        curso.status = status;
        
        await curso.save();
        res.json({ msg: "Curso atualizado!" });
    } catch (error) {
        res.status(500).json({ msg: "Erro ao atualizar." });
    }
};

// 4. Eliminar Curso
exports.eliminarCurso = async (req, res) => {
    try {
        await Curso.destroy({ where: { id_curso: req.params.id } });
        res.json({ msg: "Curso eliminado." });
    } catch (error) {
        res.status(500).json({ msg: "Erro ao eliminar." });
    }
};

// 5. Listar Cursos Disponíveis (Visual do Aluno/Tabela Inteligente)
// ESTA É A FUNÇÃO QUE ESTAVA A FALHAR
exports.listarCursosParaCandidatura = async (req, res) => {
    try {
        const { userId } = req.params; 

        const cursos = await Curso.findAll({
            where: { status: true },
            include: [{
                model: User,
                where: { id_user: userId },
                required: false, 
                through: { attributes: ['estado'] } 
            }]
        });

        const resultado = cursos.map(c => {
            const inscricao = c.Users.length > 0 ? c.Users[0].Inscricao : null;
            return {
                id_curso: c.id_curso,
                nome: c.nome,
                area: c.area,
                inicio: c.data_inicio,
                estado_inscricao: inscricao ? inscricao.estado : 'NaoInscrito'
            };
        });

        res.json(resultado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao listar cursos disponíveis." });
    }
};