const Category = require('../models/categoryModel');

const categoryController = {
  // 1. Lấy toàn bộ danh mục sản phẩm (GET /categories)
  getAllCategories: (req, res) => {
    Category.getAll((err, results) => {
      if (err) {
        console.error('Lỗi khi lấy danh mục:', err);
        return res.status(500).json({ message: 'Lỗi server' });
      }
      res.status(200).json(results);
    });
  },

  // 2. Lấy 1 danh mục theo ID (GET /categories/:id)
  getCategoryById: (req, res) => {
    const categoryId = req.params.id;
    Category.getById(categoryId, (err, results) => {
      if (err) {
        console.error('Lỗi khi lấy danh mục:', err);
        return res.status(500).json({ message: 'Lỗi server' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'Danh mục không tồn tại' });
      }
      res.status(200).json(results[0]);
    });
  },

  // 3. Tạo mới danh mục sản phẩm (POST /categories)
  createCategory: (req, res) => {
    const newCategory = req.body;
    
    if (!newCategory.name) {
      return res.status(400).json({ message: 'Vui lòng cung cấp tên danh mục!' });
    }

    Category.create(newCategory, (err, result) => {
      if (err) {
        console.error('Lỗi khi thêm danh mục:', err);
        if (err.code === 'ER_DUP_ENTRY') {
           return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
        }
        return res.status(500).json({ message: 'Lỗi server' });
      }
      res.status(201).json({ message: 'Tạo danh mục thành công', id: result.insertId, ...newCategory });
    });
  },

  // 4. Cập nhật thông tin danh mục (PUT /categories/:id)
  updateCategory: (req, res) => {
    const categoryId = req.params.id;
    const categoryData = req.body;

    if (!categoryData.name) {
        return res.status(400).json({ message: 'Vui lòng cung cấp tên danh mục mới!' });
    }

    Category.update(categoryId, categoryData, (err, result) => {
      if (err) {
        console.error('Lỗi khi cập nhật danh mục:', err);
        if (err.code === 'ER_DUP_ENTRY') {
           return res.status(400).json({ message: 'Tên danh mục đã định cập nhật bị trùng lặp' });
        }
        return res.status(500).json({ message: 'Lỗi server' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Danh mục cần sửa không tồn tại' });
      }
      res.status(200).json({ message: 'Cập nhật danh mục thành công' });
    });
  },

  // 5. Xóa danh mục sản phẩm (DELETE /categories/:id)
  deleteCategory: (req, res) => {
    const categoryId = req.params.id;
    Category.delete(categoryId, (err, result) => {
      if (err) {
        console.error('Lỗi khi xóa danh mục:', err);
        return res.status(500).json({ message: 'Lỗi server' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Danh mục cần xóa không tồn tại' });
      }
      res.status(200).json({ message: 'Xóa danh mục thành công' });
    });
  }
};

module.exports = categoryController;
