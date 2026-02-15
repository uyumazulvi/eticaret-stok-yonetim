const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getCategories
} = require('../controllers/productController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Tüm route'lar için auth gerekli
router.use(authMiddleware);

// Public routes (authenticated)
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProduct);

// Admin routes
router.post('/', adminMiddleware, createProduct);
router.put('/:id', adminMiddleware, updateProduct);
router.delete('/:id', adminMiddleware, deleteProduct);

// Stok güncelleme (personel de yapabilir)
router.put('/:id/stock', updateStock);

module.exports = router;
