const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Horario = sequelize.define('Horario', {
    id_horario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    data: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    hora_inicio: {
        type: DataTypes.TIME,
        allowNull: false
    },
    hora_fim: {
        type: DataTypes.TIME,
        allowNull: false
    }
    // As chaves estrangeiras (Curso, Modulo, Sala, Formador) 
    // serão criadas automaticamente no passo seguinte!
}, {
    tableName: 'horarios',
    timestamps: true
});

module.exports = Horario;