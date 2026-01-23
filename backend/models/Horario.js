const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Horario = db.define('Horario', {
    id_horario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    data_aula: {
        type: DataTypes.DATEONLY, // Ex: 2024-05-20
        allowNull: false
    },
    hora_inicio: {
        type: DataTypes.TIME, // Ex: 09:00
        allowNull: false
    },
    hora_fim: {
        type: DataTypes.TIME, // Ex: 13:00
        allowNull: false
    }
    // As chaves estrangeiras (Sala, Módulo) são criadas no associations.js
}, {
    tableName: 'horarios',
    timestamps: true
});

module.exports = Horario;