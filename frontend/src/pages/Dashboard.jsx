import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { dashboardAPI } from '../services/api';
import StatsCard from '../components/ui/StatsCard';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

// Chart.js kayıt
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesChart, setSalesChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [criticalStock, setCriticalStock] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        statsRes,
        salesRes,
        topRes,
        criticalRes,
        statusRes,
        recentRes
      ] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getSalesChart('daily'),
        dashboardAPI.getTopProducts(5),
        dashboardAPI.getCriticalStock(5),
        dashboardAPI.getOrderStatus(),
        dashboardAPI.getRecentOrders(5)
      ]);

      setStats(statsRes.data.data);
      setSalesChart(salesRes.data.data);
      setTopProducts(topRes.data.data);
      setCriticalStock(criticalRes.data.data);
      setOrderStatus(statusRes.data.data);
      setRecentOrders(recentRes.data.data);
    } catch (error) {
      console.error('Dashboard verisi alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  // Satış grafiği verisi
  const salesChartData = {
    labels: salesChart.map(item => item.tarih),
    datasets: [
      {
        label: 'Satış (TL)',
        data: salesChart.map(item => parseFloat(item.toplam) || 0),
        fill: true,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4
      }
    ]
  };

  // Sipariş durum grafiği
  const orderStatusData = {
    labels: orderStatus.map(item => {
      const labels = {
        beklemede: 'Beklemede',
        hazirlaniyor: 'Hazırlanıyor',
        kargoda: 'Kargoda',
        tamamlandi: 'Tamamlandı',
        iptal: 'İptal'
      };
      return labels[item.durum] || item.durum;
    }),
    datasets: [
      {
        data: orderStatus.map(item => parseInt(item.sayi)),
        backgroundColor: [
          'rgba(234, 179, 8, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  };

  // En çok satan ürünler grafiği
  const topProductsData = {
    labels: topProducts.map(item => item.urun?.urun_adi?.substring(0, 15) || 'Ürün'),
    datasets: [
      {
        label: 'Satış Adedi',
        data: topProducts.map(item => parseInt(item.toplam_satis) || 0),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderRadius: 8
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Genel istatistikler ve performans özeti
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Günlük Satış"
          value={`${parseFloat(stats?.satis?.bugun || 0).toLocaleString('tr-TR')} TL`}
          icon={CurrencyDollarIcon}
          color="green"
        />
        <StatsCard
          title="Aylık Satış"
          value={`${parseFloat(stats?.satis?.aylik || 0).toLocaleString('tr-TR')} TL`}
          icon={ArrowTrendingUpIcon}
          color="primary"
        />
        <StatsCard
          title="Bekleyen Sipariş"
          value={stats?.siparis?.bekleyen || 0}
          icon={ShoppingCartIcon}
          color="yellow"
        />
        <StatsCard
          title="Kritik Stok"
          value={stats?.urun?.kritik_stok || 0}
          icon={ExclamationTriangleIcon}
          color="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Satış Grafiği */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Satış Trendi (Son 7 Gün)
          </h2>
          <div className="h-64">
            <Line
              data={salesChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                  },
                  x: {
                    grid: { display: false }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Sipariş Durumları */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sipariş Durumları
          </h2>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={orderStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'right' }
                },
                cutout: '60%'
              }}
            />
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* En Çok Satan Ürünler */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            En Çok Satan Ürünler
          </h2>
          <div className="h-64">
            <Bar
              data={topProductsData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                  },
                  x: {
                    grid: { display: false }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Kritik Stok Uyarıları */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Kritik Stok
            </h2>
            <Link
              to="/products?kritik_stok=true"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Tümünü Gör
            </Link>
          </div>
          <div className="space-y-3">
            {criticalStock.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                Kritik stok ürünü yok
              </p>
            ) : (
              criticalStock.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {product.urun_adi}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Kritik: {product.kritik_stok_seviyesi}
                    </p>
                  </div>
                  <span className="badge-danger ml-2">
                    {product.stok} adet
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Son Siparişler */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Son Siparişler
          </h2>
          <Link
            to="/orders"
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Tümünü Gör
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                <th className="pb-3">Sipariş No</th>
                <th className="pb-3">Müşteri</th>
                <th className="pb-3">Tutar</th>
                <th className="pb-3">Durum</th>
                <th className="pb-3">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="py-3">
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {order.siparis_no}
                    </Link>
                  </td>
                  <td className="py-3 text-gray-900 dark:text-white">
                    {order.musteri_adi}
                  </td>
                  <td className="py-3 text-gray-900 dark:text-white">
                    {parseFloat(order.toplam_tutar).toLocaleString('tr-TR')} TL
                  </td>
                  <td className="py-3">
                    <StatusBadge status={order.durum} type="order" />
                  </td>
                  <td className="py-3 text-gray-500 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('tr-TR')}
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

export default Dashboard;
