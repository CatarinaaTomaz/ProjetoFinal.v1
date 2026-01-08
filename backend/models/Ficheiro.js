const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Ficheiro = sequelize.define('Ficheiro', {
    id_ficheiro: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome_original: { type: DataTypes.STRING, allowNull: false },
    caminho: { type: DataTypes.STRING, allowNull: false }, // Onde está guardado no disco
    tipo: { type: DataTypes.STRING } // pdf, jpg, etc
}, { tableName: 'ficheiros', timestamps: true });

module.exports = Ficheiro;