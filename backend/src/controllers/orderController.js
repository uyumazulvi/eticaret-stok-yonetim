const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { Order, OrderItem, Product, StockLog, User } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Tüm siparişleri getir
// @route   GET /api/orders
// @access  Private
const getOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    durum,
    baslangic_tarihi,
    bitis_tarihi,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  // Arama filtresi
  if (search) {
    where[Op.or] = [
      { siparis_no: { [Op.iLike]: `%${search}%` } },
      { musteri_adi: { [Op.iLike]: `%${search}%` } },
      { musteri_email: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Durum filtresi
  if (durum) {
    where.durum = durum;
  }

  // Tarih filtresi
  if (baslangic_tarihi || bitis_tarihi) {
    where.createdAt = {};
    if (baslangic_tarihi) {
      where.createdAt[Op.gte] = new Date(baslangic_tarihi);
    }
    if (bitis_tarihi) {
      where.createdAt[Op.lte] = new Date(bitis_tarihi);
    }
  }

  const { count, rows: orders } = await Order.findAndCountAll({
    where,
    include: [
      {
        model: OrderItem,
        as: 'kalemler',
        include: [{ model: Product, as: 'urun', attributes: ['id', 'urun_adi'] }]
      },
      {
        model: User,
        as: 'kullanici',
        attributes: ['id', 'ad', 'email']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder]],
    distinct: true
  });

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    }
  });
});

// @desc    Tek sipariş getir
// @route   GET /api/orders/:id
// @access  Private
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [
      {
        model: OrderItem,
        as: 'kalemler',
        include: [{ model: Product, as: 'urun' }]
      },
      {
        model: User,
        as: 'kullanici',
        attributes: ['id', 'ad', 'email']
      },
      {
        model: StockLog,
        as: 'stok_hareketleri'
      }
    ]
  });

  if (!order) {
    throw new AppError('Sipariş bulunamadı', 404);
  }

  res.json({
    success: true,
    data: order
  });
});

// @desc    Sipariş oluştur
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const {
    musteri_adi,
    musteri_email,
    musteri_telefon,
    teslimat_adresi,
    notlar,
    kalemler
  } = req.body;

  if (!kalemler || kalemler.length === 0) {
    throw new AppError('Sipariş en az bir ürün içermelidir', 400);
  }

  // Transaction başlat
  const transaction = await sequelize.transaction();

  try {
    // Stok kontrolü ve toplam tutar hesaplama
    let toplam_tutar = 0;
    const urunler = [];

    for (const kalem of kalemler) {
      const product = await Product.findByPk(kalem.product_id, { transaction });

      if (!product) {
        throw new AppError(`Ürün bulunamadı: ${kalem.product_id}`, 404);
      }

      if (product.stok < kalem.adet) {
        throw new AppError(`Yetersiz stok: ${product.urun_adi} (Mevcut: ${product.stok}, İstenen: ${kalem.adet})`, 400);
      }

      const birim_fiyat = parseFloat(product.fiyat);
      toplam_tutar += birim_fiyat * kalem.adet;

      urunler.push({
        product,
        adet: kalem.adet,
        birim_fiyat
      });
    }

    // Siparişi oluştur
    const order = await Order.create({
      musteri_adi,
      musteri_email,
      musteri_telefon,
      teslimat_adresi,
      toplam_tutar,
      notlar,
      user_id: req.user.id
    }, { transaction });

    // Sipariş kalemlerini oluştur ve stokları güncelle
    for (const urun of urunler) {
      // Sipariş kalemi oluştur
      await OrderItem.create({
        order_id: order.id,
        product_id: urun.product.id,
        adet: urun.adet,
        birim_fiyat: urun.birim_fiyat,
        toplam: urun.birim_fiyat * urun.adet
      }, { transaction });

      // Stok güncelle
      const oncekiStok = urun.product.stok;
      const yeniStok = oncekiStok - urun.adet;

      await urun.product.update({ stok: yeniStok }, { transaction });

      // Stok logu oluştur
      await StockLog.create({
        product_id: urun.product.id,
        degisim_miktari: -urun.adet,
        onceki_stok: oncekiStok,
        yeni_stok: yeniStok,
        islem_tipi: 'siparis',
        aciklama: `Sipariş: ${order.siparis_no}`,
        user_id: req.user.id,
        order_id: order.id
      }, { transaction });
    }

    await transaction.commit();

    // Siparişi kalemlerle birlikte getir
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'kalemler',
          include: [{ model: Product, as: 'urun' }]
        }
      ]
    });

    // WebSocket ile bildirim
    if (req.io) {
      req.io.emit('order:created', createdOrder);

      // Kritik stok uyarıları
      for (const urun of urunler) {
        const updatedProduct = await Product.findByPk(urun.product.id);
        if (updatedProduct.stok <= updatedProduct.kritik_stok_seviyesi) {
          req.io.emit('stock:critical', {
            product_id: updatedProduct.id,
            urun_adi: updatedProduct.urun_adi,
            stok: updatedProduct.stok,
            kritik_seviye: updatedProduct.kritik_stok_seviyesi
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Sipariş başarıyla oluşturuldu',
      data: createdOrder
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

// @desc    Sipariş durumu güncelle
// @route   PUT /api/orders/:id/status
// @access  Private
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { durum } = req.body;
  const gecerliDurumlar = ['beklemede', 'hazirlaniyor', 'kargoda', 'tamamlandi', 'iptal'];

  if (!gecerliDurumlar.includes(durum)) {
    throw new AppError('Geçersiz sipariş durumu', 400);
  }

  const order = await Order.findByPk(req.params.id, {
    include: [
      {
        model: OrderItem,
        as: 'kalemler',
        include: [{ model: Product, as: 'urun' }]
      }
    ]
  });

  if (!order) {
    throw new AppError('Sipariş bulunamadı', 404);
  }

  const oncekiDurum = order.durum;

  // İptal durumunda stokları geri ekle
  if (durum === 'iptal' && oncekiDurum !== 'iptal') {
    const transaction = await sequelize.transaction();

    try {
      for (const kalem of order.kalemler) {
        const product = await Product.findByPk(kalem.product_id, { transaction });
        const oncekiStok = product.stok;
        const yeniStok = oncekiStok + kalem.adet;

        await product.update({ stok: yeniStok }, { transaction });

        await StockLog.create({
          product_id: product.id,
          degisim_miktari: kalem.adet,
          onceki_stok: oncekiStok,
          yeni_stok: yeniStok,
          islem_tipi: 'iade',
          aciklama: `Sipariş iptali: ${order.siparis_no}`,
          user_id: req.user.id,
          order_id: order.id
        }, { transaction });
      }

      await order.update({ durum }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } else {
    await order.update({ durum });
  }

  // WebSocket ile bildirim
  if (req.io) {
    req.io.emit('order:statusUpdated', {
      id: order.id,
      siparis_no: order.siparis_no,
      onceki_durum: oncekiDurum,
      yeni_durum: durum
    });
  }

  res.json({
    success: true,
    message: 'Sipariş durumu güncellendi',
    data: order
  });
});

// @desc    Sipariş sil
// @route   DELETE /api/orders/:id
// @access  Private (Admin)
const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id);

  if (!order) {
    throw new AppError('Sipariş bulunamadı', 404);
  }

  // Sadece beklemede olan siparişler silinebilir
  if (order.durum !== 'beklemede') {
    throw new AppError('Sadece beklemede olan siparişler silinebilir', 400);
  }

  await order.destroy();

  res.json({
    success: true,
    message: 'Sipariş başarıyla silindi'
  });
});

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder
};
