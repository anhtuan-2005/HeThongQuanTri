const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

// Tất cả thao tác sản phẩm cần đăng nhập
router.use(authMiddleware);

router.get("/products", productController.getProducts);

router.get("/products/:id", productController.getProduct);

// Chỉ admin mới có quyền quản lý thùng rác và thêm/sửa/xóa sản phẩm
router.get("/trash/products", roleMiddleware(['admin']), productController.getTrash);

router.put("/trash/products/:id/restore", roleMiddleware(['admin']), productController.restoreProduct);

router.delete("/trash/products/:id", roleMiddleware(['admin']), productController.hardDeleteProduct);

router.post("/products", roleMiddleware(['admin']), productController.createProduct);

router.put("/products/:id", roleMiddleware(['admin']), productController.updateProduct);

router.delete("/products/:id", roleMiddleware(['admin']), productController.deleteProduct);

module.exports = router;