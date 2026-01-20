const { Curso, User, Role } = require('../models/associations');
const db = require('../config/db'); // <--- AQUI ESTAVA O ERRO: Faltava importar o db

exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Cursos Terminados (status = false) e A Decorrer (status = true)
        const cursosTerminados = await Curso.count({ where: { status: false } });
        const cursosDecorrer = await Curso.count({ where: { status: true } });

        // 2. Total de Formandos
        const totalFormandos = await User.count({
            include: [{
                model: Role,
                where: { descricao: 'Formando' } // Confirma se na BD é 'Formando' ou 'Aluno'
            }],
            where: { conta_ativa: true }
        });

        // 3. Cursos por Área (Agrupamento)
        // CORREÇÃO AQUI: Usamos db.fn e db.col
        const cursosPorArea = await Curso.findAll({
            attributes: ['area', [db.fn('COUNT', db.col('area')), 'total']],
            group: ['area']
        });

        // 4. Top 10 Formadores
        const topFormadores = await User.findAll({
            include: [{
                model: Role,
                where: { descricao: 'Formador' } // Confirma se na BD é 'Formador'
            }],
            order: [['horas_lecionadas', 'DESC']],
            limit: 10,
            attributes: ['nome_completo', 'horas_lecionadas']
        });

        res.json({
            cursosTerminados,
            cursosDecorrer,
            totalFormandos,
            cursosPorArea,
            topFormadores
        });

    } catch (error) {
        console.error("Erro estatísticas:", error);
        res.status(500).json({ msg: "Erro ao calcular estatísticas" });
    }
};