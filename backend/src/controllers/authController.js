const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';

exports.register = async (req, res) => {
  const { name, email, password, username, avatar } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ thông tin: name, email, password." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    User.create({ name, email, username: username || null, avatar: avatar || null, password: hashedPassword, role: 'staff' }, (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Email này đã được sử dụng trong hệ thống.' });
        }
        return res.status(500).json({ message: 'Lỗi Database khi đăng ký: ' + err.message });
      }
      const generatedUsername = username && String(username).trim() ? String(username).trim() : `user${result.insertId}`;
      db.query(
        "UPDATE users SET username = COALESCE(NULLIF(username,''), ?) WHERE id = ?",
        [generatedUsername, result.insertId],
        () => {}
      );
      return res.status(201).json({ message: 'Đăng ký tài khoản thành công', id: result.insertId });
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

exports.login = (req, res) => {
  const { username, email, password } = req.body;
  const identifier = String(username || email || '').trim();

  if (!identifier || !password) {
    return res.status(400).json({ message: "Vui lòng cung cấp username/email và mật khẩu." });
  }

  db.query("SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1", [identifier, identifier], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (!results || results.length === 0) return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' });

    const user = results[0];

    // Chặn đăng nhập nếu tài khoản bị khóa
    if (user.status === 'locked') {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin để được hỗ trợ.' });
    }
    
    // Kiểm tra mật khẩu: Hỗ trợ cả bcrypt (mới) và plain text (cũ)
    let isMatch = false;
    if (user.password.startsWith('$2') || user.password.length >= 60) {
      // Có vẻ là mật khẩu đã mã hóa bcrypt
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Mật khẩu cũ dạng thô (plain text)
      isMatch = (password === user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        role: user.role
      }
    });
  });
};

exports.getMe = (req, res) => {
  // Middleware auth sẽ gán req.user từ token
  User.getById(req.user.id, (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    
    res.json(results[0]);
  });
};

exports.updateProfile = (req, res) => {
  const { name, avatar } = req.body;
  if (!name) return res.status(400).json({ message: 'Tên không được để trống' });

  User.updateProfile(req.user.id, name, avatar, (err) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json({ message: 'Cập nhật hồ sơ thành công', name, avatar: avatar || null });
  });
};

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới' });

  User.getByEmail(req.user.email || '', async (err, results) => {
    // Nếu req.user không có email (do jwt payload cũ), ta cần lấy lại user từ ID
    User.getById(req.user.id, async (err2, results2) => {
      const user = results2[0];
      if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

      // Lấy mật khẩu từ DB để so sánh (getById chỉ lấy info cơ bản, cần getByEmail hoặc query riêng)
      db.query("SELECT password FROM users WHERE id = ?", [req.user.id], async (err3, passResults) => {
        const dbPassword = passResults[0].password;
        
        let isMatch = false;
        if (dbPassword.startsWith('$2') || dbPassword.length >= 60) {
          isMatch = await bcrypt.compare(oldPassword, dbPassword);
        } else {
          isMatch = (oldPassword === dbPassword);
        }

        if (!isMatch) return res.status(400).json({ message: 'Mật khẩu cũ không chính xác' });

        // Kiểm tra mật khẩu mới không được trùng mật khẩu cũ
        if (oldPassword === newPassword) {
          return res.status(400).json({ message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        User.updatePassword(req.user.id, hashedNewPassword, (updateErr) => {
          if (updateErr) return res.status(500).json({ message: 'Lỗi khi cập nhật mật khẩu' });
          res.json({ message: 'Đổi mật khẩu thành công' });
        });
      });
    });
  });
};
