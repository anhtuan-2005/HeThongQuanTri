const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

// Tất cả thao tác danh mục cần đăng nhập
router.use(authMiddleware);

// GET /api/categories
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Các thao tác thay đổi danh mục chỉ dành cho Admin
router.post('/', roleMiddleware(['admin']), categoryController.createCategory);
router.put('/:id', roleMiddleware(['admin']), categoryController.updateCategory);
router.delete('/:id', roleMiddleware(['admin']), categoryController.deleteCategory);

module.exports = router;
