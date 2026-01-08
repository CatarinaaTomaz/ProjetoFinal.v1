const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Sala = sequelize.define('Sala', {
    id_sala: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    capacidade: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tipo: { 
        type: DataTypes.ENUM('Sala Teórica', 'Laboratório', 'Auditório'), // <--- Aceita SÓ estas opções
        defaultValue: 'Sala Teórica'
    }
}, {
    tableName: 'salas',
    timestamps: false
});

module.exports = Sala;