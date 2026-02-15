const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  adet: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      isInt: { msg: 'Adet geçerli bir tam sayı olmalı' },
      min: { args: [1], msg: 'Adet en az 1 olmalı' }
    }
  },
  birim_fiyat: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: { msg: 'Birim fiyat geçerli bir sayı olmalı' },
      min: { args: [0], msg: 'Birim fiyat 0\'dan küçük olamaz' }
    }
  },
  toplam: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'order_items',
  hooks: {
    beforeSave: (orderItem) => {
      orderItem.toplam = orderItem.adet * orderItem.birim_fiyat;
    }
  }
});

module.exports = OrderItem;
