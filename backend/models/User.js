const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    // AQUI ESTÁ A CORREÇÃO: Definimos explicitamente o id_user
    id_user: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome_completo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    conta_ativa: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    token_ativacao: {
        type: DataTypes.STRING,
        allowNull: true
    },
    googleId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    facebookId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Campos do 2FA
    otp_codigo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    otp_validade: {
        type: DataTypes.DATE,
        allowNull: true
    },
    reset_token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reset_expires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    foto: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null // Se não tiver foto, fica null
    },
    horas_lecionadas: {
        type: DataTypes.INTEGER,
        defaultValue: 0, // Começa com 0 horas
        allowNull: false
    }
    }, {
    tableName: 'utilizadores',
    timestamps: true
});

module.exports = User;