import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PlusIcon,
  MinusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const ProductDetail = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockForm, setStockForm] = useState({
    miktar: '',
    islem_tipi: 'giris',
    aciklama: ''
  });

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getOne(id);
      setProduct(response.data.data);
    } catch (error) {
      toast.error('Ürün bulunamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    try {
      await productsAPI.updateStock(id, stockForm);
      toast.success('Stok güncellendi');
      setShowStockModal(false);
      setStockForm({ miktar: '', islem_tipi: 'giris', aciklama: '' });
      fetchProduct();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Stok güncellenemedi');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ürün bulunamadı</p>
        <Link to="/products" className="btn-primary mt-4 inline-block">
          Ürünlere Dön
        </Link>
      </div>
    );
  }

  const isKritik = product.stok <= product.kritik_stok_seviyesi;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/products"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {product.urun_adi}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {product.kategori}
          </p>
        </div>
        <StatusBadge status={product.durum} type="product" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ürün Bilgileri */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ürün Bilgileri
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Fiyat</dt>
              <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                {parseFloat(product.fiyat).toLocaleString('tr-TR')} TL
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Barkod</dt>
              <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                {product.barkod || '-'}
              </dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Açıklama</dt>
              <dd className="text-gray-900 dark:text-white mt-1">
                {product.aciklama || 'Açıklama yok'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Oluşturulma</dt>
              <dd className="text-gray-900 dark:text-white">
                {new Date(product.createdAt).toLocaleString('tr-TR')}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Son Güncelleme</dt>
              <dd className="text-gray-900 dark:text-white">
                {new Date(product.updatedAt).toLocaleString('tr-TR')}
              </dd>
            </div>
          </dl>
        </div>

        {/* Stok Bilgileri */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Stok Durumu
          </h2>
          <div className={`p-6 rounded-xl text-center ${
            isKritik ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'
          }`}>
            <p className="text-sm text-gray-500 dark:text-gray-400">Mevcut Stok</p>
            <p className={`text-4xl font-bold mt-2 ${
              isKritik ? 'text-red-600' : 'text-green-600'
            }`}>
              {product.stok}
            </p>
            {isKritik && (
              <p className="text-sm text-red-600 mt-2">
                Kritik seviye: {product.kritik_stok_seviyesi}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowStockModal(true)}
            className="w-full btn-primary mt-4"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Stok Güncelle
          </button>
        </div>
      </div>

      {/* Stok Hareketleri */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Son Stok Hareketleri
        </h2>
        {product.stok_hareketleri?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                  <th className="pb-3">Tarih</th>
                  <th className="pb-3">İşlem</th>
                  <th className="pb-3">Miktar</th>
                  <th className="pb-3">Önceki</th>
                  <th className="pb-3">Sonraki</th>
                  <th className="pb-3">Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {product.stok_hareketleri.map((log) => (
                  <tr key={log.id}>
                    <td className="py-3 text-sm">
                      {new Date(log.createdAt).toLocaleString('tr-TR')}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={log.islem_tipi} type="stock" />
                    </td>
                    <td className={`py-3 font-semibold ${
                      log.degisim_miktari > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {log.degisim_miktari > 0 ? '+' : ''}{log.degisim_miktari}
                    </td>
                    <td className="py-3">{log.onceki_stok}</td>
                    <td className="py-3">{log.yeni_stok}</td>
                    <td className="py-3 text-sm text-gray-500">
                      {log.aciklama || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Stok hareketi yok</p>
        )}
      </div>

      {/* Stok Güncelleme Modal */}
      <Modal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        title="Stok Güncelle"
      >
        <form onSubmit={handleStockUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              İşlem Tipi *
            </label>
            <select
              value={stockForm.islem_tipi}
              onChange={(e) => setStockForm({ ...stockForm, islem_tipi: e.target.value })}
              className="input"
            >
              <option value="giris">Stok Girişi</option>
              <option value="cikis">Stok Çıkışı</option>
              <option value="duzeltme">Stok Düzeltme</option>
              <option value="iade">İade</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {stockForm.islem_tipi === 'duzeltme' ? 'Yeni Stok Miktarı *' : 'Miktar *'}
            </label>
            <input
              type="number"
              min="0"
              value={stockForm.miktar}
              onChange={(e) => setStockForm({ ...stockForm, miktar: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Açıklama
            </label>
            <textarea
              value={stockForm.aciklama}
              onChange={(e) => setStockForm({ ...stockForm, aciklama: e.target.value })}
              className="input"
              rows="2"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button type="button" onClick={() => setShowStockModal(false)} className="btn-secondary">
              İptal
            </button>
            <button type="submit" className="btn-primary">
              Güncelle
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductDetail;
