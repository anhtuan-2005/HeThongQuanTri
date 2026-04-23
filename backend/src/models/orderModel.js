const db = require('../config/db');

const Order = {
  // Lấy chi tiết đơn hàng kèm tên người mua và danh sách sản phẩm
  getAll: (filters, callback) => {
    let query = `
      SELECT o.id, COALESCE(u.name, c.name) as customer_name, o.total_price, o.status, o.payment_status,
             o.created_at as created_at, o.created_at as createdDate,
             GROUP_CONCAT(CONCAT(p.name, ' (x', oi.quantity, ')') SEPARATOR ', ') as product_names
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
    `;

    const queryParams = [];
    const whereClauses = [];

    if (filters.search) {
      whereClauses.push('COALESCE(u.name, c.name) LIKE ?');
      queryParams.push(`%${filters.search}%`);
    }

    if (filters.status) {
      whereClauses.push('o.status = ?');
      queryParams.push(filters.status);
    }

    if (filters.fromDate && filters.toDate) {
      whereClauses.push('o.created_at BETWEEN ? AND ?');
      queryParams.push(`${filters.fromDate} 00:00:00`, `${filters.toDate} 23:59:59`);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += `
      GROUP BY o.id
      ORDER BY o.id DESC
    `;

    db.query(query, queryParams, callback);
  },

  // Lấy chi tiết 1 đơn hàng theo ID
  getById: (id, callback) => {
    const query = `
      SELECT o.id, COALESCE(u.name, c.name) as customer_name, u.email as customer_email, o.total_price, o.status, o.payment_status,
             o.created_at as created_at, o.created_at as createdDate,
             GROUP_CONCAT(CONCAT(p.name, ' (x', oi.quantity, ') - ', p.price, 'đ') SEPARATOR '||') as product_details
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ?
      GROUP BY o.id
    `;
    db.query(query, [id], callback);
  },

  updatePaymentStatus: (id, paymentStatus, callback) => {
    db.query('UPDATE orders SET payment_status = ? WHERE id = ?', [paymentStatus, id], callback);
  },

  // Cập nhật trạng thái đơn hàng (Có xử lý hoàn tồn kho nếu hủy)
  updateStatus: (id, status, callback) => {
    if (status !== 'cancelled') {
      const query = 'UPDATE orders SET status = ? WHERE id = ?';
      return db.query(query, [status, id], callback);
    }

    db.beginTransaction((err) => {
      if (err) return callback(err);

      const rollback = (e) => db.rollback(() => callback(e));
      const commit = (payload) =>
        db.commit((commitErr) => {
          if (commitErr) return rollback(commitErr);
          callback(null, payload);
        });

      const updateOrderQuery = 'UPDATE orders SET status = "cancelled" WHERE id = ?';
      db.query(updateOrderQuery, [id], (orderErr) => {
        if (orderErr) return rollback(orderErr);

        const getItemsQuery = 'SELECT product_id, quantity FROM order_items WHERE order_id = ?';
        db.query(getItemsQuery, [id], (itemErr, items) => {
          if (itemErr) return rollback(itemErr);

          const safeItems = Array.isArray(items) ? items : [];
          if (safeItems.length === 0) {
            return commit({ message: 'Cancelled without items' });
          }

          const refundStockQuery = 'UPDATE products SET stock = stock + ? WHERE id = ?';
          const processNext = (idx) => {
            if (idx >= safeItems.length) return commit({ message: 'Cancelled and stock refunded' });
            const item = safeItems[idx];
            db.query(refundStockQuery, [item.quantity, item.product_id], (refundErr) => {
              if (refundErr) return rollback(refundErr);
              processNext(idx + 1);
            });
          };

          processNext(0);
        });
      });
    });
  },

  // Tạo đơn hàng mới (Dùng transaction)
  create: (orderData, items, callback) => {
    db.beginTransaction((err) => {
      if (err) return callback(err);

      const orderQuery = 'INSERT INTO orders (user_id, customer_id, total_price, status) VALUES (?, ?, ?, ?)';
      const orderParams = [orderData.user_id || null, orderData.customer_id || null, orderData.total_price, 'pending'];

      db.query(orderQuery, orderParams, (orderErr, result) => {
        if (orderErr) {
          return db.rollback(() => callback(orderErr));
        }

        const orderId = result.insertId;
        const itemQuery = 'INSERT INTO order_items (order_id, product_id, quantity) VALUES ?';
        const itemValues = items.map(item => [orderId, item.product_id, item.quantity]);

        db.query(itemQuery, [itemValues], (itemErr) => {
          if (itemErr) {
            return db.rollback(() => callback(itemErr));
          }

          // Cập nhật tồn kho (Stock) của từng sản phẩm - Đồng thời kiểm tra để stock luôn >= 0
          let stockErrors = 0;
          let stockProcessed = 0;

          items.forEach(item => {
            // Sử dụng WHERE stock >= ? để đảm bảo không trừ quá số lượng tồn
            db.query(
              'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
              [item.quantity, item.product_id, item.quantity],
              (stockErr, stockResult) => {
                stockProcessed++;
                
                if (stockErr) {
                  stockErrors++;
                } else if (stockResult.affectedRows === 0) {
                  // Nếu không có hàng nào bị ảnh hưởng, có nghĩa là stock < item.quantity
                  stockErrors++;
                }

                if (stockProcessed === items.length) {
                  if (stockErrors > 0) {
                    return db.rollback(() => callback(new Error('Một số sản phẩm không đủ hàng tồn kho!')));
                  }
                  db.commit((commitErr) => {
                    if (commitErr) {
                      return db.rollback(() => callback(commitErr));
                    }
                    callback(null, result);
                  });
                }
              }
            );
          });
        });
      });
    });
  }
};

module.exports = Order;
