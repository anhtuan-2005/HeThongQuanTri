const db = require("../config/db");

exports.getAll = (filters, callback) => {
  const conditions = ["p.is_deleted = 0"];
  const params = [];
  if (filters && filters.q) {
    conditions.push('(p.name LIKE ?)');
    params.push(`%${filters.q}%`);
  }
  if (filters && typeof filters.category_id === 'number' && !Number.isNaN(filters.category_id)) {
    conditions.push('p.category_id = ?');
    params.push(filters.category_id);
  }
  if (filters && typeof filters.minPrice === 'number' && !Number.isNaN(filters.minPrice)) {
    conditions.push('p.price >= ?');
    params.push(filters.minPrice);
  }
  if (filters && typeof filters.maxPrice === 'number' && !Number.isNaN(filters.maxPrice)) {
    conditions.push('p.price <= ?');
    params.push(filters.maxPrice);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `
    SELECT p.*, c.name as category_name,
           EXISTS(SELECT 1 FROM order_items oi WHERE oi.product_id = p.id) as has_sales
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ${whereClause}
    ORDER BY p.id DESC
  `;
  db.query(query, params, callback);
};

exports.getOne = (id, callback) => {
  db.query("SELECT * FROM products WHERE id = ? AND is_deleted = 0", [id], callback);
};

exports.create = (data, callback) => {
  db.query(
    "INSERT INTO products (name, price, description, image, category_id, status, stock, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
    [
      data.name,
      data.price,
      data.description || '',
      data.image || '',
      data.category_id || 1,
      data.status || 'active',
      data.stock || 0
    ],
    callback
  );
};

exports.update = (id, data, callback) => {
  const query = "UPDATE products SET name=?, price=?, description=?, image=?, category_id=?, status=?, stock=? WHERE id=? AND is_deleted = 0";
  const params = [
    data.name,
    data.price,
    data.description || '',
    data.image || '',
    data.category_id || null,
    data.status || 'active',
    data.stock || 0,
    id
  ];
  db.query(query, params, callback);
};

exports.delete = (id, callback) => {
  // Soft delete
  db.query("UPDATE products SET is_deleted = 1 WHERE id = ?", [id], callback);
};

exports.getTrash = (callback) => {
  const query = `
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_deleted = 1
    ORDER BY p.id DESC
  `;
  db.query(query, callback);
};

exports.restore = (id, callback) => {
  db.query("UPDATE products SET is_deleted = 0 WHERE id = ?", [id], callback);
};

exports.hardDelete = (id, callback) => {
  // Ẩn hoàn toàn khỏi giao diện quản lý nhưng vẫn giữ trong DB cho thống kê (is_deleted = 2)
  db.query("UPDATE products SET is_deleted = 2 WHERE id = ?", [id], callback);
};
