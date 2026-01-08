const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChatMensagem = sequelize.define('ChatMensagem', {
    id_mensagem: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    conteudo: {
        type: DataTypes.TEXT, // TEXT porque a mensagem pode ser grande
        allowNull: false
    },
    enviado_por: {
        type: DataTypes.ENUM('user', 'bot'), // Quem escreveu?
        allowNull: false
    },
    data_envio: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, { tableName: 'chat_mensagens', timestamps: false });

module.exports = ChatMensagem;