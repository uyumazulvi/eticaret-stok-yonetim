const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  urun_adi: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Ürün adı boş olamaz' },
      len: { args: [2, 255], msg: 'Ürün adı 2-255 karakter arasında olmalı' }
    }
  },
  kategori: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Kategori boş olamaz' }
    }
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fiyat: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: { msg: 'Fiyat geçerli bir sayı olmalı' },
      min: { args: [0], msg: 'Fiyat 0\'dan küçük olamaz' }
    }
  },
  stok: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      isInt: { msg: 'Stok geçerli bir tam sayı olmalı' },
      min: { args: [0], msg: 'Stok 0\'dan küçük olamaz' }
    }
  },
  kritik_stok_seviyesi: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    validate: {
      isInt: { msg: 'Kritik stok seviyesi geçerli bir tam sayı olmalı' },
      min: { args: [0], msg: 'Kritik stok seviyesi 0\'dan küçük olamaz' }
    }
  },
  durum: {
    type: DataTypes.ENUM('aktif', 'pasif', 'tukendi'),
    defaultValue: 'aktif',
    allowNull: false
  },
  barkod: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: true
  },
  resim_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'products',
  hooks: {
    beforeSave: (product) => {
      // Otomatik durum güncelleme
      if (product.stok === 0) {
        product.durum = 'tukendi';
      } else if (product.durum === 'tukendi' && product.stok > 0) {
        product.durum = 'aktif';
      }
    }
  }
});

// Virtual field for kritik stok kontrolü
Product.prototype.kritikStokMu = function() {
  return this.stok <= this.kritik_stok_seviyesi;
};

module.exports = Product;
