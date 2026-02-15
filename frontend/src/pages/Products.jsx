import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const Products = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('');
  const [durum, setDurum] = useState('');
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    urun_adi: '',
    kategori: '',
    aciklama: '',
    fiyat: '',
    stok: '',
    kritik_stok_seviyesi: '10',
    barkod: '',
    durum: 'aktif'
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [search, kategori, durum]);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (kategori) params.kategori = kategori;
      if (durum) params.durum = durum;

      const response = await productsAPI.getAll(params);
      setProducts(response.data.data.products);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Ürünler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Kategoriler yüklenemedi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedProduct) {
        await productsAPI.update(selectedProduct.id, formData);
        toast.success('Ürün güncellendi');
      } else {
        await productsAPI.create(formData);
        toast.success('Ürün oluşturuldu');
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  const handleDelete = async () => {
    try {
      await productsAPI.delete(selectedProduct.id);
      toast.success('Ürün silindi');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Silme başarısız');
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      urun_adi: product.urun_adi,
      kategori: product.kategori,
      aciklama: product.aciklama || '',
      fiyat: product.fiyat,
      stok: product.stok,
      kritik_stok_seviyesi: product.kritik_stok_seviyesi,
      barkod: product.barkod || '',
      durum: product.durum
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setFormData({
      urun_adi: '',
      kategori: '',
      aciklama: '',
      fiyat: '',
      stok: '',
      kritik_stok_seviyesi: '10',
      barkod: '',
      durum: 'aktif'
    });
  };

  const columns = [
    {
      header: 'Ürün',
      accessor: 'urun_adi',
      render: (value, row) => (
        <Link to={`/products/${row.id}`} className="font-medium text-primary-600 hover:text-primary-700">
          {value}
        </Link>
      )
    },
    { header: 'Kategori', accessor: 'kategori' },
    {
      header: 'Fiyat',
      accessor: 'fiyat',
      render: (value) => `${parseFloat(value).toLocaleString('tr-TR')} TL`
    },
    {
      header: 'Stok',
      accessor: 'stok',
      render: (value, row) => (
        <span className={value <= row.kritik_stok_seviyesi ? 'text-red-600 font-semibold' : ''}>
          {value}
        </span>
      )
    },
    {
      header: 'Durum',
      accessor: 'durum',
      render: (value) => <StatusBadge status={value} type="product" />
    },
    {
      header: 'İşlemler',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => openEditModal(row)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                title="Düzenle"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedProduct(row);
                  setShowDeleteDialog(true);
                }}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                title="Sil"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ürünler</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Toplam {pagination?.total || 0} ürün
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Yeni Ürün
          </button>
        )}
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
              placeholder="Ürün ara..."
              className="input pl-10"
            />
          </div>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="input md:w-48"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={durum}
            onChange={(e) => setDurum(e.target.value)}
            className="input md:w-40"
          >
            <option value="">Tüm Durumlar</option>
            <option value="aktif">Aktif</option>
            <option value="pasif">Pasif</option>
            <option value="tukendi">Tükendi</option>
          </select>
          <button
            onClick={() => fetchProducts()}
            className="btn-secondary"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchProducts}
        emptyMessage="Ürün bulunamadı"
      />

      {/* Product Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedProduct ? 'Ürün Düzenle' : 'Yeni Ürün'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ürün Adı *
              </label>
              <input
                type="text"
                value={formData.urun_adi}
                onChange={(e) => setFormData({ ...formData, urun_adi: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kategori *
              </label>
              <input
                type="text"
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                className="input"
                list="categories"
                required
              />
              <datalist id="categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fiyat (TL) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.fiyat}
                onChange={(e) => setFormData({ ...formData, fiyat: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stok *
              </label>
              <input
                type="number"
                min="0"
                value={formData.stok}
                onChange={(e) => setFormData({ ...formData, stok: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kritik Stok Seviyesi
              </label>
              <input
                type="number"
                min="0"
                value={formData.kritik_stok_seviyesi}
                onChange={(e) => setFormData({ ...formData, kritik_stok_seviyesi: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Barkod
              </label>
              <input
                type="text"
                value={formData.barkod}
                onChange={(e) => setFormData({ ...formData, barkod: e.target.value })}
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Açıklama
              </label>
              <textarea
                value={formData.aciklama}
                onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                className="input"
                rows="3"
              />
            </div>
            {selectedProduct && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Durum
                </label>
                <select
                  value={formData.durum}
                  onChange={(e) => setFormData({ ...formData, durum: e.target.value })}
                  className="input"
                >
                  <option value="aktif">Aktif</option>
                  <option value="pasif">Pasif</option>
                  <option value="tukendi">Tükendi</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
              İptal
            </button>
            <button type="submit" className="btn-primary">
              {selectedProduct ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Ürünü Sil"
        message={`"${selectedProduct?.urun_adi}" ürününü silmek istediğinize emin misiniz?`}
        confirmText="Sil"
        type="danger"
      />
    </div>
  );
};

export default Products;
