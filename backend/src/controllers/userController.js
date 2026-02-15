const { Op } = require('sequelize');
const { User } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Tüm kullanıcıları getir
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    rol,
    aktif,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  // Arama filtresi
  if (search) {
    where[Op.or] = [
      { ad: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Rol filtresi
  if (rol) {
    where.rol = rol;
  }

  // Aktif filtresi
  if (aktif !== undefined) {
    where.aktif = aktif === 'true';
  }

  const { count, rows: users } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['sifre'] },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder]]
  });

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    }
  });
});

// @desc    Tek kullanıcı getir
// @route   GET /api/users/:id
// @access  Private (Admin)
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['sifre'] }
  });

  if (!user) {
    throw new AppError('Kullanıcı bulunamadı', 404);
  }

  res.json({
    success: true,
    data: user
  });
});

// @desc    Kullanıcı oluştur
// @route   POST /api/users
// @access  Private (Admin)
const createUser = asyncHandler(async (req, res) => {
  const { ad, email, sifre, rol } = req.body;

  // Email kontrolü
  const mevcutKullanici = await User.findOne({ where: { email } });
  if (mevcutKullanici) {
    throw new AppError('Bu email adresi zaten kayıtlı', 400);
  }

  const user = await User.create({
    ad,
    email,
    sifre,
    rol: rol || 'personel'
  });

  res.status(201).json({
    success: true,
    message: 'Kullanıcı başarıyla oluşturuldu',
    data: user
  });
});

// @desc    Kullanıcı güncelle
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = asyncHandler(async (req, res) => {
  const { ad, email, rol, aktif } = req.body;

  const user = await User.findByPk(req.params.id);

  if (!user) {
    throw new AppError('Kullanıcı bulunamadı', 404);
  }

  // Email değişiyorsa kontrol et
  if (email && email !== user.email) {
    const mevcutEmail = await User.findOne({ where: { email } });
    if (mevcutEmail) {
      throw new AppError('Bu email adresi zaten kullanılıyor', 400);
    }
  }

  await user.update({ ad, email, rol, aktif });

  res.json({
    success: true,
    message: 'Kullanıcı başarıyla güncellendi',
    data: user
  });
});

// @desc    Kullanıcı sil
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    throw new AppError('Kullanıcı bulunamadı', 404);
  }

  // Kendi hesabını silmeye çalışıyorsa engelle
  if (user.id === req.user.id) {
    throw new AppError('Kendi hesabınızı silemezsiniz', 400);
  }

  await user.destroy();

  res.json({
    success: true,
    message: 'Kullanıcı başarıyla silindi'
  });
});

// @desc    Kullanıcı şifresini sıfırla
// @route   PUT /api/users/:id/reset-password
// @access  Private (Admin)
const resetPassword = asyncHandler(async (req, res) => {
  const { yeniSifre } = req.body;

  const user = await User.findByPk(req.params.id);

  if (!user) {
    throw new AppError('Kullanıcı bulunamadı', 404);
  }

  user.sifre = yeniSifre;
  await user.save();

  res.json({
    success: true,
    message: 'Şifre başarıyla sıfırlandı'
  });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetPassword
};
