import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getOne(id);
      setOrder(response.data.data);
    } catch (error) {
      toast.error('Sipariş bulunamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await ordersAPI.updateStatus(id, newStatus);
      toast.success('Durum güncellendi');
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Güncelleme başarısız');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Sipariş bulunamadı</p>
        <Link to="/orders" className="btn-primary mt-4 inline-block">
          Siparişlere Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/orders"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sipariş #{order.siparis_no}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {new Date(order.createdAt).toLocaleString('tr-TR')}
          </p>
        </div>
        <StatusBadge status={order.durum} type="order" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Müşteri Bilgileri */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Müşteri Bilgileri
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Ad Soyad</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {order.musteri_adi}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="text-gray-900 dark:text-white">
                {order.musteri_email || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Telefon</dt>
              <dd className="text-gray-900 dark:text-white">
                {order.musteri_telefon || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Teslimat Adresi</dt>
              <dd className="text-gray-900 dark:text-white">
                {order.teslimat_adresi || '-'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Sipariş Durumu */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sipariş Durumu
          </h2>
          <div className="space-y-3">
            {['beklemede', 'hazirlaniyor', 'kargoda', 'tamamlandi', 'iptal'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  order.durum === status
                    ? 'bg-primary-100 dark:bg-primary-900 border-2 border-primary-500'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <StatusBadge status={status} type="order" />
              </button>
            ))}
          </div>
        </div>

        {/* Sipariş Özeti */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sipariş Özeti
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Ara Toplam</span>
              <span className="font-medium">
                {parseFloat(order.toplam_tutar).toLocaleString('tr-TR')} TL
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Kargo</span>
              <span className="font-medium">0.00 TL</span>
            </div>
            <hr className="dark:border-gray-700" />
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Toplam</span>
              <span className="font-bold text-primary-600">
                {parseFloat(order.toplam_tutar).toLocaleString('tr-TR')} TL
              </span>
            </div>
          </div>
          {order.notlar && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Not:</strong> {order.notlar}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sipariş Kalemleri */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Sipariş Kalemleri
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                <th className="pb-3">Ürün</th>
                <th className="pb-3 text-right">Birim Fiyat</th>
                <th className="pb-3 text-right">Adet</th>
                <th className="pb-3 text-right">Toplam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {order.kalemler?.map((kalem) => (
                <tr key={kalem.id}>
                  <td className="py-4">
                    <Link
                      to={`/products/${kalem.urun?.id}`}
                      className="font-medium text-primary-600 hover:text-primary-700"
                    >
                      {kalem.urun?.urun_adi}
                    </Link>
                  </td>
                  <td className="py-4 text-right">
                    {parseFloat(kalem.birim_fiyat).toLocaleString('tr-TR')} TL
                  </td>
                  <td className="py-4 text-right">{kalem.adet}</td>
                  <td className="py-4 text-right font-medium">
                    {parseFloat(kalem.toplam).toLocaleString('tr-TR')} TL
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
