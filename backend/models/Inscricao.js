const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Inscricao = sequelize.define('Inscricao', {
    id_inscricao: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    data_inscricao: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    estado: {
        type: DataTypes.ENUM('Ativo', 'Concluido', 'Desistiu'),
        defaultValue: 'Ativo'
    }
}, { tableName: 'inscricoes', timestamps: false });

module.exports = Inscricao;