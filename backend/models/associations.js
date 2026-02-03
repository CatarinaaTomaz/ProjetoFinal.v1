const User = require('./User');
const Role = require('./Role');
const Curso = require('./Curso');
const Sala = require('./Sala');
const Modulo = require('./Modulo');
const Horario = require('./Horario');
const Turma = require('./Turma');
const Inscricao = require('./Inscricao');
const Avaliacao = require('./Avaliacao');
const Ficheiro = require('./Ficheiro');
const Disponibilidade = require('./Disponibilidade');
const ChatMensagem = require('./ChatMensagem');
const Falta = require('./Falta');
const UserTurma = require('./UserTurma');

// ==========================================================
// 1. UTILIZADORES E ROLES
// ==========================================================
User.belongsTo(Role, { foreignKey: 'roleId' });
Role.hasMany(User, { foreignKey: 'roleId' });

// ==========================================================
// 2. ESTRUTURA ACADÉMICA (CURSO -> TURMA -> ALUNO)
// ==========================================================
User.belongsToMany(Curso, { through: Inscricao, foreignKey: 'userId' });
Curso.belongsToMany(User, { through: Inscricao, foreignKey: 'cursoId' });

Inscricao.belongsTo(User, { foreignKey: 'userId' });
Inscricao.belongsTo(Curso, { foreignKey: 'cursoId' });
User.hasMany(Inscricao, { foreignKey: 'userId' });
Curso.hasMany(Inscricao, { foreignKey: 'cursoId' });

Turma.belongsTo(Curso, { foreignKey: 'cursoId' });
Curso.hasMany(Turma, { foreignKey: 'cursoId' });

User.belongsToMany(Turma, { through: UserTurma, foreignKey: 'userId' });
Turma.belongsToMany(User, { through: UserTurma, foreignKey: 'turmaId' });

User.hasMany(UserTurma, { foreignKey: 'userId' });
UserTurma.belongsTo(User, { foreignKey: 'userId' });
Turma.hasMany(UserTurma, { foreignKey: 'turmaId' });
UserTurma.belongsTo(Turma, { foreignKey: 'turmaId' });

// ==========================================================
// 3. HORÁRIOS 
// ==========================================================
Horario.belongsTo(Sala, { foreignKey: 'salaId' });
Sala.hasMany(Horario, { foreignKey: 'salaId' });

Horario.belongsTo(Modulo, { foreignKey: 'moduloId' }); 
Modulo.hasMany(Horario, { foreignKey: 'moduloId' });

// ==========================================================
// 4. AVALIAÇÕES E MÓDULOS
// ==========================================================
Curso.hasMany(Modulo, { foreignKey: 'cursoId', onDelete: 'CASCADE' });
Modulo.belongsTo(Curso, { foreignKey: 'cursoId' }); 

Avaliacao.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Avaliacao, { foreignKey: 'userId' });

Avaliacao.belongsTo(Modulo, { foreignKey: 'moduloId' });
Modulo.hasMany(Avaliacao, { foreignKey: 'moduloId' });

// --- CORREÇÃO AQUI ---
// Um Módulo pertence a uma Sala
Modulo.belongsTo(Sala, { foreignKey: 'salaId' });

// Um Módulo pertence a um Formador (User) -> USAMOS userId
Modulo.belongsTo(User, { as: 'Formador', foreignKey: 'userId' }); 
User.hasMany(Modulo, { foreignKey: 'userId' });

// (Apaguei a linha duplicada que usava formadorId)
// ---------------------

// ==========================================================
// 5. EXTRAS
// ==========================================================
Ficheiro.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Ficheiro, { foreignKey: 'userId' });

ChatMensagem.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(ChatMensagem, { foreignKey: 'userId' });

Falta.belongsTo(User, { foreignKey: 'alunoId' });
User.hasMany(Falta, { foreignKey: 'alunoId' });

Falta.belongsTo(Horario, { foreignKey: 'horarioId' });
Horario.hasMany(Falta, { foreignKey: 'horarioId' });

User.hasMany(Disponibilidade, { foreignKey: 'formadorId' });
Disponibilidade.belongsTo(User, { foreignKey: 'formadorId' });

// ==========================================================
// 6. EXPORTAR
// ==========================================================
module.exports = { 
    User, Role, Curso, Sala, Modulo, Horario, Turma, 
    Inscricao, Avaliacao, Ficheiro, Disponibilidade, 
    ChatMensagem, Falta, UserTurma 
};