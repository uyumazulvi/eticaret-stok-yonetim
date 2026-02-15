const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  generateSalesPDF,
  exportProductsExcel,
  importProductsExcel,
  exportStockReportExcel,
  exportOrdersExcel
} = require('../controllers/reportController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Multer configuration for Excel upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Sadece Excel dosyaları yüklenebilir'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Tüm route'lar için auth gerekli
router.use(authMiddleware);

// Export routes
router.get('/sales-pdf', generateSalesPDF);
router.get('/products-excel', exportProductsExcel);
router.get('/stock-excel', exportStockReportExcel);
router.get('/orders-excel', exportOrdersExcel);

// Import routes (admin only)
router.post('/products-import', adminMiddleware, upload.single('file'), importProductsExcel);

module.exports = router;
