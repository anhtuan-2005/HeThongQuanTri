const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

// Chỉ cho phép admin xem thống kê
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// GET /api/analytics/overview
router.get('/overview', analyticsController.getOverview);

// GET /api/analytics/revenue?granularity=day|week|month|year
router.get('/revenue', analyticsController.getRevenueSeries);

// GET /api/analytics/top-products?metric=quantity|revenue&limit=5
router.get('/top-products', analyticsController.getTopProducts);

// GET /api/analytics/revenue-by-category
router.get('/revenue-by-category', analyticsController.getRevenueByCategory);

// GET /api/analytics/low-stock?threshold=5
router.get('/low-stock', analyticsController.getLowStockProducts);

module.exports = router;
