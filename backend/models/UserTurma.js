const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserTurma = sequelize.define('UserTurma', {
    id_user_turma: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Aqui podes adicionar campos extra se quiseres, por exemplo:
    data_entrada: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    ativo: { // Para saber se ele ainda pertence a esta turma
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'user_turmas',
    timestamps: true
});

module.exports = UserTurma;