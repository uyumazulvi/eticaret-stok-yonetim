const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ad: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Ad alanı boş olamaz' },
      len: { args: [2, 100], msg: 'Ad 2-100 karakter arasında olmalı' }
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: { msg: 'Bu email adresi zaten kayıtlı' },
    validate: {
      isEmail: { msg: 'Geçerli bir email adresi giriniz' }
    }
  },
  sifre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: { args: [6, 255], msg: 'Şifre en az 6 karakter olmalı' }
    }
  },
  rol: {
    type: DataTypes.ENUM('admin', 'personel'),
    defaultValue: 'personel',
    allowNull: false
  },
  aktif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.sifre) {
        const salt = await bcrypt.genSalt(12);
        user.sifre = await bcrypt.hash(user.sifre, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('sifre')) {
        const salt = await bcrypt.genSalt(12);
        user.sifre = await bcrypt.hash(user.sifre, salt);
      }
    }
  }
});

// Instance method to check password
User.prototype.sifreKontrol = async function(girilenSifre) {
  return await bcrypt.compare(girilenSifre, this.sifre);
};

// Hide password in JSON
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.sifre;
  return values;
};

module.exports = User;
