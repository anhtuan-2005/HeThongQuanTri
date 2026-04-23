const db = require('../config/db');

const Customer = {
  getAll: (filters, callback) => {
    let query = 'SELECT id, name, birthday, phone, address, gender, is_deleted as isDeleted, created_at FROM customers';
    const params = [];
    const where = [];

    if (filters && typeof filters.q === 'string' && filters.q.trim()) {
      where.push('(name LIKE ? OR phone LIKE ?)');
      params.push(`%${filters.q.trim()}%`, `%${filters.q.trim()}%`);
    }

    if (where.length) query += ' WHERE ' + where.join(' AND ');
    query += ' ORDER BY id DESC';

    db.query(query, params, callback);
  },

  getById: (id, callback) => {
    db.query(
      'SELECT id, name, birthday, phone, address, gender, is_deleted as isDeleted, created_at FROM customers WHERE id = ?',
      [id],
      callback
    );
  },

  getByPhone: (phone, callback) => {
    db.query('SELECT id FROM customers WHERE phone = ? LIMIT 1', [phone], callback);
  },

  getByPhoneExceptId: (phone, id, callback) => {
    db.query('SELECT id FROM customers WHERE phone = ? AND id != ? LIMIT 1', [phone, id], callback);
  },

  create: (data, callback) => {
    db.query(
      'INSERT INTO customers (name, birthday, phone, address, gender) VALUES (?, ?, ?, ?, ?)',
      [
        data.name,
        data.birthday || null,
        data.phone,
        data.address || null,
        data.gender || 'other',
      ],
      callback
    );
  },

  update: (id, data, callback) => {
    db.query(
      'UPDATE customers SET name = ?, birthday = ?, phone = ?, address = ?, gender = ?, is_deleted = ? WHERE id = ?',
      [
        data.name,
        data.birthday || null,
        data.phone,
        data.address || null,
        data.gender || 'other',
        data.is_deleted ? 1 : 0,
        id,
      ],
      callback
    );
  },

  delete: (id, callback) => {
    db.query('DELETE FROM customers WHERE id = ?', [id], callback);
  },

  softDelete: (id, callback) => {
    db.query('UPDATE customers SET is_deleted = 1 WHERE id = ?', [id], callback);
  },

  restore: (id, callback) => {
    db.query('UPDATE customers SET is_deleted = 0 WHERE id = ?', [id], callback);
  },
};

module.exports = Customer;
