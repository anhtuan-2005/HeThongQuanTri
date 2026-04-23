const db = require('../config/db');

const Analytics = {
  getRevenueTotal: (callback) => {
    const q = "SELECT COALESCE(SUM(total_price),0) AS revenue_total FROM orders WHERE status = 'completed'";
    db.query(q, callback);
  },

  getCompletedCount: (callback) => {
    const q = "SELECT COUNT(*) AS orders_completed_count FROM orders WHERE status = 'completed'";
    db.query(q, callback);
  },

  getOrdersByStatus: (callback) => {
    const q = "SELECT status, COUNT(*) AS count FROM orders GROUP BY status";
    db.query(q, callback);
  },

  getRevenueByDayLast7: (callback) => {
    const q = `
      SELECT DATE(created_at) AS day, SUM(total_price) AS revenue
      FROM orders
      WHERE status = 'completed' AND created_at >= (CURDATE() - INTERVAL 6 DAY)
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `;
    db.query(q, callback);
  },

  getRevenueByGranularity: (granularity, fromDate, toDate, callback) => {
    let expr = '';
    let whereWindow = '';
    let orderBy = 'ORDER BY label ASC';

    switch (granularity) {
      case 'day':
        expr = "DATE(created_at)";
        whereWindow = "created_at >= (CURDATE() - INTERVAL 6 DAY)";
        break;
      case 'week':
        // Use YEARWEEK for stable week grouping
        expr = "YEARWEEK(created_at, 3)";
        whereWindow = "created_at >= (CURDATE() - INTERVAL 84 DAY)";
        orderBy = "ORDER BY label ASC";
        break;
      case 'month':
        expr = "DATE_FORMAT(created_at, '%Y-%m')";
        whereWindow = "created_at >= (DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-01'))";
        orderBy = "ORDER BY label ASC";
        break;
      case 'year':
        expr = "YEAR(created_at)";
        whereWindow = "created_at >= (DATE_FORMAT(CURDATE() - INTERVAL 4 YEAR, '%Y-01-01'))";
        orderBy = "ORDER BY label ASC";
        break;
      default:
        expr = "DATE(created_at)";
        whereWindow = "created_at >= (CURDATE() - INTERVAL 29 DAY)";
    }

    // If custom date range provided, override default window
    const params = [];
    if (fromDate && toDate) {
      whereWindow = "created_at BETWEEN ? AND ?";
      params.push(fromDate, toDate);
    }

    const q = `
      SELECT ${expr} AS label, SUM(total_price) AS revenue
      FROM orders
      WHERE status = 'completed' AND ${whereWindow}
      GROUP BY ${expr}
      ${orderBy}
    `;
    db.query(q, params, callback);
  },

  getProductsCount: (callback) => {
    db.query("SELECT COUNT(*) AS products_count FROM products", callback);
  },

  getUsersCount: (callback) => {
    db.query("SELECT COUNT(*) AS users_count FROM users", callback);
  },

  getCategoriesCount: (callback) => {
    db.query("SELECT COUNT(*) AS categories_count FROM categories", callback);
  },

  getOrdersCount: (callback) => {
    db.query("SELECT COUNT(*) AS orders_count FROM orders", callback);
  },

  getAOV: (callback) => {
    const q = "SELECT COALESCE(AVG(total_price),0) AS aov FROM orders WHERE status = 'completed'";
    db.query(q, callback);
  },

  getRecentOrders: (limit = 5, callback) => {
    const q = `
      SELECT o.id, u.name as customer_name, o.total_price, o.status, o.created_at
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT ?
    `;
    db.query(q, [Number(limit) || 5], callback);
  },

  getTopProducts: (metric = 'quantity', limit = 5, callback) => {
    const orderBy = metric === 'revenue' ? 'total_revenue' : 'total_qty';
    const q = `
      SELECT p.id, p.name, 
             COALESCE(SUM(oi.quantity),0) AS total_qty,
             COALESCE(SUM(oi.quantity * p.price),0) AS total_revenue
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      WHERE o.status = 'completed'
      GROUP BY p.id, p.name
      ORDER BY ${orderBy} DESC
      LIMIT ?
    `;
    db.query(q, [Number(limit) || 5], callback);
  },

  getRevenueByCategory: (callback) => {
    const q = `
      SELECT c.id, c.name AS category_name,
             COALESCE(SUM(oi.quantity * p.price),0) AS revenue
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id AND o.status = 'completed'
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `;
    db.query(q, callback);
  },

  getLowStockProducts: (threshold = 5, callback) => {
    const q = `
      SELECT p.id, p.name, p.stock, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.stock < ?
      ORDER BY p.stock ASC, p.id ASC
    `;
    db.query(q, [Number(threshold) || 5], callback);
  }
};

module.exports = Analytics;
