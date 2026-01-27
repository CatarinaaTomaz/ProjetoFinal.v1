const { Curso, User, Inscricao } = require('../models/associations');
const { Op } = require('sequelize');

// ==========================================
// CRUD CURSOS (Básico)
// ==========================================

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
        await Curso.create({ nome, area, data_inicio, data_fim, status });
        res.status(201).json({ msg: "Curso criado!" });
    } catch (error) {
        res.status(500).json({ msg: "Erro ao criar curso." });
    }
};

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

exports.eliminarCurso = async (req, res) => {
    try {
        await Curso.destroy({ where: { id_curso: req.params.id } });
        res.json({ msg: "Curso eliminado." });
    } catch (error) {
        res.status(500).json({ msg: "Erro ao eliminar." });
    }
};

// ==========================================
// GESTÃO DE ALUNOS (MATRÍCULAS)
// ==========================================

// 1. Matricular Aluno (MANUALMENTE PELO ADMIN)
exports.adicionarAluno = async (req, res) => {
    try {
        const { id } = req.params;   // ID do Curso
        const { userId } = req.body; // ID do Aluno

        const curso = await Curso.findByPk(id);
        const aluno = await User.findByPk(userId);

        if (!curso || !aluno) return res.status(404).json({ msg: "Curso ou Aluno não encontrados" });

        // <--- CORREÇÃO: Se é o Admin a adicionar, entra logo como 'Aceite'!
        // O método 'through' define os campos extra da tabela intermédia
        await curso.addUser(aluno, { through: { estado: 'Aceite' } });

        res.json({ msg: "Aluno matriculado com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao matricular." });
    }
};

// 2. Listar Alunos Inscritos no Curso (APENAS OS ACEITES)
exports.listarAlunosCurso = async (req, res) => {
    try {
        const { id } = req.params;
        
        const curso = await Curso.findByPk(id, {
            include: [{
                model: User,
                attributes: ['id_user', 'nome_completo', 'email', 'foto', 'roleId'],
                // <--- CORREÇÃO: Filtramos para trazer SÓ quem tem estado 'Aceite'
                through: { 
                    where: { estado: 'Aceite' },
                    attributes: [] 
                } 
            }]
        });

        if (!curso) return res.status(404).json({ msg: "Curso não encontrado" });

        res.json(curso.Users); // Retorna a lista de alunos JÁ ACEITES
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao listar alunos." });
    }
};

// 3. Remover Aluno do Curso (Expulsar/Cancelar)
exports.removerAluno = async (req, res) => {
    try {
        const { id, alunoId } = req.params;
        
        const curso = await Curso.findByPk(id);
        const aluno = await User.findByPk(alunoId);

        if (!curso || !aluno) return res.status(404).json({ msg: "Dados inválidos" });

        await curso.removeUser(aluno); // Apaga a linha da tabela Inscricao
        
        res.json({ msg: "Matrícula anulada." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao remover aluno." });
    }
};

// ==========================================
// CANDIDATURAS (AUTO-PROPOSTAS)
// ==========================================

// 4. Fazer Candidatura (Pelo Portal do Aluno/Formador)
exports.candidatar = async (req, res) => {
    try {
        const { cursoId, userId } = req.body;
        
        // Verifica se já existe (Aceite, Pendente ou Rejeitado)
        const existe = await Inscricao.findOne({ where: { cursoId, userId } });
        
        if (existe) {
            if (existe.estado === 'Pendente') return res.status(400).json({ msg: "Já tens uma candidatura pendente." });
            if (existe.estado === 'Aceite') return res.status(400).json({ msg: "Já estás inscrito neste curso." });
            
            // Se foi rejeitado antes e tenta de novo, volta a Pendente
            existe.estado = 'Pendente';
            await existe.save();
            return res.json({ msg: "Candidatura ressubmetida! Aguarda aprovação." });
        }

        // Cria nova inscrição com estado PENDENTE
        await Inscricao.create({ cursoId, userId, estado: 'Pendente' });
        res.json({ msg: "Candidatura enviada! Aguarda aprovação da Secretaria." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao candidatar." });
    }
};

// 5. Listar Candidaturas Pendentes (Para o Admin/Secretaria verem)
exports.listarCandidaturasPendentes = async (req, res) => {
    try {
        const pendentes = await Inscricao.findAll({
            where: { estado: 'Pendente' },
            include: [
                { model: User, attributes: ['id_user', 'nome_completo', 'email', 'foto', 'roleId'] },
                { model: Curso, attributes: ['id_curso', 'nome', 'area'] }
            ]
        });
        res.json(pendentes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao listar candidaturas." });
    }
};

// 6. Aprovar ou Rejeitar (Ação do Admin)
exports.gerirCandidatura = async (req, res) => {
    try {
        const { id } = req.params; // ID da Inscrição (não do user, nem do curso)
        const { decisao } = req.body; // 'Aceite' ou 'Rejeitado'

        const inscricao = await Inscricao.findByPk(id);
        if (!inscricao) return res.status(404).json({ msg: "Candidatura não encontrada" });

        inscricao.estado = decisao;
        await inscricao.save();

        res.json({ msg: `Candidatura marcada como: ${decisao}` });
    } catch (error) {
        res.status(500).json({ msg: "Erro ao processar decisão." });
    }
};

// 7. Listar Cursos Disponíveis (Visual do Aluno)
exports.listarCursosParaCandidatura = async (req, res) => {
    try {
        const { userId } = req.params;

        const cursos = await Curso.findAll({
            where: { status: true },
            include: [{
                model: User,
                where: { id_user: userId },
                required: false,
                through: { attributes: ['estado'] } // Traz o estado para sabermos se já se candidatou
            }]
        });

        // Formata os dados para o frontend
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
        res.status(500).json({ msg: "Erro ao listar cursos." });
    }
};