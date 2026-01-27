const { Horario, Sala, Modulo, Curso, User, Disponibilidade } = require('../models/associations');
const { Op } = require('sequelize');
const moment = require('moment'); // Se não tiveres, instala: npm install moment

// 1. LISTAR COM FILTROS (Curso, Formador, Datas)
exports.listarHorarios = async (req, res) => {
    try {
        const { cursoId, formadorId, dataInicio, dataFim } = req.query;
        let whereClause = {};

        // Filtro por Intervalo de Tempo
        if (dataInicio && dataFim) {
            whereClause.data_aula = { [Op.between]: [dataInicio, dataFim] };
        }

        // Configuração dos Includes para Filtros
        const includeConfig = [
            { model: Sala, attributes: ['nome'] },
            { 
                model: Modulo, 
                attributes: ['nome', 'duracao_total', 'formadorId'],
                required: true, // Garante que só traz horários com módulos válidos
                include: [
                    { 
                        model: Curso, 
                        attributes: ['nome'], 
                        where: cursoId ? { id_curso: cursoId } : {} // Filtro por Curso
                    },
                    {
                        model: User, as: 'Formador',
                        attributes: ['nome_completo'],
                        where: formadorId ? { id_user: formadorId } : {} // Filtro por Formador
                    }
                ]
            }
        ];

        const horarios = await Horario.findAll({
            where: whereClause,
            include: includeConfig,
            order: [['data_aula', 'ASC'], ['hora_inicio', 'ASC']]
        });
        res.json(horarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao listar horários." });
    }
};

// 2. CRIAR HORÁRIO (COM AS 4 VERIFICAÇÕES DE SEGURANÇA)
exports.criarHorario = async (req, res) => {
    try {
        const { data_aula, hora_inicio, hora_fim, salaId, moduloId } = req.body;

        // 1. Descobrir quem é o Formador deste Módulo
        const modulo = await Modulo.findByPk(moduloId, {
            include: [{ model: User, as: 'Formador' }] // Importante: trazer dados do Formador
        });

        if (!modulo) return res.status(404).json({ msg: "Módulo não encontrado." });
        if (!modulo.Formador) return res.status(400).json({ msg: "Este módulo não tem formador atribuído." });

        const formadorId = modulo.formadorId;
        const nomeFormador = modulo.Formador.nome_completo;

        // -----------------------------------------------------------
        // 👮‍♂️ VERIFICAÇÃO 1: O FORMADOR TEM DISPONIBILIDADE?
        // -----------------------------------------------------------
        
        // Converter as Strings (Data + Hora) para objetos de Data reais
        // Ex: "2026-01-28" + "09:00" = 2026-01-28T09:00:00
        const inicioAula = new Date(`${data_aula}T${hora_inicio}`);
        const fimAula = new Date(`${data_aula}T${hora_fim}`);

        // Pergunta à Base de Dados:
        // "Existe algum registo onde o Formador X disse que começava ANTES desta aula E acabava DEPOIS?"
        const temDisponibilidade = await Disponibilidade.findOne({
            where: {
                formadorId: formadorId,
                data_inicio: { [Op.lte]: inicioAula }, // Disponibilidade começa <= Inicio da Aula
                data_fim: { [Op.gte]: fimAula }        // Disponibilidade acaba >= Fim da Aula
            }
        });

        if (!temDisponibilidade) {
            return res.status(400).json({ 
                msg: `⛔ Indisponível! O formador ${nomeFormador} não registou disponibilidade para este horário (${data_aula} das ${hora_inicio} às ${hora_fim}).` 
            });
        }
        
        // -----------------------------------------------------------
        // VERIFICAÇÃO 2: A SALA JÁ ESTÁ OCUPADA?
        // -----------------------------------------------------------
        const conflitoSala = await Horario.findOne({
            where: {
                salaId: salaId,
                data_aula: data_aula,
                [Op.and]: [
                    { hora_inicio: { [Op.lt]: hora_fim } }, // Começa antes de acabar a nova
                    { hora_fim: { [Op.gt]: hora_inicio } }  // Acaba depois de começar a nova
                ]
            }
        });
        if (conflitoSala) return res.status(400).json({ msg: "❌ A Sala já está ocupada neste horário!" });

        // -----------------------------------------------------------
        // VERIFICAÇÃO 3: O FORMADOR JÁ ESTÁ NOUTRA AULA? (Clonagem proibida)
        // -----------------------------------------------------------
        const conflitoFormador = await Horario.findOne({
            where: {
                data_aula: data_aula,
                [Op.and]: [
                    { hora_inicio: { [Op.lt]: hora_fim } },
                    { hora_fim: { [Op.gt]: hora_inicio } }
                ]
            },
            include: [{
                model: Modulo,
                where: { formadorId: formadorId } // Procura aulas de qq módulo deste formador
            }]
        });

        if (conflitoFormador) return res.status(400).json({ msg: `❌ O formador ${nomeFormador} já está a dar outra aula noutra sala à mesma hora!` });

        // SE PASSOU TUDO: CRIA A AULA!
        await Horario.create({ data_aula, hora_inicio, hora_fim, salaId, moduloId });
        res.status(201).json({ msg: "✅ Aula agendada com sucesso!" });

    } catch (error) {
        console.error("Erro criar horário:", error);
        res.status(500).json({ msg: "Erro interno no servidor." });
    }
};

exports.eliminarHorario = async (req, res) => {
    try { await Horario.destroy({ where: { id_horario: req.params.id } }); res.json({ msg: "Removido." }); } 
    catch (e) { res.status(500).json({ msg: "Erro." }); }
};