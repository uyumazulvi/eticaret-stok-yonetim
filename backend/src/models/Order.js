const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  siparis_no: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  musteri_adi: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Müşteri adı boş olamaz' }
    }
  },
  musteri_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: { msg: 'Geçerli bir email adresi giriniz' }
    }
  },
  musteri_telefon: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  teslimat_adresi: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  toplam_tutar: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      isDecimal: { msg: 'Toplam tutar geçerli bir sayı olmalı' },
      min: { args: [0], msg: 'Toplam tutar 0\'dan küçük olamaz' }
    }
  },
  durum: {
    type: DataTypes.ENUM('beklemede', 'hazirlaniyor', 'kargoda', 'tamamlandi', 'iptal'),
    defaultValue: 'beklemede',
    allowNull: false
  },
  notlar: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'orders',
  hooks: {
    beforeValidate: (order) => {
      // Sipariş numarası yoksa oluştur
      if (!order.siparis_no) {
        const tarih = new Date();
        const yil = tarih.getFullYear().toString().slice(-2);
        const ay = (tarih.getMonth() + 1).toString().padStart(2, '0');
        const gun = tarih.getDate().toString().padStart(2, '0');
        const rastgele = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        order.siparis_no = `SP${yil}${ay}${gun}${rastgele}`;
      }
    }
  }
});

module.exports = Order;
