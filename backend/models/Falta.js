const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Falta = sequelize.define('Falta', {
    id_falta: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    justificada: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    motivo: {
        type: DataTypes.STRING,
        allowNull: true // Só preenche se for justificada
    }
}, { tableName: 'faltas', timestamps: true });

module.exports = Falta;