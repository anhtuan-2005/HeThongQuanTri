const Analytics = require('../models/analyticsModel');

exports.getOverview = (_req, res) => {
  const tasks = [
    new Promise((resolve, reject) => {
      Analytics.getRevenueTotal((err, rows) => {
        if (err) return reject(err);
        resolve(rows[0] || { revenue_total: 0 });
      });
    }),
    new Promise((resolve, reject) => {
      Analytics.getCompletedCount((err, rows) => {
        if (err) return reject(err);
        resolve(rows[0] || { orders_completed_count: 0 });
      });
    }),
    new Promise((resolve, reject) => {
      Analytics.getOrdersByStatus((err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    }),
    new Promise((resolve, reject) => {
      Analytics.getRevenueByDayLast7((err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    }),
    new Promise((resolve, reject) => {
      Analytics.getProductsCount((err, rows) => {
        if (err) return reject(err);
        resolve(rows[0] || { products_count: 0 });
      });
    }),
    new Promise((resolve, reject) => {
      Analytics.getUsersCount((err, rows) => {
        if (err) return reject(err);
        resolve(rows[0] || { users_count: 0 });
      });
    }),
    new Promise((resolve, reject) => {
      Analytics.getCategoriesCount((err, rows) => {
        if (err) return reject(err);
        resolve(rows[0] || { categories_count: 0 });
      });
    }),
    new Promise((resolve, reject) => {
      Analytics.getOrdersCount((err, rows) => {
        if (err) return reject(err);
        resolve(rows[0] || { orders_count: 0 });
      });
    }),
    new Promise((resolve, reject) => {
      Analytics.getAOV((err, rows) => {
        if (err) return reject(err);
        resolve(rows[0] || { aov: 0 });
      });
    }),
    new Promise((resolve, reject) => {
      Analytics.getRecentOrders(5, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    }),
  ];

  Promise.all(tasks)
    .then(([rev, cnt, byStatus, byDay, products, users, categories, orders, aov, recent]) => {
      // Đảm bảo đủ các trạng thái chính, ngay cả khi số lượng là 0
      const allStatuses = ['pending', 'shipping', 'completed', 'cancelled'];
      const statusMap = new Map(byStatus.map(r => [r.status, Number(r.count)]));
      const fullStatusData = allStatuses.map(status => ({
        status: status,
        count: statusMap.get(status) || 0
      }));

      res.json({
        revenue_total: Number(rev.revenue_total || 0),
        orders_completed_count: Number(cnt.orders_completed_count || 0),
        orders_by_status: fullStatusData,
        revenue_by_day: byDay
          .map(r => ({ day: r.day, revenue: Number(r.revenue || 0) })),
        products_count: Number(products.products_count || 0),
        users_count: Number(users.users_count || 0),
        categories_count: Number(categories.categories_count || 0),
        orders_count: Number(orders.orders_count || 0),
        aov: Number(aov.aov || 0),
        recent_orders: recent.map(r => ({
          id: r.id,
          customer_name: r.customer_name,
          total_price: Number(r.total_price || 0),
          status: r.status,
          created_at: r.created_at
        }))
      });
    })
    .catch((err) => {
      console.error('Analytics error:', err);
      res.status(500).json({ message: 'Lỗi server khi tính thống kê' });
    });
};

exports.getRevenueSeries = (req, res) => {
  const granularity = (req.query.granularity || 'day').toString().toLowerCase();
  const allowed = ['day', 'week', 'month', 'year'];
  const g = allowed.includes(granularity) ? granularity : 'day';
  const from = req.query.from ? String(req.query.from) : null;
  const to = req.query.to ? String(req.query.to) : null;

  const isValidDate = (s) => !Number.isNaN(Date.parse(s));
  const fromValid = from && isValidDate(from) ? new Date(from) : null;
  const toValid = to && isValidDate(to) ? new Date(to) : null;

  // Nếu không có range tùy chọn, tạo mặc định cho 7 ngày gần nhất để fill zero
  let defaultFrom = null;
  let defaultTo = null;
  if (!fromValid || !toValid) {
    if (g === 'day') {
      defaultTo = new Date();
      defaultFrom = new Date();
      defaultFrom.setDate(defaultTo.getDate() - 6);
    }
  }

  // Normalize to 'YYYY-MM-DD' boundaries
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  let fromStr = null;
  let toStr = null;
  if (fromValid && toValid) {
    // inclusive range: start 00:00:00 to end 23:59:59
    const f = new Date(fromValid);
    f.setHours(0, 0, 0, 0);
    const t = new Date(toValid);
    t.setHours(23, 59, 59, 999);
    
    fromStr = fmt(f);
    toStr = fmt(t) + ' 23:59:59';
  }

  const yearWeek = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    const y = d.getUTCFullYear();
    return `${y}${String(weekNo).padStart(2, '0')}`;
  };

  const buildLabels = (gKey, start, end) => {
    if (!start || !end) return null;
    const labels = [];
    const cur = new Date(start.getTime());
    cur.setHours(0, 0, 0, 0);
    const stop = new Date(end.getTime());
    stop.setHours(0, 0, 0, 0);
    while (cur <= stop) {
      if (gKey === 'day') {
        labels.push(fmt(cur));
        cur.setDate(cur.getDate() + 1);
      } else if (gKey === 'week') {
        labels.push(yearWeek(cur));
        cur.setDate(cur.getDate() + 7);
      } else if (gKey === 'month') {
        labels.push(`${cur.getFullYear()}-${pad(cur.getMonth() + 1)}`);
        cur.setMonth(cur.getMonth() + 1);
      } else if (gKey === 'year') {
        labels.push(`${cur.getFullYear()}`);
        cur.setFullYear(cur.getFullYear() + 1);
      }
    }
    // Deduplicate (in case range steps overlap)
    return [...new Set(labels)];
  };

  Analytics.getRevenueByGranularity(g, fromStr, toStr, (err, rows) => {
    if (err) {
      console.error('getRevenueSeries error:', err);
      return res.status(500).json({ message: 'Lỗi khi tính doanh thu theo chu kỳ' });
    }

    // Chuẩn hóa dữ liệu từ DB về format nhãn thống nhất
    let series = rows.map(r => {
      let label = r.label;
      if (label instanceof Date) {
        if (g === 'day') label = fmt(label);
        else if (g === 'week') label = yearWeek(label);
        else if (g === 'month') label = `${label.getFullYear()}-${pad(label.getMonth() + 1)}`;
        else if (g === 'year') label = `${label.getFullYear()}`;
      }
      return { label: String(label), revenue: Number(r.revenue || 0) };
    });

    // Fill zero for missing buckets
    const startObj = fromValid || defaultFrom;
    const endObj = toValid || defaultTo;

    if (startObj && endObj) {
      const labels = buildLabels(g, startObj, endObj);
      if (labels && labels.length > 0) {
        const dataMap = new Map(series.map(s => [String(s.label), s.revenue]));
        series = labels.map(lb => ({ label: lb, revenue: dataMap.get(lb) ?? 0 }));
      }
    }

    return res.json({ granularity: g, series });
  });
};

exports.getTopProducts = (req, res) => {
  const metric = String(req.query.metric || 'quantity').toLowerCase();
  const limit = Number(req.query.limit) || 5;
  const allowed = ['quantity', 'revenue'];
  const m = allowed.includes(metric) ? metric : 'quantity';

  Analytics.getTopProducts(m, limit, (err, rows) => {
    if (err) {
      console.error('getTopProducts error:', err);
      return res.status(500).json({ message: 'Lỗi khi tính top sản phẩm' });
    }
    res.json({
      metric: m,
      items: rows.map(r => ({
        id: r.id,
        name: r.name,
        total_qty: Number(r.total_qty || 0),
        total_revenue: Number(r.total_revenue || 0),
      }))
    });
  });
};

exports.getRevenueByCategory = (_req, res) => {
  Analytics.getRevenueByCategory((err, rows) => {
    if (err) {
      console.error('getRevenueByCategory error:', err);
      return res.status(500).json({ message: 'Lỗi khi tính doanh thu theo danh mục' });
    }
    res.json(rows.map(r => ({
      id: r.id,
      category_name: r.category_name,
      revenue: Number(r.revenue || 0),
    })));
  });
};

exports.getLowStockProducts = (req, res) => {
  const threshold = Number(req.query.threshold) || 5;
  Analytics.getLowStockProducts(threshold, (err, rows) => {
    if (err) {
      console.error('getLowStockProducts error:', err);
      return res.status(500).json({ message: 'Lỗi khi lấy danh sách tồn kho thấp' });
    }
    res.json(rows.map(r => ({
      id: r.id,
      name: r.name,
      stock: Number(r.stock || 0),
      category_name: r.category_name || null,
    })));
  });
};
