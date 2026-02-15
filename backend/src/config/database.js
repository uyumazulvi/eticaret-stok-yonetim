const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

let sequelize;

// Production (Render) veya Development
if (process.env.DATABASE_URL) {
  // Render PostgreSQL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  });
} else {
  // Local SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true
    }
  });
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Veritabanı bağlantısı başarılı!');
    await sequelize.sync({ alter: true });
    console.log('Veritabanı modelleri senkronize edildi.');
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
