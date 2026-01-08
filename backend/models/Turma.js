const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Turma = sequelize.define('Turma', {
    id_turma: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: { 
        type: DataTypes.STRING,
        allowNull: false
    },
    ano_letivo: { 
        type: DataTypes.STRING,
        allowNull: false
    },
    data_inicio: {
        type: DataTypes.DATEONLY
    },
    data_fim: {
        type: DataTypes.DATEONLY
    }
}, {
    tableName: 'turmas',
    timestamps: true
});

module.exports = Turma;