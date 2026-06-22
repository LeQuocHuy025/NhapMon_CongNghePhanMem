const express = require("express");
const router = express.Router();
const { getPool } = require("../db");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

router.get("/", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT pq.*, vt.TenVaiTro
      FROM PHANQUYEN pq
      JOIN VAITRO vt ON pq.MaVaiTro = vt.MaVaiTro
      ORDER BY pq.MaVaiTro
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
