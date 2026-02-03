const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Modulo = db.define('Modulo', {
    id_modulo: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    cursoId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    formadorId: {
        type: DataTypes.INTEGER,
        allowNull: true 
    },
    salaId: {
        type: DataTypes.INTEGER,
        allowNull: true 
    },
    duracao: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        defaultValue: 50 // Valor padrão caso te esqueças
    }
}, {
    tableName: 'modulos',
    timestamps: true
});

module.exports = Modulo;