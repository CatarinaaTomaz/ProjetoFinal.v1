const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Disponibilidade = sequelize.define('Disponibilidade', {
    id_disponibilidade: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    data_inicio: { // Pode ser uma data específica ou null se for recorrente
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    data_fim: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    hora_inicio: {
        type: DataTypes.TIME,
        allowNull: false
    },
    hora_fim: {
        type: DataTypes.TIME,
        allowNull: false
    },
    // Se true = Estou livre nestas horas. Se false = Estou ocupado/férias.
    esta_livre: { 
        type: DataTypes.BOOLEAN,
        defaultValue: true 
    },
    obs: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, { tableName: 'disponibilidades', timestamps: true });

module.exports = Disponibilidade;