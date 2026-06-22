const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { getPool, sql } = require("../db");
const { verifyToken } = require("../middleware/auth");
const logAction = require("../helpers/logAction");

/**
 * GET /api/auth/profile
 * Trả về thông tin tài khoản hiện tại, được lọc theo vai trò.
 *
 * Thông tin LUÔN trả về (mọi role):
 *   TenDangNhap, TrangThai (tài khoản), role
 *
 * Sinh viên (sv):
 *   + HoTen, Email, SDT, NgaySinh, GioiTinh, MaSV, TenLop, TenKhoa
 *   + thongKe: { tongDangKy, daDuyet, choDuyet, giai }
 *
 * Giảng viên / Cán bộ (gv, cb):
 *   + HoTen, Email, SDT, MaGV, TenKhoa
 *
 * Admin:
 *   + chỉ TenDangNhap, TrangThai, role  (không lộ thêm)
 */
router.get("/profile", verifyToken, async (req, res) => {
  const { maTK, role } = req.user;

  try {
    const pool = await getPool();

    // =========================
    // THÔNG TIN TÀI KHOẢN
    // =========================

    const tkResult = await pool.request().input("MaTK", sql.VarChar, maTK)
      .query(`
        SELECT
          tk.TenDangNhap,
          tk.TrangThai,
          vt.MaVaiTro AS role
        FROM TAIKHOAN tk
        JOIN VAITRO vt
          ON tk.MaVaiTro = vt.MaVaiTro
        WHERE tk.MaTK = @MaTK
      `);

    if (tkResult.recordset.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    const base = tkResult.recordset[0];

    // =========================
    // SINH VIÊN
    // =========================

    if (role === "sv") {
      const svResult = await pool.request().input("MaTK", sql.VarChar, maTK)
        .query(`
          SELECT
            sv.MaSV,
            sv.HoTen,
            sv.Email,
            sv.SDT,
            sv.NgaySinh,
            sv.GioiTinh,
            l.TenLop,
            k.TenKhoa
          FROM SINHVIEN sv
          LEFT JOIN LOP l
            ON sv.MaLop = l.MaLop
          LEFT JOIN KHOA k
            ON l.MaKhoa = k.MaKhoa
          WHERE sv.MaTK = @MaTK
        `);

      return res.json({
        ...base,
        ...(svResult.recordset[0] || {}),
      });
    }

    // =========================
    // GIẢNG VIÊN / CÁN BỘ
    // =========================

    if (role === "gv" || role === "cb") {
      const gvResult = await pool.request().input("MaTK", sql.VarChar, maTK)
        .query(`
          SELECT
            gv.MaGV,
            gv.HoTen,
            gv.Email,
            gv.SDT,
            k.TenKhoa
          FROM GIANGVIEN gv
          LEFT JOIN KHOA k
            ON gv.MaKhoa = k.MaKhoa
          WHERE gv.MaTK = @MaTK
        `);

      return res.json({
        ...base,
        ...(gvResult.recordset[0] || {}),
      });
    }

    // =========================
    // ADMIN
    // =========================

    return res.json(base);
  } catch (err) {
    console.error("[/auth/profile]", err);

    res.status(500).json({
      message: "Lỗi server",
    });
  }
});

// POST /api/auth/login
// Body: { username, password }

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res
      .status(400)
      .json({ message: "Thiếu tên đăng nhập hoặc mật khẩu" });

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("u", sql.NVarChar, username)
      .input("p", sql.NVarChar, password).query(`
        SELECT tk.MaTK, tk.TenDangNhap, tk.TrangThai,
               vt.MaVaiTro, vt.TenVaiTro
        FROM TAIKHOAN tk
        JOIN VAITRO vt ON tk.MaVaiTro = vt.MaVaiTro
        WHERE tk.TenDangNhap = @u
          AND tk.MatKhau      = @p
      `);

    if (result.recordset.length === 0)
      return res
        .status(401)
        .json({ message: "Sai tên đăng nhập hoặc mật khẩu" });

    const user = result.recordset[0];

    if (user.TrangThai === "Bị khóa")
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });

    // Tạo JWT
    const token = jwt.sign(
      { maTK: user.MaTK, username: user.TenDangNhap, role: user.MaVaiTro },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || "8h" },
    );

    res.json({
      token,
      username: user.TenDangNhap,
      role: user.MaVaiTro,
      roleLabel: user.TenVaiTro,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// ─────────────────────────────────────────────────────
// POST /api/auth/change-password   (cần đăng nhập)
// Body: { oldPassword, newPassword }
// ─────────────────────────────────────────────────────
router.post("/change-password", verifyToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const maTK = req.user.maTK;

  if (!oldPassword || !newPassword || newPassword.length < 1)
    return res.status(400).json({ message: "Dữ liệu không hợp lệ" });

  try {
    const pool = await getPool();

    // Kiểm tra mật khẩu cũ
    const check = await pool
      .request()
      .input("maTK", sql.NVarChar, maTK)
      .input("old", sql.NVarChar, oldPassword)
      .query(`SELECT MaTK FROM TAIKHOAN WHERE MaTK=@maTK AND MatKhau=@old`);

    if (check.recordset.length === 0)
      return res.status(400).json({ message: "Mật khẩu cũ không đúng" });

    // Cập nhật mật khẩu mới
    await pool
      .request()
      .input("maTK", sql.NVarChar, maTK)
      .input("new", sql.NVarChar, newPassword)
      .query(`UPDATE TAIKHOAN SET MatKhau=@new WHERE MaTK=@maTK`);

    await logAction(maTK, "Đổi mật khẩu", "Đổi mật khẩu thành công");
    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
