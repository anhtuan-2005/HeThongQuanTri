const Product = require("../models/productModel");

const isValidHttpUrl = (value) => {
  const v = String(value || '').trim();
  if (!v) return true;
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (_e) {
    void _e;
    return false;
  }
};

const normalizeStatus = (value) => {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return 'active';
  return v;
};

exports.getProducts = (req, res) => {
  const { q, category_id, minPrice, maxPrice } = req.query;
  const filters = {};
  if (typeof q === 'string' && q.trim()) filters.q = q.trim();
  const cid = Number(category_id);
  if (!Number.isNaN(cid)) filters.category_id = cid;
  const minP = Number(minPrice);
  if (!Number.isNaN(minP)) filters.minPrice = minP;
  const maxP = Number(maxPrice);
  if (!Number.isNaN(maxP)) filters.maxPrice = maxP;

  Product.getAll(filters, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.getProduct = (req, res) => {

  Product.getOne(req.params.id, (err, result) => {

    if (err) return res.status(500).json(err);

    res.json(result[0]);

  });

};

exports.createProduct = (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: "Vui lòng nhập tên sản phẩm" });
  }

  const status = normalizeStatus(req.body.status);
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: "Trạng thái sản phẩm không hợp lệ" });
  }
  if (!isValidHttpUrl(req.body.image)) {
    return res.status(400).json({ message: "Link ảnh không hợp lệ (chỉ chấp nhận http/https)" });
  }
  req.body.status = status;

  // Kiểm tra trùng tên sản phẩm (bao gồm cả sản phẩm trong thùng rác)
  const db = require("../config/db");
  db.query("SELECT id FROM products WHERE name = ?", [name], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length > 0) {
      return res.status(400).json({ message: "Tên sản phẩm này đã tồn tại trong hệ thống (có thể nằm trong Thùng rác)" });
    }

    Product.create(req.body, (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({
        message: "Created",
        id: result.insertId
      });
    });
  });
};

exports.updateProduct = (req, res) => {
  const { name, price, stock } = req.body;
  const productId = req.params.id;
  
  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ tên, giá và tồn kho" });
  }

  const status = normalizeStatus(req.body.status);
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: "Trạng thái sản phẩm không hợp lệ" });
  }
  if (!isValidHttpUrl(req.body.image)) {
    return res.status(400).json({ message: "Link ảnh không hợp lệ (chỉ chấp nhận http/https)" });
  }
  req.body.status = status;

  // Kiểm tra trùng tên sản phẩm khi cập nhật (loại trừ ID hiện tại)
  const db = require("../config/db");
  db.query("SELECT id FROM products WHERE name = ? AND id != ?", [name, productId], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length > 0) {
      return res.status(400).json({ message: "Tên sản phẩm này đã tồn tại trong hệ thống" });
    }

    Product.update(productId, req.body, (err, result) => {
      if (err) {
        console.error('Update product error:', err);
        return res.status(500).json({ message: 'Lỗi server khi cập nhật sản phẩm' });
      }
      res.json({ message: "Updated" });
    });
  });
};

exports.deleteProduct = (req, res) => {
  Product.delete(req.params.id, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Deleted" });
  });
};

exports.getTrash = (req, res) => {
  Product.getTrash((err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.restoreProduct = (req, res) => {
  Product.restore(req.params.id, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Restored" });
  });
};

exports.hardDeleteProduct = (req, res) => {
  Product.hardDelete(req.params.id, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Sản phẩm đã được ẩn khỏi giao diện" });
  });
};
