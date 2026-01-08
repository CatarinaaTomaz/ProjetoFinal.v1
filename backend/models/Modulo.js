const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Modulo = sequelize.define('Modulo', {
    id_modulo: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    horas_totais: { // Para saberes a duração do módulo
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'modulos',
    timestamps: false
});

module.exports = Modulo;