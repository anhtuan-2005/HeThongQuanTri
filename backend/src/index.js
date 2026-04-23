const express = require("express");
const cors = require("cors");

const db = require("./config/db");

const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");

const app = express();

app.use(cors());
app.use(express.json());

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });

const getDbName = () => process.env.DB_NAME || "appdb";

const columnExists = async (tableName, columnName) => {
  const res = await queryAsync(
    `
      SELECT 1 as ok
      FROM information_schema.columns
      WHERE table_schema = ?
        AND table_name = ?
        AND column_name = ?
      LIMIT 1
    `,
    [getDbName(), tableName, columnName]
  );
  return Array.isArray(res) && res.length > 0;
};

const ensureColumn = async (tableName, columnName, columnDefinitionSql) => {
  const exists = await columnExists(tableName, columnName);
  if (exists) return;
  await queryAsync(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinitionSql}`);
};

const ensureIndex = async (createIndexSql) => {
  try {
    await queryAsync(createIndexSql);
  } catch (_e) {
    void _e;
  }
};

const ensureSchema = async () => {
  try {
    await queryAsync(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        birthday DATE NULL,
        phone VARCHAR(30) NOT NULL,
        address VARCHAR(500) NULL,
        gender ENUM('male','female','other') NOT NULL DEFAULT 'other',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await ensureIndex("CREATE UNIQUE INDEX idx_customers_phone ON customers(phone)");
    await ensureColumn("customers", "is_deleted", "TINYINT(1) NOT NULL DEFAULT 0");

    await ensureColumn("products", "status", "ENUM('active','inactive') NOT NULL DEFAULT 'active'");

    await ensureColumn("orders", "payment_status", "ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid'");
    await ensureColumn("orders", "customer_id", "INT NULL");
    try {
      await queryAsync(
        "ALTER TABLE `orders` MODIFY COLUMN `status` ENUM('pending','confirmed','shipping','completed','cancelled') NOT NULL DEFAULT 'pending'"
      );
    } catch (e) {
      console.log("❌ Orders status enum ensure error:", e.message || e);
    }

    await ensureColumn("users", "username", "VARCHAR(191) NULL");
    await ensureColumn("users", "avatar", "VARCHAR(500) NULL");

    await queryAsync(
      "UPDATE users SET username = CONCAT('user', id) WHERE username IS NULL OR username = ''"
    );
    await ensureIndex("CREATE UNIQUE INDEX idx_users_username ON users(username)");
  } catch (e) {
    console.log("❌ Schema ensure error:", e.message || e);
  }
};

/* route test server */
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Backend API đang chạy",
    database: "✅ MySQL connected",
    api_products: "http://localhost:3000/api/products",
    api_users: "http://localhost:3000/api/users",
    api_orders: "http://localhost:3000/api/orders",
    api_analytics_overview: "http://localhost:3000/api/analytics/overview",
    api_auth_login: "http://localhost:3000/api/auth/login"
  });
});

/* routes API */
app.use("/api/auth", authRoutes);
app.use("/api", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/customers", customerRoutes);

/* start server */
app.listen(3000, () => {
  ensureSchema();
  console.log("🚀 Server running on port 3000");
});
