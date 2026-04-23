const db = require('../config/db');

const User = {
  getAll: (callback) => {
    // Lấy danh sách users theo cấu trúc: id, name, email, role, created_at, status
    // Bỏ qua hiển thị password cho an toàn
    const query = "SELECT id, name, email, username, avatar, role, status, created_at FROM users ORDER BY id DESC";
    db.query(query, callback);
  },

  // Cập nhật trạng thái Khoá / Mở khóa cho tài khoản nhân viên
  updateStatus: (id, status, callback) => {
    // Chặn cập nhật trạng thái của các tài khoản có role là 'admin' ở cấp độ CSDL
    const query = "UPDATE users SET status = ? WHERE id = ? AND role != 'admin'";
    db.query(query, [status, id], callback);
  },

  // Thêm tài khoản nhân viên/admin mới
  create: (userData, callback) => {
    const query = "INSERT INTO users (name, email, username, password, role, status, avatar) VALUES (?, ?, ?, ?, ?, 'active', ?)";
    db.query(
      query,
      [userData.name, userData.email, userData.username || null, userData.password, userData.role, userData.avatar || null],
      callback
    );
  },

  // Lấy thông tin người dùng theo email (phục vụ đăng nhập)
  getByEmail: (email, callback) => {
    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [email], callback);
  },

  // Lấy thông tin người dùng theo ID (phục vụ middleware auth)
  getById: (id, callback) => {
    const query = "SELECT id, name, email, username, avatar, role, status, created_at FROM users WHERE id = ?";
    db.query(query, [id], callback);
  },

  // Cập nhật thông tin cơ bản
  updateProfile: (id, name, avatar, callback) => {
    const query = "UPDATE users SET name = ?, avatar = ? WHERE id = ?";
    db.query(query, [name, avatar || null, id], callback);
  },

  // Cập nhật mật khẩu
  updatePassword: (id, hashedPassword, callback) => {
    const query = "UPDATE users SET password = ? WHERE id = ?";
    db.query(query, [hashedPassword, id], callback);
  }
};

module.exports = User;
