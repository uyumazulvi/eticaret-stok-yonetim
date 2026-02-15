const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const { Op, fn, col, literal } = require('sequelize');
const { Order, OrderItem, Product, StockLog } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    PDF Satış Raporu
// @route   GET /api/reports/sales-pdf
// @access  Private
const generateSalesPDF = asyncHandler(async (req, res) => {
  const { baslangic_tarihi, bitis_tarihi } = req.query;

  const where = { durum: { [Op.ne]: 'iptal' } };

  if (baslangic_tarihi || bitis_tarihi) {
    where.createdAt = {};
    if (baslangic_tarihi) {
      where.createdAt[Op.gte] = new Date(baslangic_tarihi);
    }
    if (bitis_tarihi) {
      where.createdAt[Op.lte] = new Date(bitis_tarihi);
    }
  }

  const orders = await Order.findAll({
    where,
    include: [{
      model: OrderItem,
      as: 'kalemler',
      include: [{ model: Product, as: 'urun', attributes: ['urun_adi'] }]
    }],
    order: [['createdAt', 'DESC']]
  });

  const toplamTutar = orders.reduce((sum, order) => sum + parseFloat(order.toplam_tutar), 0);

  // PDF oluştur
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=satis-raporu-${Date.now()}.pdf`);

  doc.pipe(res);

  // Başlık
  doc.fontSize(20).text('E-Ticaret Satış Raporu', { align: 'center' });
  doc.moveDown();

  // Tarih aralığı
  const tarihAraligi = baslangic_tarihi && bitis_tarihi
    ? `${baslangic_tarihi} - ${bitis_tarihi}`
    : 'Tüm Zamanlar';
  doc.fontSize(12).text(`Tarih Aralığı: ${tarihAraligi}`, { align: 'center' });
  doc.moveDown();

  // Özet bilgiler
  doc.fontSize(14).text('Özet', { underline: true });
  doc.fontSize(12)
    .text(`Toplam Sipariş: ${orders.length}`)
    .text(`Toplam Satış: ${toplamTutar.toFixed(2)} TL`);
  doc.moveDown();

  // Sipariş tablosu
  doc.fontSize(14).text('Siparişler', { underline: true });
  doc.moveDown(0.5);

  // Tablo başlıkları
  const tableTop = doc.y;
  doc.fontSize(10)
    .text('Sipariş No', 50, tableTop)
    .text('Müşteri', 150, tableTop)
    .text('Tarih', 280, tableTop)
    .text('Durum', 370, tableTop)
    .text('Tutar', 450, tableTop);

  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  let yPos = tableTop + 25;

  orders.slice(0, 30).forEach((order) => {
    if (yPos > 700) {
      doc.addPage();
      yPos = 50;
    }

    const tarih = new Date(order.createdAt).toLocaleDateString('tr-TR');
    doc.fontSize(9)
      .text(order.siparis_no, 50, yPos)
      .text(order.musteri_adi.substring(0, 20), 150, yPos)
      .text(tarih, 280, yPos)
      .text(order.durum, 370, yPos)
      .text(`${parseFloat(order.toplam_tutar).toFixed(2)} TL`, 450, yPos);

    yPos += 20;
  });

  // Rapor tarihi
  doc.fontSize(10).text(`Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}`, 50, 750);

  doc.end();
});

// @desc    Excel ile ürün dışa aktarma
// @route   GET /api/reports/products-excel
// @access  Private
const exportProductsExcel = asyncHandler(async (req, res) => {
  const products = await Product.findAll({
    order: [['kategori', 'ASC'], ['urun_adi', 'ASC']]
  });

  const data = products.map(p => ({
    'ID': p.id,
    'Ürün Adı': p.urun_adi,
    'Kategori': p.kategori,
    'Açıklama': p.aciklama || '',
    'Fiyat (TL)': parseFloat(p.fiyat),
    'Stok': p.stok,
    'Kritik Stok Seviyesi': p.kritik_stok_seviyesi,
    'Durum': p.durum,
    'Barkod': p.barkod || '',
    'Oluşturma Tarihi': new Date(p.createdAt).toLocaleDateString('tr-TR')
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ürünler');

  // Sütun genişlikleri
  worksheet['!cols'] = [
    { wch: 5 },  // ID
    { wch: 30 }, // Ürün Adı
    { wch: 15 }, // Kategori
    { wch: 40 }, // Açıklama
    { wch: 12 }, // Fiyat
    { wch: 8 },  // Stok
    { wch: 18 }, // Kritik Stok
    { wch: 10 }, // Durum
    { wch: 15 }, // Barkod
    { wch: 15 }  // Tarih
  ];

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=urunler-${Date.now()}.xlsx`);
  res.send(buffer);
});

