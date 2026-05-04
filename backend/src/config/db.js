const mysql = require("mysql2");
require("dotenv").config();

// Thêm log này để kiểm tra xem Vercel đã đọc được biến chưa
console.log("Checking DB Port:", process.env.DB_PORT); 

const db = mysql.createPool({ // Chuyển từ createConnection sang createPool để ổn định hơn
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 55683, // Ép kiểu số cho Port
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db.promise(); // Dùng promise để tránh lỗi callback