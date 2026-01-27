const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Inscricao = db.define('Inscricao', {
    id_inscricao: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    estado: {
        type: DataTypes.STRING,
        defaultValue: 'Pendente', // Começa sempre como Pendente
        allowNull: false
        // Valores possíveis: 'Pendente', 'Aceite', 'Rejeitado'
    }
}, {
    tableName: 'inscricoes',
    timestamps: true
});

module.exports = Inscricao;