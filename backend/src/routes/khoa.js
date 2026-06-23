// backend/src/routes/khoa.js
const express = require("express");
const router = express.Router();
const { getPool } = require("../db");
const { verifyToken } = require("../middleware/auth");

// GET /api/khoa  – Trả về danh sách khoa (tất cả role đã đăng nhập)
router.get("/", verifyToken, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query(`SELECT MaKhoa, TenKhoa FROM KHOA ORDER BY TenKhoa`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
