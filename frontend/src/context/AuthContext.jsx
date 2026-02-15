import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data);
    } catch (error) {
      console.error('Kullanıcı bilgisi alınamadı:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, sifre) => {
    try {
      const response = await api.post('/auth/login', { email, sifre });
      const { user, token } = response.data.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      toast.success('Giriş başarılı!');

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Giriş başarısız';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (ad, email, sifre) => {
    try {
      const response = await api.post('/auth/register', { ad, email, sifre });
      const { user, token } = response.data.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      toast.success('Kayıt başarılı!');

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Kayıt başarısız';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('Çıkış yapıldı');
  };

  const updateProfile = async (data) => {
    try {
      const response = await api.put('/auth/profile', data);
      setUser(response.data.data);
      toast.success('Profil güncellendi');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Güncelleme başarısız';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (mevcutSifre, yeniSifre) => {
    try {
      await api.put('/auth/change-password', { mevcutSifre, yeniSifre });
      toast.success('Şifre değiştirildi');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Şifre değiştirilemedi';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.rol === 'admin',
    login,
    register,
    logout,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
