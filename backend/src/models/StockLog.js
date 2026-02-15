const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockLog = sequelize.define('StockLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  degisim_miktari: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Pozitif: stok girişi, Negatif: stok çıkışı'
  },
  onceki_stok: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  yeni_stok: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  islem_tipi: {
    type: DataTypes.ENUM('giris', 'cikis', 'duzeltme', 'siparis', 'iade'),
    allowNull: false
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'İşlemi yapan kullanıcı'
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id'
    },
    comment: 'İlişkili sipariş (varsa)'
  }
}, {
  tableName: 'stock_logs',
  indexes: [
    {
      fields: ['product_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['islem_tipi']
    }
  ]
});

module.exports = StockLog;
