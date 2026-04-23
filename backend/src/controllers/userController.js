const User = require('../models/userModel');
const bcrypt = require('bcrypt'); // Thêm thư viện mã hóa mật khẩu

exports.getAllUsers = (req, res) => {
  User.getAll((err, results) => {
    if (err) {
      console.error('Lỗi truy vấn Users:', err);
      return res.status(500).json({ message: 'Lỗi server khi lấy người dùng' });
    }
    res.json(results);
  });
};

exports.updateUserStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Giả sử req.user chứa dữ liệu của admin đang đăng nhập (được decode từ JWT Token)
  // Ngăn chặn admin tự khóa tài khoản của chính mình
  if (req.user && req.user.id === parseInt(id) && status === 'locked') {
    return res.status(403).json({ message: "Hành động bị từ chối: Bạn không thể tự khóa tài khoản của chính mình!" });
  }

  if (!status || !['active', 'locked'].includes(status)) {
    return res.status(400).json({ message: "Trạng thái không hợp lệ. Chỉ chấp nhận 'active' hoặc 'locked'." });
  }

  User.updateStatus(id, status, (err, result) => {
    if (err) {
      console.error('Lỗi khi cập nhật trạng thái User:', err);
      return res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(403).json({ message: 'Không tìm thấy người dùng hoặc bạn không có quyền khóa tài khoản Admin khác!' });
    }

    res.json({ message: 'Cập nhật trạng thái thành công', status });
  });
};

exports.createUser = async (req, res) => {
  const { name, email, password, role, username, avatar } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ thông tin: name, email, password." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const validRoles = ['admin', 'staff'];
    const finalRole = role && validRoles.includes(role) ? role : 'staff';

    const result = await new Promise((resolve, reject) => {
      User.create({ name, email, username: username || null, avatar: avatar || null, password: hashedPassword, role: finalRole }, (err, res2) => {
        if (err) return reject(err);
        resolve(res2);
      });
    });
    const db = require('../config/db');
    const generatedUsername = username && String(username).trim() ? String(username).trim() : `user${result.insertId}`;
    db.query(
      "UPDATE users SET username = COALESCE(NULLIF(username,''), ?) WHERE id = ?",
      [generatedUsername, result.insertId],
      () => {}
    );
    return res.status(201).json({ message: 'Tạo tài khoản thành công', id: result.insertId });
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email này đã được sử dụng trong hệ thống.' });
    }
    if (error && /role/i.test(error.message || '')) {
      return res.status(400).json({ message: "Giá trị role không hợp lệ. Chỉ chấp nhận 'admin' hoặc 'staff'." });
    }
    return res.status(500).json({ message: 'Lỗi Database: ' + (error?.message || 'Không xác định') });
  }
};
