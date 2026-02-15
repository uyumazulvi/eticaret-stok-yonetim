const express = require('express');
const router = express.Router();
const {
  getStats,
  getSalesChart,
  getTopProducts,
  getCriticalStock,
  getOrderStatusDistribution,
  getCategorySales,
  getRecentStockLogs,
  getRecentOrders
} = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/auth');

// Tüm route'lar için auth gerekli
router.use(authMiddleware);

router.get('/stats', getStats);
router.get('/sales-chart', getSalesChart);
router.get('/top-products', getTopProducts);
router.get('/critical-stock', getCriticalStock);
router.get('/order-status', getOrderStatusDistribution);
router.get('/category-sales', getCategorySales);
router.get('/recent-stock-logs', getRecentStockLogs);
router.get('/recent-orders', getRecentOrders);

module.exports = router;
