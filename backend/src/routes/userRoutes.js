const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// GET /api/users (Cho phép cả admin và staff lấy danh sách khách hàng)
router.get('/', roleMiddleware(['admin', 'staff']), userController.getAllUsers);

// Chỉ cho phép admin thực hiện các thao tác quản lý khác
router.use(roleMiddleware(['admin']));

// PUT /api/users/:id/status
router.put('/:id/status', userController.updateUserStatus);

// POST /api/users (Thêm tài khoản nhân viên/admin mới)
router.post('/', userController.createUser);

module.exports = router;
