const express = require("express");
const router = express.Router();
const { getPool, sql } = require("../db");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const logAction = require("../helpers/logAction");

// GET ALL
router.get("/", async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        gv.MaGV,
        gv.HoTen,
        gv.Email,
        gv.SDT,
        gv.MaKhoa,

        k.TenKhoa,

        tk.MaTK,
        tk.TenDangNhap,
        tk.TrangThai,
        tk.MaVaiTro

      FROM GIANGVIEN gv

      LEFT JOIN KHOA k
        ON gv.MaKhoa = k.MaKhoa

      LEFT JOIN TAIKHOAN tk
        ON gv.MaTK = tk.MaTK

      ORDER BY gv.MaGV
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
});

// ======================================================
// ADD
// ======================================================

router.post("/", verifyToken, requireRole("admin", "cb"), async (req, res) => {
  try {
    const { MaGV, HoTen, Email, SDT, MaKhoa, TenDangNhap, MatKhau, MaVaiTro } =
      req.body;

    const pool = await getPool();
    // =====================================
    // VALIDATE DỮ LIỆU
    // =====================================

    // VALIDATE MÃ GIẢNG VIÊN
    const regexMaGV = /^GV\d{3,}$/;

    if (!regexMaGV.test(MaGV)) {
      return res.status(400).json({
        message: "Mã giảng viên không hợp lệ! Ví dụ: GV001",
      });
    }

    // VALIDATE EMAIL
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regexEmail.test(Email)) {
      return res.status(400).json({
        message: "Email không hợp lệ!",
      });
    }

    // VALIDATE SĐT
    const regexSDT = /^0\d{9}$/;

    if (!regexSDT.test(SDT)) {
      return res.status(400).json({
        message: "Số điện thoại phải gồm 10 số và bắt đầu bằng 0!",
      });
    }

    // CHECK MÃ KHOA
    const checkKhoa = await pool.request().input("MaKhoa", sql.VarChar, MaKhoa)
      .query(`
      SELECT *
      FROM KHOA
      WHERE MaKhoa = @MaKhoa
    `);

    if (checkKhoa.recordset.length === 0) {
      return res.status(400).json({
        message: "Mã khoa không tồn tại!",
      });
    }

    // CHECK MÃ GV TRÙNG
    const checkGV = await pool.request().input("MaGV", sql.VarChar, MaGV)
      .query(`
      SELECT *
      FROM GIANGVIEN
      WHERE MaGV = @MaGV
    `);

    if (checkGV.recordset.length > 0) {
      return res.status(400).json({
        message: "Mã giảng viên đã tồn tại!",
      });
    }

    // CHECK EMAIL TRÙNG
    const checkEmail = await pool.request().input("Email", sql.VarChar, Email)
      .query(`
      SELECT *
      FROM GIANGVIEN
      WHERE Email = @Email
    `);

    if (checkEmail.recordset.length > 0) {
      return res.status(400).json({
        message: "Email đã tồn tại!",
      });
    }

    // CHECK SDT TRÙNG
    const checkSDT = await pool.request().input("SDT", sql.VarChar, SDT).query(`
      SELECT *
      FROM GIANGVIEN
      WHERE SDT = @SDT
    `);

    if (checkSDT.recordset.length > 0) {
      return res.status(400).json({
        message: "Số điện thoại đã tồn tại!",
      });
    }

    // CHECK USERNAME TRÙNG
    const checkTK = await pool
      .request()
      .input("TenDangNhap", sql.VarChar, TenDangNhap).query(`
      SELECT *
      FROM TAIKHOAN
      WHERE TenDangNhap = @TenDangNhap
    `);

    if (checkTK.recordset.length > 0) {
      return res.status(400).json({
        message: "Tên đăng nhập đã tồn tại!",
      });
    }

    let MaTK = "TK" + Math.floor(100000 + Math.random() * 900000);

    // =====================================
    // TRANSACTION
    // =====================================

    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      // INSERT TAIKHOAN
      await new sql.Request(transaction)
        .input("MaTK", sql.VarChar, MaTK)
        .input("TenDangNhap", sql.NVarChar, TenDangNhap)
        .input("MatKhau", sql.NVarChar, MatKhau || "1")
        .input("TrangThai", sql.NVarChar, "Hoạt động")
        .input("MaVaiTro", sql.VarChar, MaVaiTro).query(`
      INSERT INTO TAIKHOAN
      (
        MaTK,
        TenDangNhap,
        MatKhau,
        TrangThai,
        MaVaiTro
      )
      VALUES
      (
        @MaTK,
        @TenDangNhap,
        @MatKhau,
        @TrangThai,
        @MaVaiTro
      )
    `);

      // INSERT GIANGVIEN
      await new sql.Request(transaction)
        .input("MaGV", sql.VarChar, MaGV)
        .input("HoTen", sql.NVarChar, HoTen)
        .input("Email", sql.NVarChar, Email)
        .input("SDT", sql.VarChar, SDT)
        .input("MaKhoa", sql.VarChar, MaKhoa)
        .input("MaTK", sql.VarChar, MaTK).query(`
      INSERT INTO GIANGVIEN
      (
        MaGV,
        HoTen,
        Email,
        SDT,
        MaKhoa,
        MaTK
      )
      VALUES
      (
        @MaGV,
        @HoTen,
        @Email,
        @SDT,
        @MaKhoa,
        @MaTK
      )
    `);

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();

      throw err;
    }

    await logAction(
      req.user?.maTK || null,
      "Thêm giảng viên",
      `${MaGV} – ${HoTen}`,
    );
    res.json({
      message: "Thêm giảng viên thành công",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
});

// ======================================================
// UPDATE
// ======================================================

router.put(
  "/:id",
  verifyToken,
  requireRole("admin", "cb"),
  async (req, res) => {
    try {
      const id = req.params.id;

      const {
        HoTen,
        Email,
        SDT,
        MaKhoa,
        TenDangNhap,
        MatKhau,
        TrangThai,
        MaVaiTro,
      } = req.body;

      const pool = await getPool();

      // Lấy MaTK
      const gv = await pool.request().input("id", sql.VarChar, id).query(`
        SELECT *
        FROM GIANGVIEN
        WHERE MaGV = @id
      `);

      const MaTK = gv.recordset[0].MaTK;

      // UPDATE GIANGVIEN
      await pool
        .request()
        .input("id", sql.VarChar, id)
        .input("HoTen", sql.NVarChar, HoTen)
        .input("Email", sql.NVarChar, Email)
        .input("SDT", sql.VarChar, SDT)
        .input("MaKhoa", sql.VarChar, MaKhoa).query(`
        UPDATE GIANGVIEN
        SET
          HoTen = @HoTen,
          Email = @Email,
          SDT = @SDT,
          MaKhoa = @MaKhoa
        WHERE MaGV = @id
      `);

      // UPDATE TAIKHOAN
      await pool
        .request()
        .input("MaTK", sql.VarChar, MaTK)
        .input("TenDangNhap", sql.NVarChar, TenDangNhap)
        .input("MatKhau", sql.NVarChar, MatKhau)
        .input("TrangThai", sql.NVarChar, TrangThai)
        .input("MaVaiTro", sql.VarChar, MaVaiTro).query(`
        UPDATE TAIKHOAN
        SET
          TenDangNhap = @TenDangNhap,
          MatKhau = @MatKhau,
          TrangThai = @TrangThai,
          MaVaiTro = @MaVaiTro
        WHERE MaTK = @MaTK
      `);

      await logAction(
        req.user?.maTK || null,
        "Sửa giảng viên",
        `${id} – ${HoTen}`,
      );
      res.json({
        message: "Cập nhật thành công",
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: err.message,
      });
    }
  },
);

// ======================================================
// DELETE
// ======================================================

router.delete(
  "/:id",
  verifyToken,
  requireRole("admin", "cb"),
  async (req, res) => {
    try {
      const id = req.params.id;

      const pool = await getPool();

      // =========================================
      // LẤY GIẢNG VIÊN
      // =========================================

      const gvResult = await pool.request().input("id", sql.VarChar, id).query(`
        SELECT *
        FROM GIANGVIEN
        WHERE MaGV = @id
      `);

      if (gvResult.recordset.length === 0) {
        return res.status(404).json({
          message: "Không tìm thấy giảng viên",
        });
      }

      const gv = gvResult.recordset[0];
      const MaTK = gv.MaTK;
      console.log("MaTK can xoa:", MaTK);

      // =========================================
      // LẤY DANH SÁCH CUỘC THI
      // =========================================

      const dsCuocThi = await pool.request().input("MaGV", sql.VarChar, id)
        .query(`
        SELECT MaCuocThi
        FROM CUOCTHI
        WHERE MaGV = @MaGV
      `);

      // =========================================
      // XÓA TOÀN BỘ DỮ LIỆU LIÊN QUAN
      // =========================================

      for (const ct of dsCuocThi.recordset) {
        const maCT = ct.MaCuocThi;

        // ===== LẤY ĐĂNG KÝ =====

        const dsDangKy = await pool
          .request()
          .input("MaCuocThi", sql.VarChar, maCT).query(`
          SELECT MaDangKy
          FROM DANGKY_THAMGIA
          WHERE MaCuocThi = @MaCuocThi
        `);

        // ===== XÓA KẾT QUẢ =====

        for (const dk of dsDangKy.recordset) {
          await pool.request().input("MaDangKy", sql.VarChar, dk.MaDangKy)
            .query(`
            DELETE FROM KETQUA
            WHERE MaDangKy = @MaDangKy
          `);
        }

        // ===== XÓA ĐĂNG KÝ =====

        await pool.request().input("MaCuocThi", sql.VarChar, maCT).query(`
          DELETE FROM DANGKY_THAMGIA
          WHERE MaCuocThi = @MaCuocThi
        `);

        // ===== XÓA THÔNG BÁO =====

        await pool.request().input("MaCuocThi", sql.VarChar, maCT).query(`
          DELETE FROM THONGBAO
          WHERE MaCuocThi = @MaCuocThi
        `);

        // ===== XÓA CUỘC THI =====

        await pool.request().input("MaCuocThi", sql.VarChar, maCT).query(`
          DELETE FROM CUOCTHI
          WHERE MaCuocThi = @MaCuocThi
        `);
      }

      // =========================================
      // XÓA NHẬT KÝ
      // =========================================

      await pool.request().input("MaTK", sql.VarChar, MaTK).query(`
        DELETE FROM NHATKY
        WHERE MaTK = @MaTK
      `);

      // =========================================
      // XÓA THÔNG BÁO NGƯỜI GỬI
      // =========================================

      await pool.request().input("MaTK", sql.VarChar, MaTK).query(`
        DELETE FROM THONGBAO
        WHERE MaTKNguiGui = @MaTK
      `);

      // =========================================
      // XÓA GIẢNG VIÊN
      // =========================================

      await pool.request().input("MaGV", sql.VarChar, id).query(`
    DELETE FROM GIANGVIEN
    WHERE MaGV = @MaGV
  `);

      console.log("Da xoa giang vien:", id);

      // =========================================
      // XÓA TÀI KHOẢN
      // =========================================

      if (MaTK) {
        await pool.request().input("MaTK", sql.VarChar, MaTK).query(`
      DELETE FROM TAIKHOAN
      WHERE MaTK = @MaTK
    `);

        console.log("Da xoa tai khoan:", MaTK);
      }

      await logAction(req.user?.maTK || null, "Xóa giảng viên", `MaGV: ${id}`);
      res.json({
        message: "Xóa thành công",
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: err.message,
      });
    }
  },
);

module.exports = router;
