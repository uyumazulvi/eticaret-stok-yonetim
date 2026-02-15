const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Token oluşturma
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Kullanıcı kayıt
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { ad, email, sifre, rol } = req.body;

  // Email kontrolü
  const mevcutKullanici = await User.findOne({ where: { email } });
  if (mevcutKullanici) {
    throw new AppError('Bu email adresi zaten kayıtlı', 400);
  }

  // Yeni kullanıcı oluştur
  const user = await User.create({
    ad,
    email,
    sifre,
    rol: rol || 'personel'
  });

  // Token oluştur
  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: 'Kayıt başarılı',
    data: {
      user,
      token
    }
  });
});

// @desc    Kullanıcı giriş
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, sifre } = req.body;

  // Validasyon
  if (!email || !sifre) {
    throw new AppError('Email ve şifre gerekli', 400);
  }

  // Kullanıcı bul
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AppError('Geçersiz email veya şifre', 401);
  }

  // Şifre kontrolü
  const sifreDogruMu = await user.sifreKontrol(sifre);
  if (!sifreDogruMu) {
    throw new AppError('Geçersiz email veya şifre', 401);
  }

  // Aktif mi kontrolü
  if (!user.aktif) {
    throw new AppError('Hesabınız devre dışı bırakılmış', 401);
  }

  // Token oluştur
  const token = generateToken(user);

  res.json({
    success: true,
    message: 'Giriş başarılı',
    data: {
      user,
      token
    }
  });
});

// @desc    Mevcut kullanıcı bilgisi
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  res.json({
    success: true,
    data: user
  });
});

// @desc    Profil güncelleme
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { ad, email } = req.body;

  const user = await User.findByPk(req.user.id);

  if (email && email !== user.email) {
    const mevcutEmail = await User.findOne({ where: { email } });
    if (mevcutEmail) {
      throw new AppError('Bu email adresi zaten kullanılıyor', 400);
    }
  }

  await user.update({ ad, email });

  res.json({
    success: true,
    message: 'Profil güncellendi',
    data: user
  });
});

// @desc    Şifre değiştirme
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { mevcutSifre, yeniSifre } = req.body;

  const user = await User.findByPk(req.user.id);

  // Mevcut şifre kontrolü
  const sifreDogruMu = await user.sifreKontrol(mevcutSifre);
  if (!sifreDogruMu) {
    throw new AppError('Mevcut şifre yanlış', 400);
  }

  // Yeni şifreyi ayarla
  user.sifre = yeniSifre;
  await user.save();

  res.json({
    success: true,
    message: 'Şifre başarıyla değiştirildi'
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
};
