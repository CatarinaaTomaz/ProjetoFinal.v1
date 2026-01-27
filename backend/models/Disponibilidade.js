const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Disponibilidade = db.define('Disponibilidade', {
    // SEM ID MANUAL. O Sequelize cria o 'id' sozinho.
    data_inicio: { 
        type: DataTypes.DATE, 
        allowNull: false 
    }, 
    data_fim: { 
        type: DataTypes.DATE, 
        allowNull: false 
    }
}, {
    tableName: 'disponibilidades',
    timestamps: true
});

module.exports = Disponibilidade;