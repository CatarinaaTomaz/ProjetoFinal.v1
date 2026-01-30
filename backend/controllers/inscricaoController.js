const { Inscricao, Curso, User } = require('../models/associations');

// ==========================================
// PARTE 1: PORTAL DO ALUNO (Frontend)
// ==========================================

// 1. Ver o meu curso atual (Para o Calendário)
exports.obterCursoDoAluno = async (req, res) => {
    try {
        const { id } = req.params; 
        // Procura inscrição ACEITE
        const inscricao = await Inscricao.findOne({
            where: { userId: id, estado: 'Aceite' },
            include: [{ model: Curso }] 
        });

        if (!inscricao) return res.status(404).json({ msg: "Sem curso ativo." });
        res.json(inscricao.Curso);
    } catch (error) {
        res.status(500).json({ msg: "Erro ao buscar curso." });
    }
};

// 2. Fazer Candidatura (Botão "Candidatar")
exports.criarInscricao = async (req, res) => {
    try {
        const { alunoId, cursoId } = req.body;
        const existe = await Inscricao.findOne({ where: { userId: alunoId, cursoId: cursoId } });
        
        if (existe) {
            if (existe.estado === 'Pendente') return res.status(400).json({ msg: "Já tens uma candidatura pendente." });
            if (existe.estado === 'Aceite') return res.status(400).json({ msg: "Já estás inscrito." });
            
            existe.estado = 'Pendente';
            await existe.save();
            return res.json({ msg: "Candidatura ressubmetida!" });
        }

        await Inscricao.create({ userId: alunoId, cursoId, estado: 'Pendente' });
        res.status(201).json({ msg: "Candidatura enviada!" });
    } catch (error) {
        res.status(500).json({ msg: "Erro ao criar candidatura." });
    }
};

// ==========================================
// PARTE 2: ADMIN - GESTÃO DE CANDIDATURAS
// ==========================================

// 3. Listar Pendentes (Para a tabela "Gestão de Candidaturas")
exports.listarPendentes = async (req, res) => {
    try {
        const pendentes = await Inscricao.findAll({
            where: { estado: 'Pendente' },
            include: [
                // ISTO É FUNDAMENTAL PARA A TABELA NÃO DAR ERRO:
                { model: User, attributes: ['id_user', 'nome_completo', 'email', 'foto'] },
                { model: Curso, attributes: ['id_curso', 'nome'] }
            ]
        });
        res.json(pendentes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao listar pendentes." });
    }
};

// 4. Aprovar/Rejeitar
exports.gerirCandidatura = async (req, res) => {
    try {
        const { id } = req.params; // ID da Inscrição
        const { decisao } = req.body; // 'Aceite' ou 'Rejeitado'

        const inscricao = await Inscricao.findByPk(id);
        if (!inscricao) return res.status(404).json({ msg: "Inscrição não encontrada" });

        inscricao.estado = decisao;
        await inscricao.save();
        res.json({ msg: `Candidatura ${decisao}!` });
    } catch (error) {
        res.status(500).json({ msg: "Erro ao processar." });
    }
};

// ==========================================
// PARTE 3: ADMIN - BOTÃO AZUL (MANUAL)
// ==========================================

// 5. Adicionar Aluno Manualmente a um Curso
exports.adicionarAluno = async (req, res) => {
    try {
        const { id } = req.params;   // ID do Curso (vem da rota /cursos/:id/alunos)
        const { userId } = req.body; // ID do Aluno a adicionar

        // Verifica se já existe
        const existe = await Inscricao.findOne({ where: { userId, cursoId: id } });
        if (existe) {
            existe.estado = 'Aceite'; // Se já existia, força a entrada
            await existe.save();
        } else {
            await Inscricao.create({ userId, cursoId: id, estado: 'Aceite' });
        }
        res.json({ msg: "Aluno matriculado com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao matricular aluno." });
    }
};

// 6. Listar Alunos de um Curso (Para ver quem está na turma)
exports.listarAlunosCurso = async (req, res) => {
    try {
        const { id } = req.params;
        const inscricoes = await Inscricao.findAll({
            where: { cursoId: id, estado: 'Aceite' },
            include: [{ model: User, attributes: ['id_user', 'nome_completo', 'email', 'foto'] }]
        });
        // Formata para devolver só a lista de users
        const alunos = inscricoes.map(i => i.User);
        res.json(alunos);
    } catch (error) {
        res.status(500).json({ msg: "Erro ao listar alunos." });
    }
};

// 7. Remover Aluno (Botão Vermelho da Turma)
exports.removerAluno = async (req, res) => {
    try {
        const { id, alunoId } = req.params; // id=curso, alunoId=user
        await Inscricao.destroy({ where: { cursoId: id, userId: alunoId } });
        res.json({ msg: "Matrícula anulada." });
    } catch (error) {
        res.status(500).json({ msg: "Erro ao remover aluno." });
    }
};