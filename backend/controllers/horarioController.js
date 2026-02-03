const { Horario, Modulo, Sala } = require('../models/associations');
const { Op } = require('sequelize');

// --- FUNÇÃO AUXILIAR MELHORADA ---
const timeToDecimal = (t) => {
    if (!t) return 0;
    // .trim() remove espaços
    // parseInt() apanha o número e ignora o " AM" ou " PM"
    const [hString, mString] = t.split(':');
    let h = parseInt(hString);
    const m = parseInt(mString);

    // Ajuste opcional para formato 12h (se quiseres ser muito rigoroso)
    if (t.toLowerCase().includes('pm') && h !== 12) h += 12;
    if (t.toLowerCase().includes('am') && h === 12) h = 0;

    return h + (m / 60);
};
// ---------------------------------

exports.listarHorarios = async (req, res) => {
    try {
        const horarios = await Horario.findAll({
            include: [
                { model: Sala, attributes: ['nome'] },
                { model: Modulo, attributes: ['nome', 'duracao'] }
            ],
            order: [['data_aula', 'ASC'], ['hora_inicio', 'ASC']]
        });
        res.json(horarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao listar." });
    }
};

exports.criarHorario = async (req, res) => {
    try {
        const { data, inicio, fim, salaId, moduloId } = req.body;

        // 1. DEBUG: Ver o que está a chegar do Frontend
        console.log("DADOS RECEBIDOS:", { data, inicio, fim, salaId, moduloId });

        // 2. Calcular Duração
        const hInicio = timeToDecimal(inicio);
        const hFim = timeToDecimal(fim);
        const duracaoNovaAula = hFim - hInicio;

        console.log(`Contas: ${hFim} - ${hInicio} = ${duracaoNovaAula}`);

        if (duracaoNovaAula <= 0) {
            return res.status(400).json({ msg: "A hora de fim tem de ser depois do início!" });
        }

        // 3. Buscar Módulo
        const modulo = await Modulo.findByPk(moduloId);
        if (!modulo) return res.status(404).json({ msg: "Módulo não encontrado." });

        const limiteHoras = modulo.duracao;

        // 4. Calcular horas já gastas
        const aulasExistentes = await Horario.findAll({ where: { moduloId: moduloId } });

        let horasJaMarcadas = 0;
        aulasExistentes.forEach(aula => {
            const i = timeToDecimal(aula.hora_inicio);
            const f = timeToDecimal(aula.hora_fim);
            horasJaMarcadas += (f - i);
        });

        if (horasJaMarcadas + duracaoNovaAula > limiteHoras) {
            const restantes = Math.max(0, limiteHoras - horasJaMarcadas).toFixed(1);
            return res.status(400).json({ 
                msg: `Ultrapassa o limite! Restam ${restantes}h de ${limiteHoras}h.` 
            });
        }

        // 5. Validar Sala Ocupada
        const ocupado = await Horario.findOne({
            where: {
                data_aula: data,
                salaId: salaId,
                [Op.or]: [
                    { hora_inicio: { [Op.between]: [inicio, fim] } },
                    { hora_fim: { [Op.between]: [inicio, fim] } }
                ]
            }
        });

        if (ocupado) return res.status(400).json({ msg: "Sala ocupada nesse horário!" });

        await Horario.create({
            data_aula: data,
            hora_inicio: inicio,
            hora_fim: fim,
            salaId,
            moduloId
        });

        res.json({ msg: "Horário agendado!" });

    } catch (error) {
        console.error("Erro no criarHorario:", error);
        res.status(500).json({ msg: "Erro ao criar horário." });
    }
};

// 3. ELIMINAR HORÁRIO
exports.eliminarHorario = async (req, res) => {
    try {
        const { id } = req.params;

        // Apaga onde o ID for igual ao que recebemos
        const resultado = await Horario.destroy({
            where: { id_horario: id }
        });

        if (!resultado) {
            return res.status(404).json({ msg: "Horário não encontrado." });
        }

        res.json({ msg: "Horário eliminado com sucesso!" });

    } catch (error) {
        console.error("Erro ao eliminar horário:", error);
        res.status(500).json({ msg: "Erro ao eliminar horário." });
    }
};