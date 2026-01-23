const { Curso, User } = require('../models/associations');

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

// ==========================================
// GESTÃO DE ALUNOS (MATRÍCULAS)
// ==========================================

// 1. Matricular Aluno (Secretaria/Admin)
exports.adicionarAluno = async (req, res) => {
    try {
        const { id } = req.params;   // ID do Curso
        const { userId } = req.body; // ID do Aluno

        const curso = await Curso.findByPk(id);
        const aluno = await User.findByPk(userId);

        if (!curso || !aluno) return res.status(404).json({ msg: "Curso ou Aluno não encontrados" });

        // O Sequelize usa a tua tabela 'Inscricao' automaticamente aqui
        await curso.addUser(aluno);

        res.json({ msg: "Aluno matriculado com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao matricular." });
    }
};

// 2. Listar Alunos Inscritos no Curso
exports.listarAlunosCurso = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Busca o curso e traz os Users associados (via Inscricao)
        const curso = await Curso.findByPk(id, {
            include: [{
                model: User,
                attributes: ['id_user', 'nome_completo', 'email', 'foto', 'roleId'],
                through: { attributes: [] } // Ignora dados da tabela de junção por agora
            }]
        });

        if (!curso) return res.status(404).json({ msg: "Curso não encontrado" });

        res.json(curso.Users); // Retorna a lista de alunos
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao listar alunos." });
    }
};

// 3. Remover Aluno do Curso
exports.removerAluno = async (req, res) => {
    try {
        const { id, alunoId } = req.params;
        
        const curso = await Curso.findByPk(id);
        const aluno = await User.findByPk(alunoId);

        if (!curso || !aluno) return res.status(404).json({ msg: "Dados inválidos" });

        await curso.removeUser(aluno); // Remove da tabela Inscricao
        
        res.json({ msg: "Matrícula anulada." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao remover aluno." });
    }
};