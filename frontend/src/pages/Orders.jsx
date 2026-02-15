import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI, productsAPI } from '../services/api';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [durum, setDurum] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    musteri_adi: '',
    musteri_email: '',
    musteri_telefon: '',
    teslimat_adresi: '',
    notlar: '',
    kalemler: [{ product_id: '', adet: 1 }]
  });

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [search, durum]);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (durum) params.durum = durum;

      const response = await ordersAPI.getAll(params);
      setOrders(response.data.data.orders);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Siparişler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll({ limit: 100, durum: 'aktif' });
      setProducts(response.data.data.products);
    } catch (error) {
      console.error('Ürünler yüklenemedi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const kalemler = formData.kalemler.filter(k => k.product_id && k.adet > 0);
      if (kalemler.length === 0) {
        toast.error('En az bir ürün ekleyin');
        return;
      }
      await ordersAPI.create({ ...formData, kalemler });
      toast.success('Sipariş oluşturuldu');
      setShowModal(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Sipariş oluşturulamadı');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await ordersAPI.updateStatus(id, newStatus);
      toast.success('Durum güncellendi');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Güncelleme başarısız');
    }
  };

  const addOrderItem = () => {
    setFormData({
      ...formData,
      kalemler: [...formData.kalemler, { product_id: '', adet: 1 }]
    });
  };

  const removeOrderItem = (index) => {
    if (formData.kalemler.length > 1) {
      const newKalemler = formData.kalemler.filter((_, i) => i !== index);
      setFormData({ ...formData, kalemler: newKalemler });
    }
  };

  const updateOrderItem = (index, field, value) => {
    const newKalemler = [...formData.kalemler];
    newKalemler[index][field] = value;
    setFormData({ ...formData, kalemler: newKalemler });
  };

  const resetForm = () => {
    setFormData({
      musteri_adi: '',
      musteri_email: '',
      musteri_telefon: '',
      teslimat_adresi: '',
      notlar: '',
      kalemler: [{ product_id: '', adet: 1 }]
    });
  };

  const columns = [
    {
      header: 'Sipariş No',
      accessor: 'siparis_no',
      render: (value, row) => (
        <Link to={`/orders/${row.id}`} className="font-medium text-primary-600 hover:text-primary-700">
          {value}
        </Link>
      )
    },
    { header: 'Müşteri', accessor: 'musteri_adi' },
    {
      header: 'Tutar',
      accessor: 'toplam_tutar',
      render: (value) => `${parseFloat(value).toLocaleString('tr-TR')} TL`
    },
    {
      header: 'Durum',
      accessor: 'durum',
      render: (value, row) => (
        <select
          value={value}
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          className="text-sm bg-transparent border-0 cursor-pointer focus:ring-0"
        >
          <option value="beklemede">Beklemede</option>
          <option value="hazirlaniyor">Hazırlanıyor</option>
          <option value="kargoda">Kargoda</option>
          <option value="tamamlandi">Tamamlandı</option>
          <option value="iptal">İptal</option>
        </select>
      )
    },
    {
      header: 'Tarih',
      accessor: 'createdAt',
      render: (value) => new Date(value).toLocaleDateString('tr-TR')
    },
    {
      header: 'İşlemler',
      accessor: 'id',
      render: (_, row) => (
        <Link
          to={`/orders/${row.id}`}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 inline-block"
        >
          <EyeIcon className="h-4 w-4" />
        </Link>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Siparişler</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Toplam {pagination?.total || 0} sipariş
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Yeni Sipariş
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sipariş no veya müşteri ara..."
              className="input pl-10"
            />
          </div>
          <select
            value={durum}
            onChange={(e) => setDurum(e.target.value)}
            className="input md:w-48"
          >
            <option value="">Tüm Durumlar</option>
            <option value="beklemede">Beklemede</option>
            <option value="hazirlaniyor">Hazırlanıyor</option>
            <option value="kargoda">Kargoda</option>
            <option value="tamamlandi">Tamamlandı</option>
            <option value="iptal">İptal</option>
          </select>
          <button onClick={() => fetchOrders()} className="btn-secondary">
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchOrders}
        emptyMessage="Sipariş bulunamadı"
      />

      {/* New Order Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Yeni Sipariş"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Müşteri Adı *
              </label>
              <input
                type="text"
                value={formData.musteri_adi}
                onChange={(e) => setFormData({ ...formData, musteri_adi: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.musteri_email}
                onChange={(e) => setFormData({ ...formData, musteri_email: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefon
              </label>
              <input
                type="text"
                value={formData.musteri_telefon}
                onChange={(e) => setFormData({ ...formData, musteri_telefon: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teslimat Adresi
              </label>
              <input
                type="text"
                value={formData.teslimat_adresi}
                onChange={(e) => setFormData({ ...formData, teslimat_adresi: e.target.value })}
                className="input"
              />
            </div>
          </div>

          {/* Sipariş Kalemleri */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ürünler *
              </label>
              <button type="button" onClick={addOrderItem} className="text-sm text-primary-600 hover:text-primary-700">
                + Ürün Ekle
              </button>
            </div>
            <div className="space-y-2">
              {formData.kalemler.map((kalem, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={kalem.product_id}
                    onChange={(e) => updateOrderItem(index, 'product_id', e.target.value)}
                    className="input flex-1"
                  >
                    <option value="">Ürün seçin</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.urun_adi} - {parseFloat(p.fiyat).toLocaleString('tr-TR')} TL (Stok: {p.stok})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={kalem.adet}
                    onChange={(e) => updateOrderItem(index, 'adet', parseInt(e.target.value))}
                    className="input w-24"
                    placeholder="Adet"
                  />
                  {formData.kalemler.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOrderItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notlar
            </label>
            <textarea
              value={formData.notlar}
              onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
              className="input"
              rows="2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
              İptal
            </button>
            <button type="submit" className="btn-primary">
              Sipariş Oluştur
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Orders;
