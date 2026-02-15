import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
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
  KeyIcon
} from '@heroicons/react/24/outline';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    ad: '',
    email: '',
    sifre: '',
    rol: 'personel',
    aktif: true
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;

      const response = await usersAPI.getAll(params);
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        const { sifre, ...updateData } = formData;
        await usersAPI.update(selectedUser.id, updateData);
        toast.success('Kullanıcı güncellendi');
      } else {
        await usersAPI.create(formData);
        toast.success('Kullanıcı oluşturuldu');
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  const handleDelete = async () => {
    try {
      await usersAPI.delete(selectedUser.id);
      toast.success('Kullanıcı silindi');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Silme başarısız');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.resetPassword(selectedUser.id, newPassword);
      toast.success('Şifre sıfırlandı');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Şifre sıfırlanamadı');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      ad: user.ad,
      email: user.email,
      sifre: '',
      rol: user.rol,
      aktif: user.aktif
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setSelectedUser(null);
    setFormData({
      ad: '',
      email: '',
      sifre: '',
      rol: 'personel',
      aktif: true
    });
  };

  const columns = [
    { header: 'Ad Soyad', accessor: 'ad' },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Rol',
      accessor: 'rol',
      render: (value) => <StatusBadge status={value} type="role" />
    },
    {
      header: 'Durum',
      accessor: 'aktif',
      render: (value) => (
        <span className={value ? 'badge-success' : 'badge-danger'}>
          {value ? 'Aktif' : 'Pasif'}
        </span>
      )
    },
    {
      header: 'Kayıt Tarihi',
      accessor: 'createdAt',
      render: (value) => new Date(value).toLocaleDateString('tr-TR')
    },
    {
      header: 'İşlemler',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            title="Düzenle"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedUser(row);
              setShowPasswordModal(true);
            }}
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"
            title="Şifre Sıfırla"
          >
            <KeyIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedUser(row);
              setShowDeleteDialog(true);
            }}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
            title="Sil"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kullanıcılar</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Toplam {pagination?.total || 0} kullanıcı
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Yeni Kullanıcı
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kullanıcı ara..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchUsers}
        emptyMessage="Kullanıcı bulunamadı"
      />

      {/* User Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ad Soyad *
            </label>
            <input
              type="text"
              value={formData.ad}
              onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              required
            />
          </div>
          {!selectedUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Şifre *
              </label>
              <input
                type="password"
                value={formData.sifre}
                onChange={(e) => setFormData({ ...formData, sifre: e.target.value })}
                className="input"
                required={!selectedUser}
                minLength={6}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rol
            </label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              className="input"
            >
              <option value="personel">Personel</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {selectedUser && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="aktif"
                checked={formData.aktif}
                onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                className="rounded text-primary-600"
              />
              <label htmlFor="aktif" className="text-sm text-gray-700 dark:text-gray-300">
                Aktif Kullanıcı
              </label>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
              İptal
            </button>
            <button type="submit" className="btn-primary">
              {selectedUser ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Şifre Sıfırla"
        size="sm"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-sm text-gray-500">
            <strong>{selectedUser?.ad}</strong> kullanıcısının şifresini sıfırlayın.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Yeni Şifre *
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              required
              minLength={6}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button type="button" onClick={() => setShowPasswordModal(false)} className="btn-secondary">
              İptal
            </button>
            <button type="submit" className="btn-primary">
              Şifreyi Sıfırla
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Kullanıcıyı Sil"
        message={`"${selectedUser?.ad}" kullanıcısını silmek istediğinize emin misiniz?`}
        confirmText="Sil"
        type="danger"
      />
    </div>
  );
};

export default Users;
