const express = require("express");
const router = express.Router();
const { getPool, sql } = require("../db");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const logAction = require("../helpers/logAction");

// GET /api/taikhoan  – chỉ admin
router.get("/", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT DISTINCT
        tk.MaTK,
        tk.TenDangNhap,

        COALESCE(
          sv.HoTen,
          gv.HoTen,
          CASE
            WHEN tk.MaVaiTro = 'admin' THEN N'Quản trị viên'
          END
        ) AS HoTen,

        tk.TrangThai,
        vt.TenVaiTro

      FROM TAIKHOAN tk

      JOIN VAITRO vt
          ON tk.MaVaiTro = vt.MaVaiTro

      LEFT JOIN GIANGVIEN gv
          ON tk.MaTK = gv.MaTK

      LEFT JOIN SINHVIEN sv
          ON tk.MaTK = sv.MaTK

      WHERE
          gv.MaTK IS NOT NULL
          OR sv.MaTK IS NOT NULL
          OR tk.MaVaiTro = 'admin'

      ORDER BY tk.MaTK
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// PUT /api/taikhoan/:id/khoa  – admin khoá/mở tài khoản
router.put("/:id/khoa", verifyToken, requireRole("admin"), async (req, res) => {
  const { TrangThai } = req.body; // 'Hoạt động' | 'Bị khóa'
  try {
    const pool = await getPool();
    await pool
      .request()
      .input("id", sql.NVarChar, req.params.id)
      .input("TrangThai", sql.NVarChar, TrangThai)
      .query(`UPDATE TAIKHOAN SET TrangThai=@TrangThai WHERE MaTK=@id`);
    await logAction(
      req.user.maTK,
      TrangThai === "Bị khóa" ? "Khóa tài khoản" : "Mở khóa tài khoản",
      `Tài khoản ${req.params.id} → ${TrangThai}`,
    );
    res.json({ message: "Cập nhật trạng thái thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
