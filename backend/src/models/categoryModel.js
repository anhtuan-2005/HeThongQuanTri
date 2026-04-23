const db = require('../config/db');

const Category = {
  // Lấy danh sách tất cả danh mục
  getAll: (callback) => {
    const query = 'SELECT * FROM categories ORDER BY id DESC';
    db.query(query, callback);
  },

  // Lấy chi tiết một danh mục theo Id
  getById: (id, callback) => {
    const query = 'SELECT * FROM categories WHERE id = ?';
    db.query(query, [id], callback);
  },

  // Thêm mới một danh mục
  create: (categoryData, callback) => {
    const query = 'INSERT INTO categories (name) VALUES (?)';
    db.query(query, [categoryData.name], callback);
  },

  // Cập nhật thông tin danh mục
  update: (id, categoryData, callback) => {
    const query = 'UPDATE categories SET name = ? WHERE id = ?';
    db.query(query, [categoryData.name, id], callback);
  },

  // Xóa danh mục
  delete: (id, callback) => {
    const query = 'DELETE FROM categories WHERE id = ?';
    db.query(query, [id], callback);
  }
};

module.exports = Category;
