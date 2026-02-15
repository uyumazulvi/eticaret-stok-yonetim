const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const { User, Product, Order, OrderItem, StockLog } = require('../models');

const seedData = async () => {
  try {
    console.log('Veritabanı hazırlanıyor...');

    // Bağlantıyı kur ve tabloları oluştur
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    console.log('Seed verileri oluşturuluyor...');

    // Admin kullanıcı
    const admin = await User.create({
      ad: 'Admin Kullanıcı',
      email: 'admin@example.com',
      sifre: 'admin123',
      rol: 'admin'
    });

    // Personel kullanıcı
    const personel = await User.create({
      ad: 'Personel Kullanıcı',
      email: 'personel@example.com',
      sifre: 'personel123',
      rol: 'personel'
    });

    console.log('Kullanıcılar oluşturuldu');

    // Ürünler
    const urunler = [
      { urun_adi: 'iPhone 15 Pro', kategori: 'Elektronik', fiyat: 65999.99, stok: 25, kritik_stok_seviyesi: 5, barkod: 'IPH15PRO001' },
      { urun_adi: 'Samsung Galaxy S24', kategori: 'Elektronik', fiyat: 49999.99, stok: 30, kritik_stok_seviyesi: 5, barkod: 'SAMS24001' },
      { urun_adi: 'MacBook Pro 14"', kategori: 'Bilgisayar', fiyat: 89999.99, stok: 15, kritik_stok_seviyesi: 3, barkod: 'MBP14001' },
      { urun_adi: 'Dell XPS 15', kategori: 'Bilgisayar', fiyat: 54999.99, stok: 20, kritik_stok_seviyesi: 5, barkod: 'DELLXPS001' },
      { urun_adi: 'Sony WH-1000XM5', kategori: 'Aksesuar', fiyat: 8999.99, stok: 50, kritik_stok_seviyesi: 10, barkod: 'SONYWH001' },
      { urun_adi: 'Apple AirPods Pro', kategori: 'Aksesuar', fiyat: 7499.99, stok: 8, kritik_stok_seviyesi: 10, barkod: 'AIRPODSP001' },
      { urun_adi: 'Logitech MX Master 3', kategori: 'Aksesuar', fiyat: 2499.99, stok: 45, kritik_stok_seviyesi: 10, barkod: 'LOGMX3001' },
      { urun_adi: 'Samsung 4K Monitor', kategori: 'Monitör', fiyat: 12999.99, stok: 12, kritik_stok_seviyesi: 5, barkod: 'SAM4KM001' },
      { urun_adi: 'LG UltraWide 34"', kategori: 'Monitör', fiyat: 15999.99, stok: 3, kritik_stok_seviyesi: 5, barkod: 'LGUW34001' },
      { urun_adi: 'iPad Pro 12.9"', kategori: 'Tablet', fiyat: 42999.99, stok: 18, kritik_stok_seviyesi: 5, barkod: 'IPADPRO001' },
      { urun_adi: 'Samsung Galaxy Tab S9', kategori: 'Tablet', fiyat: 32999.99, stok: 22, kritik_stok_seviyesi: 5, barkod: 'SAMTABS9001' },
      { urun_adi: 'Apple Watch Series 9', kategori: 'Giyilebilir', fiyat: 14999.99, stok: 35, kritik_stok_seviyesi: 10, barkod: 'APPWAT9001' },
      { urun_adi: 'Mechanical Keyboard', kategori: 'Aksesuar', fiyat: 3499.99, stok: 60, kritik_stok_seviyesi: 15, barkod: 'MECHKEY001' },
      { urun_adi: 'USB-C Hub 7-in-1', kategori: 'Aksesuar', fiyat: 899.99, stok: 100, kritik_stok_seviyesi: 20, barkod: 'USBCHUB001' },
      { urun_adi: 'Wireless Charger Pad', kategori: 'Aksesuar', fiyat: 599.99, stok: 0, kritik_stok_seviyesi: 15, barkod: 'WIRCHG001', durum: 'tukendi' }
    ];

    const createdProducts = [];
    for (const urun of urunler) {
      const product = await Product.create(urun);
      createdProducts.push(product);
    }
    console.log('Ürünler oluşturuldu');

    // Siparişler
    const siparisler = [
      {
        siparis_no: 'SP260201001',
        musteri_adi: 'Ahmet Yılmaz',
        musteri_email: 'ahmet@example.com',
        musteri_telefon: '0532 123 4567',
        teslimat_adresi: 'İstanbul, Kadıköy',
        toplam_tutar: 65999.99,
        durum: 'tamamlandi',
        user_id: admin.id
      },
      {
        siparis_no: 'SP260201002',
        musteri_adi: 'Mehmet Demir',
        musteri_email: 'mehmet@example.com',
        musteri_telefon: '0533 234 5678',
        teslimat_adresi: 'Ankara, Çankaya',
        toplam_tutar: 89999.99,
        durum: 'kargoda',
        user_id: personel.id
      },
      {
        siparis_no: 'SP260201003',
        musteri_adi: 'Ayşe Kaya',
        musteri_email: 'ayse@example.com',
        musteri_telefon: '0534 345 6789',
        teslimat_adresi: 'İzmir, Karşıyaka',
        toplam_tutar: 16499.98,
        durum: 'hazirlaniyor',
        user_id: admin.id
      },
      {
        siparis_no: 'SP260201004',
        musteri_adi: 'Fatma Şahin',
        musteri_email: 'fatma@example.com',
        musteri_telefon: '0535 456 7890',
        teslimat_adresi: 'Bursa, Nilüfer',
        toplam_tutar: 8999.99,
        durum: 'beklemede',
        user_id: personel.id
      },
      {
        siparis_no: 'SP260201005',
        musteri_adi: 'Ali Öztürk',
        musteri_email: 'ali@example.com',
        musteri_telefon: '0536 567 8901',
        teslimat_adresi: 'Antalya, Muratpaşa',
        toplam_tutar: 49999.99,
        durum: 'tamamlandi',
        user_id: admin.id
      }
    ];

    const createdOrders = [];
    for (const siparis of siparisler) {
      const order = await Order.create(siparis);
      createdOrders.push(order);
    }
    console.log('Siparişler oluşturuldu');

    // Sipariş kalemleri
    await OrderItem.create({ order_id: createdOrders[0].id, product_id: createdProducts[0].id, adet: 1, birim_fiyat: 65999.99, toplam: 65999.99 });
    await OrderItem.create({ order_id: createdOrders[1].id, product_id: createdProducts[2].id, adet: 1, birim_fiyat: 89999.99, toplam: 89999.99 });
    await OrderItem.create({ order_id: createdOrders[2].id, product_id: createdProducts[4].id, adet: 1, birim_fiyat: 8999.99, toplam: 8999.99 });
    await OrderItem.create({ order_id: createdOrders[2].id, product_id: createdProducts[5].id, adet: 1, birim_fiyat: 7499.99, toplam: 7499.99 });
    await OrderItem.create({ order_id: createdOrders[3].id, product_id: createdProducts[4].id, adet: 1, birim_fiyat: 8999.99, toplam: 8999.99 });
    await OrderItem.create({ order_id: createdOrders[4].id, product_id: createdProducts[1].id, adet: 1, birim_fiyat: 49999.99, toplam: 49999.99 });

    console.log('Sipariş kalemleri oluşturuldu');

    // Stok logları
    for (const product of createdProducts) {
      if (product.stok > 0) {
        await StockLog.create({
          product_id: product.id,
          degisim_miktari: product.stok,
          onceki_stok: 0,
          yeni_stok: product.stok,
          islem_tipi: 'giris',
          aciklama: 'İlk stok girişi',
          user_id: admin.id
        });
      }
    }

    console.log('Stok logları oluşturuldu');

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Seed verileri başarıyla oluşturuldu!                   ║
║                                                           ║
║   Admin Giriş:                                           ║
║   Email: admin@example.com                               ║
║   Şifre: admin123                                        ║
║                                                           ║
║   Personel Giriş:                                        ║
║   Email: personel@example.com                            ║
║   Şifre: personel123                                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (error) {
    console.error('Seed hatası:', error);
    process.exit(1);
  }
};

seedData();
