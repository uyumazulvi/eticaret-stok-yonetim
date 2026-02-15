# E-Ticaret Analiz ve Stok Yönetim Paneli

Küçük ve orta ölçekli e-ticaret firmaları için geliştirilmiş, ürün, stok, sipariş ve satış analizlerini tek bir panel üzerinden yönetebilen modern web tabanlı yönetim sistemi.

## Proje Özellikleri

### Temel Özellikler
- **Kimlik Doğrulama**: JWT tabanlı güvenli giriş/kayıt sistemi
- **Rol Bazlı Yetkilendirme**: Admin ve Personel rolleri
- **Ürün Yönetimi**: CRUD işlemleri, stok takibi, kritik stok uyarıları
- **Sipariş Yönetimi**: Sipariş oluşturma, durum güncelleme, detay görüntüleme
- **Dashboard**: Satış grafikleri, en çok satan ürünler, kritik stok listesi
- **Raporlama**: PDF ve Excel formatında raporlar

### Bonus Özellikler
- **PDF Satış Raporu**: Tarih aralığına göre filtrelenebilir
- **Excel İçe/Dışa Aktarma**: Toplu ürün ekleme ve dışa aktarma
- **Dark Mode**: Koyu tema desteği
- **WebSocket**: Canlı stok güncelleme bildirimleri

## Teknoloji Yığını

### Frontend
- **React.js 18** - Modern UI kütüphanesi
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Hızlı build tool
- **React Router** - Client-side routing
- **Chart.js** - Grafik görselleştirme
- **Headless UI** - Erişilebilir UI bileşenleri
- **Heroicons** - SVG ikonlar
- **Socket.io Client** - Gerçek zamanlı iletişim
- **React Hot Toast** - Bildirimler

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - İlişkisel veritabanı
- **Sequelize** - ORM
- **JWT** - Kimlik doğrulama
- **Socket.io** - WebSocket desteği
- **PDFKit** - PDF oluşturma
- **XLSX** - Excel işlemleri

### DevOps
- **Docker** - Konteynerizasyon
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Web server / Reverse proxy

## Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (opsiyonel)

### Yerel Geliştirme

#### 1. Projeyi klonlayın
```bash
git clone <repo-url>
cd ogi_proje
```

#### 2. Backend kurulumu
```bash
cd backend
cp .env.example .env
# .env dosyasını düzenleyin
npm install
npm run dev
```

#### 3. Frontend kurulumu
```bash
cd frontend
npm install
npm run dev
```

#### 4. Veritabanı seed (demo veriler)
```bash
cd backend
node src/utils/seedData.js
```

### Docker ile Kurulum

```bash
docker-compose up -d
```

Uygulama http://localhost adresinde çalışacaktır.

## Demo Giriş Bilgileri

| Rol | Email | Şifre |
|-----|-------|-------|
| Admin | admin@example.com | admin123 |
| Personel | personel@example.com | personel123 |

## API Endpoints

### Auth
- `POST /api/auth/register` - Kayıt
- `POST /api/auth/login` - Giriş
- `GET /api/auth/me` - Kullanıcı bilgisi
- `PUT /api/auth/profile` - Profil güncelleme
- `PUT /api/auth/change-password` - Şifre değiştirme

### Products
- `GET /api/products` - Ürün listesi
- `GET /api/products/:id` - Ürün detay
- `POST /api/products` - Ürün oluştur (Admin)
- `PUT /api/products/:id` - Ürün güncelle (Admin)
- `DELETE /api/products/:id` - Ürün sil (Admin)
- `PUT /api/products/:id/stock` - Stok güncelle
- `GET /api/products/categories` - Kategoriler

### Orders
- `GET /api/orders` - Sipariş listesi
- `GET /api/orders/:id` - Sipariş detay
- `POST /api/orders` - Sipariş oluştur
- `PUT /api/orders/:id/status` - Durum güncelle
- `DELETE /api/orders/:id` - Sipariş sil (Admin)

### Dashboard
- `GET /api/dashboard/stats` - İstatistikler
- `GET /api/dashboard/sales-chart` - Satış grafiği
- `GET /api/dashboard/top-products` - En çok satanlar
- `GET /api/dashboard/critical-stock` - Kritik stok
- `GET /api/dashboard/order-status` - Durum dağılımı

