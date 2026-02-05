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

// 4. GERAR HORÁRIOS AUTOMATICAMENTE (IA BÁSICA) 🤖
exports.gerarHorariosAuto = async (req, res) => {
    try {
        const { moduloId, salaId, dataInicio } = req.body;

        // 1. Buscar o Módulo para saber duração e formador
        const modulo = await Modulo.findByPk(moduloId);
        if (!modulo) return res.status(404).json({ msg: "Módulo não encontrado." });

        const formadorId = modulo.userId; // O ID do formador
        if (!formadorId) return res.status(400).json({ msg: "Este módulo não tem formador associado." });

        // 2. Calcular quantas horas faltam marcar
        const aulasExistentes = await Horario.findAll({ where: { moduloId } });
        let horasMarcadas = 0;
        aulasExistentes.forEach(a => {
            horasMarcadas += (timeToDecimal(a.hora_fim) - timeToDecimal(a.hora_inicio));
        });

        let horasRestantes = modulo.duracao - horasMarcadas;

        if (horasRestantes <= 0) {
            return res.status(400).json({ msg: "Este módulo já tem as horas todas marcadas!" });
        }

        // 3. Buscar Disponibilidades do Formador (apenas futuras)
        // Precisamos de importar o modelo Disponibilidade no topo se ainda não estiver
        const { Disponibilidade } = require('../models/associations'); 
        
        const disponibilidades = await Disponibilidade.findAll({
            where: {
                formadorId: formadorId,
                data_inicio: { [Op.gte]: dataInicio } // A partir da data escolhida
            },
            order: [['data_inicio', 'ASC']] // Começa pelas mais próximas
        });

        if (disponibilidades.length === 0) {
            return res.status(400).json({ msg: "O formador não tem disponibilidade registada a partir dessa data." });
        }

        let aulasCriadas = 0;

        // 4. Loop Mágico: Preencher buracos
        for (const disp of disponibilidades) {
            if (horasRestantes <= 0) break;

            const inicioISO = new Date(disp.data_inicio).toISOString();
            const fimISO = new Date(disp.data_fim).toISOString();

            // Agora já podemos fazer split sem erro
            const dataAula = inicioISO.split('T')[0];
            const horaInicioStr = inicioISO.split('T')[1].slice(0, 5); // "09:00"
            const horaFimStr = fimISO.split('T')[1].slice(0, 5);

            const duracaoSlot = timeToDecimal(horaFimStr) - timeToDecimal(horaInicioStr);

            // Verificar se a SALA está livre nesse horário
            const salaOcupada = await Horario.findOne({
                where: {
                    data_aula: dataAula,
                    salaId: salaId,
                    [Op.or]: [
                        { hora_inicio: { [Op.between]: [horaInicioStr, horaFimStr] } },
                        { hora_fim: { [Op.between]: [horaInicioStr, horaFimStr] } }
                    ]
                }
            });

            if (!salaOcupada) {
                // Criar a aula!
                await Horario.create({
                    data_aula: dataAula,
                    hora_inicio: horaInicioStr,
                    hora_fim: horaFimStr,
                    salaId: salaId,
                    moduloId: moduloId
                });

                horasRestantes -= duracaoSlot;
                aulasCriadas++;
            }
        }

        res.json({ 
            msg: `Processo concluído! ${aulasCriadas} aulas agendadas automaticamente.`,
            horasFaltam: Math.max(0, horasRestantes)
        });

    } catch (error) {
        console.error("Erro Auto-Agendamento:", error);
        res.status(500).json({ msg: "Erro ao gerar horários." });
    }
};

exports.listarHorarios = async (req, res) => {
    try {
        const { Modulo, Sala, User, Curso, Inscricao, Horario } = require('../models/associations');
        const { userId } = req.query; // Recebemos o userId do Android

        console.log(`⏰ A pedir horário para User: ${userId}`);

        let whereClause = {};

        if (userId) {
            const user = await User.findByPk(userId);
            
            if (!user) return res.status(404).json([]);

            // === CORREÇÃO: Usar roleId ===
            if (user.roleId === 2) { // 2 = Formando (Aluno)
                console.log("🎓 É Aluno. A procurar aulas dos cursos inscritos...");
                
                // 1. Descobrir Cursos do Aluno
                const inscricoes = await Inscricao.findAll({ where: { userId: userId } });
                const cursosIds = inscricoes.map(i => i.cursoId);

                // 2. Descobrir Aulas desses Cursos
                // (Nota: Precisamos de garantir que o include do Módulo filtra pelo curso)
                whereClause['$Modulo.cursoId$'] = cursosIds;
            } 
            else if (user.roleId === 3) { // 3 = Formador
                console.log("💼 É Formador. A procurar aulas dadas por ele...");
                whereClause['$Modulo.userId$'] = userId;
            }
        }

        const horarios = await Horario.findAll({
            where: whereClause,
            include: [
                { model: Sala, attributes: ['nome'] },
                { model: Modulo, attributes: ['nome', 'cursoId', 'userId'] } // userId aqui é o formador
            ],
            order: [['data_aula', 'ASC'], ['hora_inicio', 'ASC']]
        });

        console.log(`📅 Encontradas ${horarios.length} aulas.`);
        res.json(horarios);

    } catch (error) {
        console.error("Erro Horários:", error);
        res.status(500).json({ msg: "Erro ao listar horários." });
    }
};