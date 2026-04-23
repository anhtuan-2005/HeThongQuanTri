const Order = require('../models/orderModel');
const db = require('../config/db');

const normalizeOrderStatus = (value) => {
  const s = String(value || '').trim().toLowerCase();
  const map = {
    'chờ xác nhận': 'pending',
    'cho xac nhan': 'pending',
    'đã xác nhận': 'confirmed',
    'da xac nhan': 'confirmed',
    'đang giao': 'shipping',
    'dang giao': 'shipping',
    'hoàn thành': 'completed',
    'hoan thanh': 'completed',
    'đã hủy': 'cancelled',
    'da huy': 'cancelled',
    'đã huỷ': 'cancelled',
    'da huỷ': 'cancelled',
    'hủy': 'cancelled',
    'huỷ': 'cancelled',
    'canceled': 'cancelled'
  };
  return map[s] || s;
};

exports.getAllOrders = (req, res) => {
  const filters = {
    search: req.query.search || null,
    status: req.query.status ? normalizeOrderStatus(req.query.status) : null,
    fromDate: req.query.fromDate || null,
    toDate: req.query.toDate || null
  };

  Order.getAll(filters, (err, results) => {
    if (err) {
      console.error('Lỗi truy vấn Orders:', err);
      return res.status(500).json({ message: 'Lỗi server khi lấy đơn hàng' });
    }
    const safe = Array.isArray(results) ? results : [];
    const normalized = safe.map((o) => ({
      ...o,
      status: normalizeOrderStatus(o.status),
      payment_status: o.payment_status || 'unpaid'
    }));
    res.json(normalized);
  });
};

exports.getOrderById = (req, res) => {
  const orderId = req.params.id;
  Order.getById(orderId, (err, results) => {
    if (err) {
      console.error('Lỗi khi lấy chi tiết đơn hàng:', err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }
    
    // Parse lại chuỗi product_details thành mảng Object cho dễ dùng ở Frontend
    const orderData = results[0];
    if (orderData.product_details) {
       const pdArray = orderData.product_details.split('||');
       orderData.parsed_products = pdArray.map(item => {
           // VD item: "Iphone 15 (x2) - 30000000đ"
           return item; 
       });
    } else {
       orderData.parsed_products = [];
    }

    orderData.status = normalizeOrderStatus(orderData.status);
    orderData.payment_status = orderData.payment_status || 'unpaid';
    res.status(200).json(orderData);
  });
};

exports.updateOrderStatus = (req, res) => {
  const { id } = req.params;
  const rawStatus = req.body?.status;
  const status = normalizeOrderStatus(rawStatus);
  
  if (!status) {
      return res.status(400).json({ message: 'Thiếu thông tin trạng thái cần cập nhật' });
  }

  // Danh sách các trạng thái hợp lệ
  const validStatuses = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  }

  db.query('SELECT status FROM orders WHERE id = ? LIMIT 1', [id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    const currentStatus = normalizeOrderStatus(rows[0].status);

    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
      return res.status(400).json({ message: 'Đơn hàng này đã đóng, không thể thay đổi trạng thái nữa!' });
    }

    if (currentStatus === status) {
      return res.status(200).json({ message: 'Không có thay đổi trạng thái', status });
    }

    const transitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['shipping', 'cancelled'],
      shipping: ['completed', 'cancelled'],
    };

    const allowed = transitions[currentStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Luồng trạng thái không hợp lệ' });
    }

    Order.updateStatus(id, status, (updateErr) => {
      if (updateErr) {
        console.error('Lỗi cập nhật trạng thái đơn hàng:', updateErr);
        return res.status(500).json({ message: 'Lỗi server' });
      }
      res.status(200).json({ message: 'Cập nhật trạng thái thành công', status });
    });
  });
};

exports.updateOrderPaymentStatus = (req, res) => {
  const { id } = req.params;
  const rawPaymentStatus = String(req.body?.payment_status || '').trim().toLowerCase();
  const validPaymentStatuses = ['paid', 'unpaid'];

  if (!validPaymentStatuses.includes(rawPaymentStatus)) {
    return res.status(400).json({ message: 'Trạng thái thanh toán không hợp lệ' });
  }

  db.query('SELECT id, payment_status FROM orders WHERE id = ? LIMIT 1', [id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    Order.updatePaymentStatus(id, rawPaymentStatus, (updateErr) => {
      if (updateErr) return res.status(500).json({ message: 'Lỗi server' });
      res.json({
        message: 'Cập nhật trạng thái thanh toán thành công',
        payment_status: rawPaymentStatus
      });
    });
  });
};

exports.createOrder = (req, res) => {
  const { user_id, customer_id, items, total_price } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Đơn hàng phải có ít nhất một sản phẩm' });
  }

  if (!total_price || total_price <= 0) {
    return res.status(400).json({ message: 'Tổng tiền không hợp lệ' });
  }

  const orderData = { user_id, customer_id, total_price };

  Order.create(orderData, items, (err, result) => {
    if (err) {
      console.error('Lỗi khi tạo đơn hàng:', err);
      return res.status(500).json({ message: 'Lỗi server khi tạo đơn hàng: ' + (err.message || 'Không xác định') });
    }
    res.status(201).json({ message: 'Tạo đơn hàng thành công', orderId: result.insertId });
  });
};
