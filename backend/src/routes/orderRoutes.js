const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Tất cả thao tác đơn hàng cần đăng nhập (cả Admin và Staff đều có quyền)
router.use(authMiddleware);

// GET /api/orders
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);

// POST /api/orders
router.post('/', orderController.createOrder);

// PUT /api/orders/:id/status
router.put('/:id/status', orderController.updateOrderStatus);

// PUT /api/orders/:id/payment-status
router.put('/:id/payment-status', orderController.updateOrderPaymentStatus);

module.exports = router;