// @desc    Excel ile ürün içe aktarma
// @route   POST /api/reports/products-import
// @access  Private (Admin)
const importProductsExcel = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Lütfen bir Excel dosyası yükleyin', 400);
  }

  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const eklenenler = [];
  const hatalar = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
      const product = await Product.create({
        urun_adi: row['Ürün Adı'] || row['urun_adi'],
        kategori: row['Kategori'] || row['kategori'],
        aciklama: row['Açıklama'] || row['aciklama'] || null,
        fiyat: parseFloat(row['Fiyat (TL)'] || row['fiyat'] || 0),
        stok: parseInt(row['Stok'] || row['stok'] || 0),
        kritik_stok_seviyesi: parseInt(row['Kritik Stok Seviyesi'] || row['kritik_stok_seviyesi'] || 10),
        barkod: row['Barkod'] || row['barkod'] || null,
        durum: row['Durum'] || row['durum'] || 'aktif'
      });
      eklenenler.push(product);
    } catch (error) {
      hatalar.push({
        satir: i + 2,
        hata: error.message
      });
    }
  }

  res.json({
    success: true,
    message: `${eklenenler.length} ürün başarıyla eklendi`,
    data: {
      eklenen_sayisi: eklenenler.length,
      hata_sayisi: hatalar.length,
      hatalar
    }
  });
});

// @desc    Stok raporu Excel
// @route   GET /api/reports/stock-excel
// @access  Private
const exportStockReportExcel = asyncHandler(async (req, res) => {
  const products = await Product.findAll({
    include: [{
      model: StockLog,
      as: 'stok_hareketleri',
      limit: 1,
      order: [['createdAt', 'DESC']]
    }],
    order: [['stok', 'ASC']]
  });

  const data = products.map(p => ({
    'ID': p.id,
    'Ürün Adı': p.urun_adi,
    'Kategori': p.kategori,
    'Mevcut Stok': p.stok,
    'Kritik Seviye': p.kritik_stok_seviyesi,
    'Durum': p.stok <= p.kritik_stok_seviyesi ? 'KRİTİK' : 'Normal',
    'Son Hareket': p.stok_hareketleri[0]
      ? new Date(p.stok_hareketleri[0].createdAt).toLocaleDateString('tr-TR')
      : 'Yok'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stok Raporu');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=stok-raporu-${Date.now()}.xlsx`);
  res.send(buffer);
});

// @desc    Sipariş raporu Excel
// @route   GET /api/reports/orders-excel
// @access  Private
const exportOrdersExcel = asyncHandler(async (req, res) => {
  const { baslangic_tarihi, bitis_tarihi, durum } = req.query;

  const where = {};

  if (durum) {
    where.durum = durum;
  }

  if (baslangic_tarihi || bitis_tarihi) {
    where.createdAt = {};
    if (baslangic_tarihi) {
      where.createdAt[Op.gte] = new Date(baslangic_tarihi);
    }
    if (bitis_tarihi) {
      where.createdAt[Op.lte] = new Date(bitis_tarihi);
    }
  }

  const orders = await Order.findAll({
    where,
    include: [{
      model: OrderItem,
      as: 'kalemler'
    }],
    order: [['createdAt', 'DESC']]
  });

  const data = orders.map(o => ({
    'Sipariş No': o.siparis_no,
    'Müşteri Adı': o.musteri_adi,
    'Email': o.musteri_email || '',
    'Telefon': o.musteri_telefon || '',
    'Adres': o.teslimat_adresi || '',
    'Ürün Sayısı': o.kalemler.reduce((sum, k) => sum + k.adet, 0),
    'Toplam Tutar (TL)': parseFloat(o.toplam_tutar),
    'Durum': o.durum,
    'Tarih': new Date(o.createdAt).toLocaleDateString('tr-TR')
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Siparişler');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=siparisler-${Date.now()}.xlsx`);
  res.send(buffer);
});

module.exports = {
  generateSalesPDF,
  exportProductsExcel,
  importProductsExcel,
  exportStockReportExcel,
  exportOrdersExcel
};
