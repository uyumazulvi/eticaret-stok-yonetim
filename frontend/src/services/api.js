import axios from 'axios';

// Production'da Render URL, development'ta proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - token ekleme
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - hata yönetimi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API fonksiyonları
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data)
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  updateStock: (id, data) => api.put(`/products/${id}/stock`, data),
  getCategories: () => api.get('/products/categories')
};

export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, durum) => api.put(`/orders/${id}/status`, { durum }),
  delete: (id) => api.delete(`/orders/${id}`)
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getSalesChart: (period) => api.get('/dashboard/sales-chart', { params: { period } }),
  getTopProducts: (limit) => api.get('/dashboard/top-products', { params: { limit } }),
  getCriticalStock: (limit) => api.get('/dashboard/critical-stock', { params: { limit } }),
  getOrderStatus: () => api.get('/dashboard/order-status'),
  getCategorySales: () => api.get('/dashboard/category-sales'),
  getRecentOrders: (limit) => api.get('/dashboard/recent-orders', { params: { limit } }),
  getRecentStockLogs: (limit) => api.get('/dashboard/recent-stock-logs', { params: { limit } })
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  resetPassword: (id, yeniSifre) => api.put(`/users/${id}/reset-password`, { yeniSifre })
};

export const reportsAPI = {
  getSalesPDF: (params) => api.get('/reports/sales-pdf', { params, responseType: 'blob' }),
  getProductsExcel: () => api.get('/reports/products-excel', { responseType: 'blob' }),
  getStockExcel: () => api.get('/reports/stock-excel', { responseType: 'blob' }),
  getOrdersExcel: (params) => api.get('/reports/orders-excel', { params, responseType: 'blob' }),
  importProducts: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/reports/products-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};
