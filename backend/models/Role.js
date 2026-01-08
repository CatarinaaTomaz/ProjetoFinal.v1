const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Role = sequelize.define('Role', {
    id_role: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    descricao: { 
        type: DataTypes.ENUM('Formando', 'Formador', 'Admin', 'Secretaria'), // <--- Aceita SÓ estas opções
        defaultValue: 'Formando'
    }
}, {
    tableName: 'roles',
    timestamps: false
});

module.exports = Role;