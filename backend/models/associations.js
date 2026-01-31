const User = require('./User');
const Role = require('./Role');
const Curso = require('./Curso');
const Sala = require('./Sala');
const Modulo = require('./Modulo');
const Horario = require('./Horario');
const Turma = require('./Turma');
const Inscricao = require('./Inscricao'); // Mantemos o import para não dar erro, mas não usamos na relação direta
const Avaliacao = require('./Avaliacao');
const Ficheiro = require('./Ficheiro');
const Disponibilidade = require('./Disponibilidade');
const ChatMensagem = require('./ChatMensagem');
const Falta = require('./Falta');
const UserTurma = require('./UserTurma');

// ==========================================================
// 1. UTILIZADORES E ROLES
// ==========================================================
// Um utilizador tem uma Role (Admin, Formando, Formador)
User.belongsTo(Role, { foreignKey: 'roleId' });
Role.hasMany(User, { foreignKey: 'roleId' });

// ==========================================================
// 2. ESTRUTURA ACADÉMICA (CURSO -> TURMA -> ALUNO)
// ==========================================================

// User <-> Inscricao <-> Curso
// Isto permite listar "Todos os cursos que o aluno já fez"
User.belongsToMany(Curso, { through: Inscricao, foreignKey: 'userId' });
Curso.belongsToMany(User, { through: Inscricao, foreignKey: 'cursoId' });

// Acesso direto à tabela Inscricao (útil para ver o 'estado' ou 'data_inscricao')
Inscricao.belongsTo(User, { foreignKey: 'userId' });
Inscricao.belongsTo(Curso, { foreignKey: 'cursoId' });

User.hasMany(Inscricao, { foreignKey: 'userId' });
Curso.hasMany(Inscricao, { foreignKey: 'cursoId' });

// Uma Turma pertence a um Curso (ex: A turma '0525' é do curso 'TPSI')
Turma.belongsTo(Curso, { foreignKey: 'cursoId' });
Curso.hasMany(Turma, { foreignKey: 'cursoId' });

// RELAÇÃO N:N -> Um Aluno pertence a uma Turma (Tabela intermédia UserTurma)
User.belongsToMany(Turma, { through: UserTurma, foreignKey: 'userId' });
Turma.belongsToMany(User, { through: UserTurma, foreignKey: 'turmaId' });

// (Opcional) Associações diretas à tabela intermédia para facilitar consultas
User.hasMany(UserTurma, { foreignKey: 'userId' });
UserTurma.belongsTo(User, { foreignKey: 'userId' });
Turma.hasMany(UserTurma, { foreignKey: 'turmaId' });
UserTurma.belongsTo(Turma, { foreignKey: 'turmaId' });

// ==========================================================
// 3. HORÁRIOS 
// ==========================================================
Horario.belongsTo(Sala, { foreignKey: 'salaId' });
Horario.belongsTo(Modulo, { foreignKey: 'moduloId' }); 
Sala.hasMany(Horario, { foreignKey: 'salaId' });
Modulo.hasMany(Horario, { foreignKey: 'moduloId' });

// ==========================================================
// 4. AVALIAÇÕES E MÓDULOS
// ==========================================================

Curso.hasMany(Modulo, { foreignKey: 'cursoId', onDelete: 'CASCADE' });
Modulo.belongsTo(Curso, { foreignKey: 'cursoId' }); 

// Avaliações (Ligam diretamente o Aluno ao Módulo, sem passar por Inscrição/Curso)
Avaliacao.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Avaliacao, { foreignKey: 'userId' });

Avaliacao.belongsTo(Modulo, { foreignKey: 'moduloId' });
Modulo.hasMany(Avaliacao, { foreignKey: 'moduloId' });

// Um Módulo "pertence" a um Formador (User) e a uma Sala
Modulo.belongsTo(User, { as: 'Formador', foreignKey: 'formadorId' });
Modulo.belongsTo(Sala, { foreignKey: 'salaId' });

// ==========================================================
// 5. FUNCIONALIDADES EXTRAS (ANEXOS, CHAT, FALTAS)
// ==========================================================

// Ficheiros (Anexos de Formandos ou Formadores)
Ficheiro.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Ficheiro, { foreignKey: 'userId' });

// ChatBot (Histórico de mensagens)
ChatMensagem.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(ChatMensagem, { foreignKey: 'userId' });

// Faltas (Aluno falta a um Horário)
Falta.belongsTo(User, { foreignKey: 'alunoId' });
User.hasMany(Falta, { foreignKey: 'alunoId' });

Falta.belongsTo(Horario, { foreignKey: 'horarioId' });
Horario.hasMany(Falta, { foreignKey: 'horarioId' });

// Disponibilidade (Formador ou Sala)
User.hasMany(Disponibilidade, { foreignKey: 'formadorId' });
Disponibilidade.belongsTo(User, { foreignKey: 'formadorId' });

// ==========================================================
// 6. EXPORTAR TUDO
// ==========================================================
module.exports = { 
    User, 
    Role, 
    Curso, 
    Sala, 
    Modulo, 
    Horario, 
    Turma, 
    Inscricao, // Exportamos mas não estamos a usar nas relações ativas
    Avaliacao, 
    Ficheiro,
    Disponibilidade, 
    ChatMensagem, 
    Falta,
    UserTurma 
};