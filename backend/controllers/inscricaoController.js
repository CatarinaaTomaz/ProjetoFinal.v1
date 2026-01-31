const { Inscricao, Curso, User } = require('../models/associations');

exports.listarPendentes = async (req, res) => {
    console.log("📥 Pedido de Candidaturas Pendentes recebido...");
    try {
        const pendentes = await Inscricao.findAll({
            where: { estado: 'Pendente' },
            include: [
                { model: User, attributes: ['id_user', 'nome_completo', 'email', 'foto'] },
                { model: Curso, attributes: ['id_curso', 'nome'] }
            ]
        });
        console.log(`✅ ${pendentes.length} candidaturas encontradas.`);
        res.json(pendentes);
    } catch (error) {
        console.error("❌ Erro nas candidaturas:", error);
        res.status(500).json({ msg: "Erro ao buscar dados." });
    }
};

// Outras funções necessárias para o site não quebrar
exports.obterCursoDoAluno = async (req, res) => {
    try {
        const i = await Inscricao.findOne({ where: { userId: req.params.id, estado: 'Aceite' }, include: [Curso] });
        if(!i) return res.status(404).json({msg: "Sem curso"});
        res.json(i.Curso);
    } catch(e) { res.status(500).send(); }
};

exports.criarInscricao = async (req, res) => {
    try {
        const { alunoId, cursoId } = req.body;
        const ex = await Inscricao.findOne({ where: { userId: alunoId, cursoId }});
        if(ex) return res.status(400).json({ msg: "Já existe" });
        await Inscricao.create({ userId: alunoId, cursoId, estado: 'Pendente' });
        res.json({ msg: "Sucesso" });
    } catch(e) { res.status(500).send(); }
};

exports.gerirCandidatura = async (req, res) => {
    try {
        const i = await Inscricao.findByPk(req.params.id);
        if(i) { i.estado = req.body.decisao; await i.save(); }
        res.json({ msg: "Atualizado" });
    } catch(e) { res.status(500).send(); }
};

// Rotas do botão azul (Adicionar manual)
exports.adicionarAluno = async (req, res) => {
    try {
        await Inscricao.create({ userId: req.body.userId, cursoId: req.params.id, estado: 'Aceite' });
        res.json({msg: "OK"});
    } catch(e) { res.status(500).send(); }
};

exports.listarAlunosCurso = async (req, res) => {
    try {
        const i = await Inscricao.findAll({ where: { cursoId: req.params.id, estado: 'Aceite' }, include: [User] });
        res.json(i.map(x => x.User));
    } catch(e) { res.status(500).send(); }
};

exports.removerAluno = async (req, res) => {
    try {
        await Inscricao.destroy({ where: { cursoId: req.params.id, userId: req.params.alunoId } });
        res.json({msg: "OK"});
    } catch(e) { res.status(500).send(); }
};