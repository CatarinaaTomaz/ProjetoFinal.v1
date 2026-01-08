const Sequelize = require('sequelize');


const sequelize = new Sequelize(
    'db_project',      
    'user',          
    'pass614',        
    {
        host: '127.0.0.1',
        dialect: 'mysql',
        port: 3307,    
        logging: false,
    }
);

module.exports = sequelize;