const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Curso = sequelize.define('Curso', {
    id_curso: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    area: { 
       type: DataTypes.ENUM('TPSI', 'CISEG'), // <--- Aceita SÓ estas opções
        allowNull: false,
        defaultValue: 'TPSI'
    },
    data_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    data_fim: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // Por defeito, ao criar é "Falso" (Ainda nao comecou)
        allowNull: false
    }
}, {
    tableName: 'cursos',
    timestamps: true
});

module.exports = Curso;