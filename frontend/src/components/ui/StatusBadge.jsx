const StatusBadge = ({ status, type = 'order' }) => {
  const orderStatusConfig = {
    beklemede: { label: 'Beklemede', className: 'badge-warning' },
    hazirlaniyor: { label: 'Hazırlanıyor', className: 'badge-info' },
    kargoda: { label: 'Kargoda', className: 'badge-info' },
    tamamlandi: { label: 'Tamamlandı', className: 'badge-success' },
    iptal: { label: 'İptal', className: 'badge-danger' }
  };

  const productStatusConfig = {
    aktif: { label: 'Aktif', className: 'badge-success' },
    pasif: { label: 'Pasif', className: 'badge-gray' },
    tukendi: { label: 'Tükendi', className: 'badge-danger' }
  };

  const stockStatusConfig = {
    giris: { label: 'Giriş', className: 'badge-success' },
    cikis: { label: 'Çıkış', className: 'badge-danger' },
    duzeltme: { label: 'Düzeltme', className: 'badge-warning' },
    siparis: { label: 'Sipariş', className: 'badge-info' },
    iade: { label: 'İade', className: 'badge-warning' }
  };

  const userRoleConfig = {
    admin: { label: 'Admin', className: 'badge-danger' },
    personel: { label: 'Personel', className: 'badge-info' }
  };

  const configMap = {
    order: orderStatusConfig,
    product: productStatusConfig,
    stock: stockStatusConfig,
    role: userRoleConfig
  };

  const config = configMap[type]?.[status] || { label: status, className: 'badge-gray' };

  return <span className={config.className}>{config.label}</span>;
};

export default StatusBadge;
