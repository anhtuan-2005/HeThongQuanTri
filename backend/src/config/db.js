const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "appdb",
  port: process.env.DB_PORT || 3306 // Thêm dòng này để nhận cổng từ Railway
});

db.connect((err) => {
  if (err) {
    console.log("❌ DB Error", err);
  } else {
    console.log("✅ MySQL Connected");
  }
});

module.exports = db;