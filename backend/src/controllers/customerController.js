const Customer = require('../models/customerModel');

const normalizePhone = (v) => String(v || '').trim();

exports.getAllCustomers = (req, res) => {
  const filters = { q: req.query.q || '' };
  Customer.getAll(filters, (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server khi tải khách hàng' });
    res.json(results);
  });
};

exports.getCustomerById = (req, res) => {
  Customer.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server khi tải khách hàng' });
    if (!results || results.length === 0) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    res.json(results[0]);
  });
};

exports.createCustomer = (req, res) => {
  const { name, birthday, address, gender } = req.body;
  const phone = normalizePhone(req.body.phone);

  if (!name || !String(name).trim()) return res.status(400).json({ message: 'Vui lòng nhập tên khách hàng' });
  if (!phone) return res.status(400).json({ message: 'Vui lòng nhập số điện thoại' });

  Customer.getByPhone(phone, (err, exists) => {
    if (err) return res.status(500).json({ message: 'Lỗi server khi kiểm tra số điện thoại' });
    if (exists && exists.length > 0) return res.status(400).json({ message: 'Số điện thoại đã tồn tại' });

    Customer.create({ name: String(name).trim(), birthday, phone, address, gender }, (createErr, result) => {
      if (createErr) {
        if (createErr.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Số điện thoại đã tồn tại' });
        return res.status(500).json({ message: 'Lỗi server khi tạo khách hàng' });
      }
      res.status(201).json({ message: 'Created', id: result.insertId });
    });
  });
};

exports.updateCustomer = (req, res) => {
  const id = req.params.id;
  const { name, birthday, address, gender, isDeleted } = req.body;
  const phone = normalizePhone(req.body.phone);

  if (!name || !String(name).trim()) return res.status(400).json({ message: 'Vui lòng nhập tên khách hàng' });
  if (!phone) return res.status(400).json({ message: 'Vui lòng nhập số điện thoại' });

  Customer.getByPhoneExceptId(phone, id, (err, exists) => {
    if (err) return res.status(500).json({ message: 'Lỗi server khi kiểm tra số điện thoại' });
    if (exists && exists.length > 0) return res.status(400).json({ message: 'Số điện thoại đã tồn tại' });

    Customer.update(id, { name: String(name).trim(), birthday, phone, address, gender, is_deleted: isDeleted }, (updateErr, result) => {
      if (updateErr) {
        console.error('UPDATE ERROR:', updateErr);
        return res.status(500).json({ message: 'Lỗi server khi cập nhật khách hàng' });
      }
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
      res.json({ message: 'Updated' });
    });
  });
};

exports.deleteCustomer = (req, res) => {
  Customer.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ message: 'Lỗi server khi xóa khách hàng' });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    res.json({ message: 'Deleted' });
  });
};

exports.moveCustomerToTrash = (req, res) => {
  Customer.softDelete(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ message: 'Lỗi server khi chuyển khách hàng vào thùng rác' });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    res.json({ message: 'Moved to trash' });
  });
};

exports.restoreCustomer = (req, res) => {
  Customer.restore(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ message: 'Lỗi server khi khôi phục khách hàng' });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    res.json({ message: 'Restored' });
  });
};
