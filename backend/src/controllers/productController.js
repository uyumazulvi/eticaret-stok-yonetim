const { Op, col } = require('sequelize');
const { sequelize } = require('../config/database');
const { Product, StockLog } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Tüm ürünleri getir
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    kategori,
    durum,
    kritik_stok,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  // Arama filtresi
  if (search) {
    where[Op.or] = [
      { urun_adi: { [Op.iLike]: `%${search}%` } },
      { barkod: { [Op.iLike]: `%${search}%` } },
      { kategori: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Kategori filtresi
  if (kategori) {
    where.kategori = kategori;
  }

  // Durum filtresi
  if (durum) {
    where.durum = durum;
  }

  // Kritik stok filtresi
  if (kritik_stok === 'true') {
    where[Op.and] = [
      { stok: { [Op.lte]: { [Op.col]: 'kritik_stok_seviyesi' } } }
    ];
  }

  const { count, rows: products } = await Product.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder]]
  });

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    }
  });
});

// @desc    Tek ürün getir
// @route   GET /api/products/:id
// @access  Private
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id, {
    include: [
      {
        model: StockLog,
        as: 'stok_hareketleri',
        limit: 10,
        order: [['createdAt', 'DESC']]
      }
    ]
  });

  if (!product) {
    throw new AppError('Ürün bulunamadı', 404);
  }

  res.json({
    success: true,
    data: product
  });
});

// @desc    Ürün oluştur
// @route   POST /api/products
// @access  Private (Admin)
const createProduct = asyncHandler(async (req, res) => {
  const {
    urun_adi,
    kategori,
    aciklama,
    fiyat,
    stok,
    kritik_stok_seviyesi,
    barkod,
    resim_url
  } = req.body;

  const product = await Product.create({
    urun_adi,
    kategori,
    aciklama,
    fiyat,
    stok: stok || 0,
    kritik_stok_seviyesi: kritik_stok_seviyesi || 10,
    barkod,
    resim_url
  });

  // İlk stok kaydı oluştur
  if (stok > 0) {
    await StockLog.create({
      product_id: product.id,
      degisim_miktari: stok,
      onceki_stok: 0,
      yeni_stok: stok,
      islem_tipi: 'giris',
      aciklama: 'İlk stok girişi',
      user_id: req.user.id
    });
  }

  // WebSocket ile bildirim gönder
  if (req.io) {
    req.io.emit('product:created', product);
  }

  res.status(201).json({
    success: true,
    message: 'Ürün başarıyla oluşturuldu',
    data: product
  });
});

// @desc    Ürün güncelle
// @route   PUT /api/products/:id
// @access  Private (Admin)
const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findByPk(req.params.id);

  if (!product) {
    throw new AppError('Ürün bulunamadı', 404);
  }

  const {
    urun_adi,
    kategori,
    aciklama,
    fiyat,
    kritik_stok_seviyesi,
    durum,
    barkod,
    resim_url
  } = req.body;

  await product.update({
    urun_adi,
    kategori,
    aciklama,
    fiyat,
    kritik_stok_seviyesi,
    durum,
    barkod,
    resim_url
  });

  // WebSocket ile bildirim gönder
  if (req.io) {
    req.io.emit('product:updated', product);
  }

  res.json({
    success: true,
    message: 'Ürün başarıyla güncellendi',
    data: product
  });
});

// @desc    Ürün sil
// @route   DELETE /api/products/:id
// @access  Private (Admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) {
    throw new AppError('Ürün bulunamadı', 404);
  }

  await product.destroy();

  // WebSocket ile bildirim gönder
  if (req.io) {
    req.io.emit('product:deleted', { id: req.params.id });
  }

  res.json({
    success: true,
    message: 'Ürün başarıyla silindi'
  });
});

// @desc    Stok güncelle
// @route   PUT /api/products/:id/stock
// @access  Private
const updateStock = asyncHandler(async (req, res) => {
  const { miktar, islem_tipi, aciklama } = req.body;
  const product = await Product.findByPk(req.params.id);

  if (!product) {
    throw new AppError('Ürün bulunamadı', 404);
  }

  const oncekiStok = product.stok;
  let yeniStok;

  if (islem_tipi === 'giris' || islem_tipi === 'iade') {
    yeniStok = oncekiStok + parseInt(miktar);
  } else if (islem_tipi === 'cikis') {
    yeniStok = oncekiStok - parseInt(miktar);
    if (yeniStok < 0) {
      throw new AppError('Yetersiz stok', 400);
    }
  } else if (islem_tipi === 'duzeltme') {
    yeniStok = parseInt(miktar);
  } else {
    throw new AppError('Geçersiz işlem tipi', 400);
  }

  // Stok güncelle
  await product.update({ stok: yeniStok });

  // Stok logu oluştur
  const stockLog = await StockLog.create({
    product_id: product.id,
    degisim_miktari: islem_tipi === 'duzeltme' ? yeniStok - oncekiStok : parseInt(miktar) * (islem_tipi === 'cikis' ? -1 : 1),
    onceki_stok: oncekiStok,
    yeni_stok: yeniStok,
    islem_tipi,
    aciklama,
    user_id: req.user.id
  });

  // WebSocket ile canlı stok güncelleme
  if (req.io) {
    req.io.emit('stock:updated', {
      product_id: product.id,
      urun_adi: product.urun_adi,
      onceki_stok: oncekiStok,
      yeni_stok: yeniStok,
      kritik_mi: yeniStok <= product.kritik_stok_seviyesi
    });
  }

  res.json({
    success: true,
    message: 'Stok başarıyla güncellendi',
    data: {
      product,
      stockLog
    }
  });
});

// @desc    Kritik stok ürünlerini getir
// @route   GET /api/products/critical-stock
// @access  Private
const getCriticalStock = asyncHandler(async (req, res) => {
  const products = await Product.findAll({
    where: {
      [Op.and]: [
        { durum: { [Op.ne]: 'pasif' } },
        { stok: { [Op.lte]: col('kritik_stok_seviyesi') } }
      ]
    },
    order: [['stok', 'ASC']]
  });

  res.json({
    success: true,
    data: products
  });
});

// @desc    Kategorileri getir
// @route   GET /api/products/categories
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.findAll({
    attributes: ['kategori'],
    group: ['kategori'],
    order: [['kategori', 'ASC']]
  });

  res.json({
    success: true,
    data: categories.map(c => c.kategori)
  });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getCriticalStock,
  getCategories
};
