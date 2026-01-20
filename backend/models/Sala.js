const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Sala = db.define('Sala', {
    id_sala: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false // Ex: "Sala 1.4"
    },
    tipo: { 
        type: DataTypes.ENUM('Sala Teórica', 'Laboratório', 'Auditório'), 
        defaultValue: 'Sala Teórica'
    },
    capacidade: {
        type: DataTypes.INTEGER,
        allowNull: false // Ex: 25 pessoas
    }
}, {
    tableName: 'salas',
    timestamps: true
});

module.exports = Sala;