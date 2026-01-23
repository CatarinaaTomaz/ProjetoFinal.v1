const { Horario, Sala, Modulo, Curso } = require('../models/associations');
const { Op } = require('sequelize');

// 1. Listar Horários (com filtro opcional por data ou sala)
exports.listarHorarios = async (req, res) => {
    try {
        const horarios = await Horario.findAll({
            include: [
                { model: Sala, attributes: ['nome'] },
                { 
                    model: Modulo, 
                    attributes: ['nome'],
                    include: [{ model: Curso, attributes: ['nome'] }] // Para saber o curso
                }
            ],
            order: [['data_aula', 'ASC'], ['hora_inicio', 'ASC']]
        });
        res.json(horarios);
    } catch (error) {
        res.status(500).json({ msg: "Erro ao listar horários." });
    }
};

// 2. Criar Reserva (Com verificação de conflitos!)
exports.criarHorario = async (req, res) => {
    try {
        const { data_aula, hora_inicio, hora_fim, salaId, moduloId } = req.body;

        // VERIFICAÇÃO DE CONFLITO: "Já existe aula nesta sala, neste dia, a bater nestas horas?"
        const conflito = await Horario.findOne({
            where: {
                salaId: salaId,
                data_aula: data_aula,
                [Op.and]: [
                    { hora_inicio: { [Op.lt]: hora_fim } }, // Começa antes da nova acabar
                    { hora_fim: { [Op.gt]: hora_inicio } }  // Acaba depois da nova começar
                ]
            }
        });

        if (conflito) {
            return res.status(400).json({ msg: "❌ Sala ocupada nesse horário!" });
        }

        await Horario.create({ data_aula, hora_inicio, hora_fim, salaId, moduloId });
        res.status(201).json({ msg: "Horário agendado com sucesso!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao criar horário." });
    }
};

// 3. Eliminar Horário
exports.eliminarHorario = async (req, res) => {
    try {
        await Horario.destroy({ where: { id_horario: req.params.id } });
        res.json({ msg: "Horário removido." });
    } catch (error) {
        res.status(500).json({ msg: "Erro ao eliminar." });
    }
};