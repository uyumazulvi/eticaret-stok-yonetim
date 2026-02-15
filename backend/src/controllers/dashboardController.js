const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/database');
const { Order, OrderItem, Product, User, StockLog } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Dashboard özet istatistikleri
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = asyncHandler(async (req, res) => {
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);

  const ayBaslangici = new Date(bugun.getFullYear(), bugun.getMonth(), 1);

  // Toplam satışlar
  const toplamSatis = await Order.sum('toplam_tutar', {
    where: { durum: { [Op.ne]: 'iptal' } }
  }) || 0;

  // Bugünkü satışlar
  const bugunkuSatis = await Order.sum('toplam_tutar', {
    where: {
      durum: { [Op.ne]: 'iptal' },
      createdAt: { [Op.gte]: bugun }
    }
  }) || 0;

  // Aylık satışlar
  const aylikSatis = await Order.sum('toplam_tutar', {
    where: {
      durum: { [Op.ne]: 'iptal' },
      createdAt: { [Op.gte]: ayBaslangici }
    }
  }) || 0;

  // Toplam sipariş sayısı
  const toplamSiparis = await Order.count();

  // Bugünkü sipariş sayısı
  const bugunkuSiparis = await Order.count({
    where: { createdAt: { [Op.gte]: bugun } }
  });

  // Bekleyen siparişler
  const bekleyenSiparis = await Order.count({
    where: { durum: 'beklemede' }
  });

  // Toplam ürün sayısı
  const toplamUrun = await Product.count();

  // Kritik stok ürün sayısı
  const kritikStokUrun = await Product.count({
    where: {
      durum: { [Op.ne]: 'pasif' },
      stok: { [Op.lte]: col('kritik_stok_seviyesi') }
    }
  });

  // Stokta olmayan ürün sayısı
  const stoksuUrun = await Product.count({
    where: { stok: 0 }
  });

  // Toplam kullanıcı sayısı
  const toplamKullanici = await User.count();

  res.json({
    success: true,
    data: {
      satis: {
        toplam: parseFloat(toplamSatis).toFixed(2),
        bugun: parseFloat(bugunkuSatis).toFixed(2),
        aylik: parseFloat(aylikSatis).toFixed(2)
      },
      siparis: {
        toplam: toplamSiparis,
        bugun: bugunkuSiparis,
        bekleyen: bekleyenSiparis
      },
      urun: {
        toplam: toplamUrun,
        kritik_stok: kritikStokUrun,
        stoksuz: stoksuUrun
      },
      kullanici: {
        toplam: toplamKullanici
      }
    }
  });
});

// @desc    Satış grafik verileri
// @route   GET /api/dashboard/sales-chart
// @access  Private
const getSalesChart = asyncHandler(async (req, res) => {
  const { period = 'weekly' } = req.query;

  let dateFormat, groupBy, days;

  if (period === 'daily') {
    days = 7;
    dateFormat = 'YYYY-MM-DD';
    groupBy = "DATE(created_at)";
  } else if (period === 'weekly') {
    days = 28;
    dateFormat = 'YYYY-WW';
    groupBy = "TO_CHAR(created_at, 'IYYY-IW')";
  } else if (period === 'monthly') {
    days = 365;
    dateFormat = 'YYYY-MM';
    groupBy = "TO_CHAR(created_at, 'YYYY-MM')";
  }

  const baslangicTarihi = new Date();
  baslangicTarihi.setDate(baslangicTarihi.getDate() - days);

  const salesData = await Order.findAll({
    attributes: [
      [literal(groupBy), 'tarih'],
      [fn('SUM', col('toplam_tutar')), 'toplam'],
      [fn('COUNT', col('id')), 'siparis_sayisi']
    ],
    where: {
      durum: { [Op.ne]: 'iptal' },
      createdAt: { [Op.gte]: baslangicTarihi }
    },
    group: [literal(groupBy)],
    order: [[literal(groupBy), 'ASC']],
    raw: true
  });

  res.json({
    success: true,
    data: salesData
  });
});

// @desc    En çok satan ürünler
// @route   GET /api/dashboard/top-products
// @access  Private
const getTopProducts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const topProducts = await OrderItem.findAll({
    attributes: [
      'product_id',
      [fn('SUM', col('adet')), 'toplam_satis'],
      [fn('SUM', col('OrderItem.toplam')), 'toplam_gelir']
    ],
    include: [{
      model: Product,
      as: 'urun',
      attributes: ['id', 'urun_adi', 'kategori', 'fiyat', 'stok']
    }],
    group: ['product_id', 'urun.id'],
    order: [[literal('toplam_satis'), 'DESC']],
    limit: parseInt(limit),
    raw: false
  });

  res.json({
    success: true,
    data: topProducts
  });
});

// @desc    Kritik stok ürünleri
// @route   GET /api/dashboard/critical-stock
// @access  Private
const getCriticalStock = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const criticalProducts = await Product.findAll({
    where: {
      durum: { [Op.ne]: 'pasif' },
      stok: { [Op.lte]: col('kritik_stok_seviyesi') }
    },
    order: [['stok', 'ASC']],
    limit: parseInt(limit)
  });

  res.json({
    success: true,
    data: criticalProducts
  });
});

// @desc    Sipariş durum dağılımı
// @route   GET /api/dashboard/order-status
// @access  Private
const getOrderStatusDistribution = asyncHandler(async (req, res) => {
  const statusCounts = await Order.findAll({
    attributes: [
      'durum',
      [fn('COUNT', col('id')), 'sayi']
    ],
    group: ['durum'],
    raw: true
  });

  res.json({
    success: true,
    data: statusCounts
  });
});

// @desc    Kategori bazlı satış dağılımı
// @route   GET /api/dashboard/category-sales
// @access  Private
const getCategorySales = asyncHandler(async (req, res) => {
  const categorySales = await OrderItem.findAll({
    attributes: [
      [col('urun.kategori'), 'kategori'],
      [fn('SUM', col('OrderItem.toplam')), 'toplam_satis'],
      [fn('SUM', col('adet')), 'toplam_adet']
    ],
    include: [{
      model: Product,
      as: 'urun',
      attributes: []
    }],
    group: ['urun.kategori'],
    order: [[literal('toplam_satis'), 'DESC']],
    raw: true
  });

  res.json({
    success: true,
    data: categorySales
  });
});

// @desc    Son stok hareketleri
// @route   GET /api/dashboard/recent-stock-logs
// @access  Private
const getRecentStockLogs = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const stockLogs = await StockLog.findAll({
    include: [
      {
        model: Product,
        as: 'urun',
        attributes: ['id', 'urun_adi']
      },
      {
        model: User,
        as: 'kullanici',
        attributes: ['id', 'ad']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit)
  });

  res.json({
    success: true,
    data: stockLogs
  });
});

// @desc    Son siparişler
// @route   GET /api/dashboard/recent-orders
// @access  Private
const getRecentOrders = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const orders = await Order.findAll({
    include: [{
      model: OrderItem,
      as: 'kalemler',
      attributes: ['adet']
    }],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit)
  });

  res.json({
    success: true,
    data: orders
  });
});

module.exports = {
  getStats,
  getSalesChart,
  getTopProducts,
  getCriticalStock,
  getOrderStatusDistribution,
  getCategorySales,
  getRecentStockLogs,
  getRecentOrders
};
