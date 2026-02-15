// Genel Hata Yakalama Middleware
const errorHandler = (err, req, res, next) => {
  console.error('Hata:', err);

  // Sequelize Validation Hatası
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Doğrulama hatası',
      errors
    });
  }

  // Sequelize Unique Constraint Hatası
  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Bu değer zaten mevcut',
      errors
    });
  }

  // Sequelize Foreign Key Hatası
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'İlişkili kayıt bulunamadı'
    });
  }

  // JWT Hataları
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token süresi dolmuş'
    });
  }

  // Özel Hata Sınıfları
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Varsayılan Sunucu Hatası
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Sunucu hatası oluştu'
  });
};

// 404 Handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `${req.originalUrl} bulunamadı`
  });
};

// Async Handler Wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom Error Class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError
};