### Reports
- `GET /api/reports/sales-pdf` - PDF raporu
- `GET /api/reports/products-excel` - Ürün Excel
- `GET /api/reports/stock-excel` - Stok Excel
- `GET /api/reports/orders-excel` - Sipariş Excel
- `POST /api/reports/products-import` - Excel ile içe aktarma

### Users (Admin)
- `GET /api/users` - Kullanıcı listesi
- `POST /api/users` - Kullanıcı oluştur
- `PUT /api/users/:id` - Kullanıcı güncelle
- `DELETE /api/users/:id` - Kullanıcı sil
- `PUT /api/users/:id/reset-password` - Şifre sıfırla

## Veritabanı Şeması

### Users
| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Primary Key |
| ad | VARCHAR(100) | Kullanıcı adı |
| email | VARCHAR(255) | Email (unique) |
| sifre | VARCHAR(255) | Hash'lenmiş şifre |
| rol | ENUM | admin, personel |
| aktif | BOOLEAN | Hesap durumu |

### Products
| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Primary Key |
| urun_adi | VARCHAR(255) | Ürün adı |
| kategori | VARCHAR(100) | Kategori |
| aciklama | TEXT | Açıklama |
| fiyat | DECIMAL(10,2) | Fiyat |
| stok | INTEGER | Stok miktarı |
| kritik_stok_seviyesi | INTEGER | Kritik seviye |
| durum | ENUM | aktif, pasif, tukendi |
| barkod | VARCHAR(50) | Barkod (unique) |

### Orders
| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Primary Key |
| siparis_no | VARCHAR(20) | Sipariş numarası |
| musteri_adi | VARCHAR(255) | Müşteri adı |
| musteri_email | VARCHAR(255) | Email |
| toplam_tutar | DECIMAL(12,2) | Toplam tutar |
| durum | ENUM | beklemede, hazirlaniyor, kargoda, tamamlandi, iptal |

### OrderItems
| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Primary Key |
| order_id | INTEGER | FK -> Orders |
| product_id | INTEGER | FK -> Products |
| adet | INTEGER | Adet |
| birim_fiyat | DECIMAL(10,2) | Birim fiyat |
| toplam | DECIMAL(12,2) | Toplam |

### StockLogs
| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Primary Key |
| product_id | INTEGER | FK -> Products |
| degisim_miktari | INTEGER | Değişim (+/-) |
| onceki_stok | INTEGER | Önceki stok |
| yeni_stok | INTEGER | Yeni stok |
| islem_tipi | ENUM | giris, cikis, duzeltme, siparis, iade |

## Proje Yapısı

```
ogi_proje/
├── backend/
│   ├── src/
│   │   ├── config/          # Veritabanı yapılandırması
│   │   ├── controllers/     # İş mantığı
│   │   ├── middleware/      # Auth, error handling
│   │   ├── models/          # Sequelize modelleri
│   │   ├── routes/          # API route'ları
│   │   ├── utils/           # Yardımcı fonksiyonlar
│   │   └── app.js          # Ana uygulama
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # React bileşenleri
│   │   ├── context/         # React Context
│   │   ├── pages/           # Sayfa bileşenleri
│   │   ├── services/        # API servisleri
│   │   ├── hooks/           # Custom hooks
│   │   └── App.jsx         # Ana uygulama
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Ekran Görüntüleri

### Dashboard
- Günlük/aylık satış istatistikleri
- Satış trend grafikleri
- En çok satan ürünler
- Kritik stok uyarıları
- Son siparişler

### Ürün Yönetimi
- Ürün listeleme ve filtreleme
- Ürün ekleme/düzenleme
- Stok güncelleme
- Stok hareketleri geçmişi

### Sipariş Yönetimi
- Sipariş listeleme
- Sipariş oluşturma
- Durum güncelleme
- Sipariş detayları

### Raporlar
- PDF satış raporu
- Excel dışa aktarma
- Toplu ürün içe aktarma

## Lisans

MIT License

## Geliştirici

Bu proje Fullstack Developer staj başvurusu için geliştirilmiştir.

---

**Not**: Proje geliştirme ve test aşamasındadır. Production ortamında kullanmadan önce güvenlik ayarlarını gözden geçirin.
