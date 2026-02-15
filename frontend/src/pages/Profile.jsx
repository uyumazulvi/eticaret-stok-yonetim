import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { UserCircleIcon, KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [profileData, setProfileData] = useState({
    ad: user?.ad || '',
    email: user?.email || ''
  });
  const [passwordData, setPasswordData] = useState({
    mevcutSifre: '',
    yeniSifre: '',
    yeniSifreTekrar: ''
  });
  const [loading, setLoading] = useState({
    profile: false,
    password: false
  });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading({ ...loading, profile: true });
    await updateProfile(profileData);
    setLoading({ ...loading, profile: false });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.yeniSifre !== passwordData.yeniSifreTekrar) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    if (passwordData.yeniSifre.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalı');
      return;
    }

    setLoading({ ...loading, password: true });
    const result = await changePassword(passwordData.mevcutSifre, passwordData.yeniSifre);
    if (result.success) {
      setPasswordData({ mevcutSifre: '', yeniSifre: '', yeniSifreTekrar: '' });
    }
    setLoading({ ...loading, password: false });
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profil</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Hesap ayarlarınızı yönetin
        </p>
      </div>

      {/* Profil Bilgileri */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <UserCircleIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Profil Bilgileri
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Kişisel bilgilerinizi güncelleyin
            </p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ad Soyad
              </label>
              <input
                type="text"
                value={profileData.ad}
                onChange={(e) => setProfileData({ ...profileData, ad: e.target.value })}
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
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading.profile}
              className="btn-primary"
            >
              {loading.profile ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>

      {/* Şifre Değiştir */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
            <KeyIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Şifre Değiştir
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hesap şifrenizi güncelleyin
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mevcut Şifre
            </label>
            <input
              type="password"
              value={passwordData.mevcutSifre}
              onChange={(e) => setPasswordData({ ...passwordData, mevcutSifre: e.target.value })}
              className="input"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Yeni Şifre
              </label>
              <input
                type="password"
                value={passwordData.yeniSifre}
                onChange={(e) => setPasswordData({ ...passwordData, yeniSifre: e.target.value })}
                className="input"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Yeni Şifre Tekrar
              </label>
              <input
                type="password"
                value={passwordData.yeniSifreTekrar}
                onChange={(e) => setPasswordData({ ...passwordData, yeniSifreTekrar: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading.password}
              className="btn-primary"
            >
              {loading.password ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
            </button>
          </div>
        </form>
      </div>

      {/* Hesap Bilgileri */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <ShieldCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Hesap Bilgileri
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hesabınızla ilgili bilgiler
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <dt className="text-sm text-gray-500 dark:text-gray-400">Rol</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white capitalize">
              {user?.rol}
            </dd>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <dt className="text-sm text-gray-500 dark:text-gray-400">Durum</dt>
            <dd className="mt-1 text-lg font-semibold text-green-600">
              Aktif
            </dd>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <dt className="text-sm text-gray-500 dark:text-gray-400">Kayıt Tarihi</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}
            </dd>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <dt className="text-sm text-gray-500 dark:text-gray-400">Kullanıcı ID</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              #{user?.id}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default Profile;
