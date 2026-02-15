import { useState, useRef } from 'react';
import { reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  DocumentArrowDownIcon,
  DocumentChartBarIcon,
  TableCellsIcon,
  ArrowUpTrayIcon,
  CubeIcon,
  ShoppingCartIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

const Reports = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState({});
  const [dateRange, setDateRange] = useState({
    baslangic: '',
    bitis: ''
  });
  const fileInputRef = useRef(null);

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleSalesPDF = async () => {
    try {
      setLoading({ ...loading, salesPdf: true });
      const params = {};
      if (dateRange.baslangic) params.baslangic_tarihi = dateRange.baslangic;
      if (dateRange.bitis) params.bitis_tarihi = dateRange.bitis;

      const response = await reportsAPI.getSalesPDF(params);
      downloadFile(response.data, `satis-raporu-${Date.now()}.pdf`);
      toast.success('PDF raporu indirildi');
    } catch (error) {
      toast.error('Rapor oluşturulamadı');
    } finally {
      setLoading({ ...loading, salesPdf: false });
    }
  };

  const handleProductsExcel = async () => {
    try {
      setLoading({ ...loading, productsExcel: true });
      const response = await reportsAPI.getProductsExcel();
      downloadFile(response.data, `urunler-${Date.now()}.xlsx`);
      toast.success('Excel dosyası indirildi');
    } catch (error) {
      toast.error('Rapor oluşturulamadı');
    } finally {
      setLoading({ ...loading, productsExcel: false });
    }
  };

  const handleStockExcel = async () => {
    try {
      setLoading({ ...loading, stockExcel: true });
      const response = await reportsAPI.getStockExcel();
      downloadFile(response.data, `stok-raporu-${Date.now()}.xlsx`);
      toast.success('Excel dosyası indirildi');
    } catch (error) {
      toast.error('Rapor oluşturulamadı');
    } finally {
      setLoading({ ...loading, stockExcel: false });
    }
  };

  const handleOrdersExcel = async () => {
    try {
      setLoading({ ...loading, ordersExcel: true });
      const params = {};
      if (dateRange.baslangic) params.baslangic_tarihi = dateRange.baslangic;
      if (dateRange.bitis) params.bitis_tarihi = dateRange.bitis;

      const response = await reportsAPI.getOrdersExcel(params);
      downloadFile(response.data, `siparisler-${Date.now()}.xlsx`);
      toast.success('Excel dosyası indirildi');
    } catch (error) {
      toast.error('Rapor oluşturulamadı');
    } finally {
      setLoading({ ...loading, ordersExcel: false });
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading({ ...loading, import: true });
      const response = await reportsAPI.importProducts(file);
      toast.success(response.data.message);

      if (response.data.data.hatalar.length > 0) {
        toast.error(`${response.data.data.hata_sayisi} satırda hata oluştu`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'İçe aktarma başarısız');
    } finally {
      setLoading({ ...loading, import: false });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const ReportCard = ({ title, description, icon: Icon, onClick, loading, color }) => (
    <button
      onClick={onClick}
      disabled={loading}
      className="card p-6 text-left hover:shadow-lg transition-all duration-200 disabled:opacity-50 group"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <Icon className="h-6 w-6" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {description}
      </p>
    </button>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Raporlar</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          PDF ve Excel formatında raporlar oluşturun
        </p>
      </div>

      {/* Tarih Filtresi */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tarih Aralığı (İsteğe Bağlı)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={dateRange.baslangic}
              onChange={(e) => setDateRange({ ...dateRange, baslangic: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={dateRange.bitis}
              onChange={(e) => setDateRange({ ...dateRange, bitis: e.target.value })}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Rapor Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportCard
          title="Satış Raporu (PDF)"
          description="Satış verilerini PDF formatında indirin"
          icon={DocumentChartBarIcon}
          onClick={handleSalesPDF}
          loading={loading.salesPdf}
          color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />

        <ReportCard
          title="Ürün Listesi (Excel)"
          description="Tüm ürünleri Excel formatında indirin"
          icon={CubeIcon}
          onClick={handleProductsExcel}
          loading={loading.productsExcel}
          color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        />

        <ReportCard
          title="Stok Raporu (Excel)"
          description="Stok durumunu Excel formatında indirin"
          icon={ArchiveBoxIcon}
          onClick={handleStockExcel}
          loading={loading.stockExcel}
          color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
        />

        <ReportCard
          title="Sipariş Raporu (Excel)"
          description="Siparişleri Excel formatında indirin"
          icon={ShoppingCartIcon}
          onClick={handleOrdersExcel}
          loading={loading.ordersExcel}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
      </div>

      {/* İçe Aktarma */}
      {isAdmin && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ürün İçe Aktarma
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Excel dosyasından toplu ürün ekleyin. Dosya şu sütunları içermelidir:
            Ürün Adı, Kategori, Fiyat, Stok, Kritik Stok Seviyesi, Barkod
          </p>
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading.import}
              className="btn-primary"
            >
              {loading.import ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
              )}
              Excel Dosyası Yükle
            </button>
          </div>
        </div>
      )}

      {/* Bilgi */}
      <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <DocumentArrowDownIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-200">
              Rapor Bilgisi
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Tarih aralığı seçtiğinizde, sadece o tarihler arasındaki veriler rapora dahil edilir.
              Tarih seçilmezse tüm veriler raporda yer alır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
