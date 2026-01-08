const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Avaliacao = sequelize.define('Avaliacao', {
    id_avaliacao: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nota: {
        type: DataTypes.DECIMAL(4, 2), // Ex: 18.50
        allowNull: true
    },
    data_lancamento: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    }
}, { tableName: 'avaliacoes', timestamps: false });

module.exports = Avaliacao;