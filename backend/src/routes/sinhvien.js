const express = require("express");
const router = express.Router();
const { getPool, sql } = require("../db");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const logAction = require("../helpers/logAction");

// GET /api/sinhvien
router.get(
  "/",
  verifyToken,
  requireRole("admin", "cb", "gv"),
  async (req, res) => {
    try {
      const pool = await getPool();

      const result = await pool.request().query(`
        SELECT
            sv.MaSV,
            sv.HoTen,
            sv.NgaySinh,
            sv.GioiTinh,

            l.TenLop AS Lop,

            k.TenKhoa AS Khoa,

            sv.Email,
            sv.SDT,

            COUNT(dk.MaDangKy) AS SoCuocThi

        FROM SINHVIEN sv

        LEFT JOIN LOP l
        ON sv.MaLop = l.MaLop

        LEFT JOIN KHOA k
        ON l.MaKhoa = k.MaKhoa

        LEFT JOIN DANGKY_THAMGIA dk
        ON sv.MaSV = dk.MaSV

        GROUP BY
            sv.MaSV,
            sv.HoTen,
            sv.NgaySinh,
            sv.GioiTinh,
            l.TenLop,
            k.TenKhoa,
            sv.Email,
            sv.SDT

        ORDER BY sv.MaSV
      `);

      res.json(result.recordset);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: err.message,
      });
    }
  },
);

// THÊM SINH VIÊN
router.post("/", verifyToken, requireRole("admin", "cb"), async (req, res) => {
  const { MaSV, HoTen, NgaySinh, GioiTinh, Email, SDT, MaLop } = req.body;

  try {
    const pool = await getPool();
    // =====================================
    // VALIDATE DỮ LIỆU
    // =====================================

    // VALIDATE MÃ SINH VIÊN
    const regexMaSV = /^SV\d{3,}$/;

    if (!regexMaSV.test(MaSV)) {
      return res.status(400).json({
        message: "Mã sinh viên không hợp lệ! Ví dụ: SV001",
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

    // CHECK MÃ LỚP TỒN TẠI
    const checkLop = await pool.request().input("MaLop", sql.VarChar, MaLop)
      .query(`
    SELECT *
    FROM LOP
    WHERE MaLop = @MaLop
  `);

    if (checkLop.recordset.length === 0) {
      return res.status(400).json({
        message: "Mã lớp không tồn tại!",
      });
    }

    // CHECK MÃ SV TRÙNG
    const checkSV = await pool.request().input("MaSV", sql.VarChar, MaSV)
      .query(`
        SELECT *
        FROM SINHVIEN
        WHERE MaSV = @MaSV
      `);

    if (checkSV.recordset.length > 0) {
      return res.status(400).json({
        message: "Mã sinh viên đã tồn tại!",
      });
    }

    // CHECK TÀI KHOẢN ĐÃ TỒN TẠI
    const checkTK = await pool.request().input("TenDangNhap", sql.VarChar, MaSV)
      .query(`
        SELECT *
        FROM TAIKHOAN
        WHERE TenDangNhap = @TenDangNhap
      `);

    if (checkTK.recordset.length > 0) {
      return res.status(400).json({
        message: "Tài khoản sinh viên đã tồn tại!",
      });
    }

    // =====================================
    // AUTO GEN MaTK
    // =====================================

    let MaTK = "TK" + Math.floor(100000 + Math.random() * 900000);
    // CHECK EMAIL TRÙNG
    const checkEmail = await pool.request().input("Email", sql.VarChar, Email)
      .query(`
        SELECT *
        FROM SINHVIEN
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
      FROM SINHVIEN
      WHERE SDT = @SDT
    `);

    if (checkSDT.recordset.length > 0) {
      return res.status(400).json({
        message: "Số điện thoại đã tồn tại!",
      });
    }

    // =====================================
    // TRANSACTION
    // KHÔNG TẠO TÀI KHOẢN RÁC
    // =====================================

    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      // INSERT TAIKHOAN
      await new sql.Request(transaction)

        .input("MaTK", sql.VarChar, MaTK)

        .input("TenDangNhap", sql.VarChar, MaSV)

        .input("MatKhau", sql.VarChar, "1")

        .input("TrangThai", sql.NVarChar, "Hoạt động")

        .input("MaVaiTro", sql.VarChar, "sv").query(`
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

      // INSERT SINHVIEN
      await new sql.Request(transaction)

        .input("MaSV", sql.VarChar, MaSV)

        .input("HoTen", sql.NVarChar, HoTen)

        .input("NgaySinh", sql.Date, NgaySinh)

        .input("GioiTinh", sql.NVarChar, GioiTinh)

        .input("Email", sql.VarChar, Email)

        .input("SDT", sql.VarChar, SDT)

        .input("MaLop", sql.VarChar, MaLop)

        .input("MaTK", sql.VarChar, MaTK).query(`
      INSERT INTO SINHVIEN
      (
        MaSV,
        HoTen,
        NgaySinh,
        GioiTinh,
        Email,
        SDT,
        MaLop,
        MaTK
      )
      VALUES
      (
        @MaSV,
        @HoTen,
        @NgaySinh,
        @GioiTinh,
        @Email,
        @SDT,
        @MaLop,
        @MaTK
      )
    `);

      // THÀNH CÔNG
      await transaction.commit();
    } catch (err) {
      // CÓ LỖI -> XÓA HẾT
      await transaction.rollback();

      throw err;
    }
    await logAction(
      req.user?.maTK || null,
      "Thêm sinh viên",
      `${MaSV} – ${HoTen}`,
    );
    res.json({
      message: "Thêm sinh viên thành công",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
});

// ======================================================
// UPDATE SINH VIÊN
// ======================================================

router.put(
  "/:id",
  verifyToken,
  requireRole("admin", "cb"),
  async (req, res) => {
    try {
      const id = req.params.id;

      const { HoTen, NgaySinh, GioiTinh, Email, SDT, MaLop } = req.body;

      const pool = await getPool();

      // CHECK SV TỒN TẠI
      const checkSV = await pool.request().input("id", sql.VarChar, id).query(`
      SELECT * FROM SINHVIEN WHERE MaSV = @id
    `);

      if (checkSV.recordset.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy sinh viên!" });
      }

      // VALIDATE EMAIL
      const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regexEmail.test(Email)) {
        return res.status(400).json({ message: "Email không hợp lệ!" });
      }

      // VALIDATE SĐT
      const regexSDT = /^0\d{9}$/;
      if (!regexSDT.test(SDT)) {
        return res.status(400).json({
          message: "Số điện thoại phải gồm 10 số và bắt đầu bằng 0!",
        });
      }

      // CHECK EMAIL TRÙNG (trừ chính nó)
      const checkEmail = await pool
        .request()
        .input("Email", sql.VarChar, Email)
        .input("id", sql.VarChar, id).query(`
      SELECT * FROM SINHVIEN WHERE Email = @Email AND MaSV <> @id
    `);
      if (checkEmail.recordset.length > 0) {
        return res.status(400).json({ message: "Email đã tồn tại!" });
      }

      // CHECK SDT TRÙNG (trừ chính nó)
      const checkSDT = await pool
        .request()
        .input("SDT", sql.VarChar, SDT)
        .input("id", sql.VarChar, id).query(`
      SELECT * FROM SINHVIEN WHERE SDT = @SDT AND MaSV <> @id
    `);
      if (checkSDT.recordset.length > 0) {
        return res.status(400).json({ message: "Số điện thoại đã tồn tại!" });
      }

      // CHECK MÃ LỚP TỒN TẠI
      const checkLop = await pool.request().input("MaLop", sql.VarChar, MaLop)
        .query(`
      SELECT * FROM LOP WHERE MaLop = @MaLop
    `);
      if (checkLop.recordset.length === 0) {
        return res.status(400).json({ message: "Mã lớp không tồn tại!" });
      }

      await pool
        .request()
        .input("id", sql.VarChar, id)
        .input("HoTen", sql.NVarChar, HoTen)
        .input("NgaySinh", sql.Date, NgaySinh)
        .input("GioiTinh", sql.NVarChar, GioiTinh)
        .input("Email", sql.VarChar, Email)
        .input("SDT", sql.VarChar, SDT)
        .input("MaLop", sql.VarChar, MaLop).query(`
      UPDATE SINHVIEN
      SET
        HoTen    = @HoTen,
        NgaySinh = @NgaySinh,
        GioiTinh = @GioiTinh,
        Email    = @Email,
        SDT      = @SDT,
        MaLop    = @MaLop
      WHERE MaSV = @id
    `);

      await logAction(
        req.user?.maTK || null,
        "Sửa sinh viên",
        `${id} – ${HoTen}`,
      );
      res.json({ message: "Cập nhật sinh viên thành công" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  },
);

// ======================================================
// DELETE SINH VIÊN
// ======================================================

router.delete(
  "/:id",
  verifyToken,
  requireRole("admin", "cb"),
  async (req, res) => {
    try {
      const id = req.params.id;

      const pool = await getPool();

      // CHECK SV TỒN TẠI
      const svResult = await pool.request().input("id", sql.VarChar, id).query(`
      SELECT * FROM SINHVIEN WHERE MaSV = @id
    `);

      if (svResult.recordset.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy sinh viên!" });
      }

      const sv = svResult.recordset[0];
      const MaTK = sv.MaTK;

      // XÓA KẾT QUẢ -> ĐĂNG KÝ -> THÔNG BÁO -> NHẬT KÝ -> SV -> TK

      const dsDangKy = await pool.request().input("MaSV", sql.VarChar, id)
        .query(`
      SELECT MaDangKy FROM DANGKY_THAMGIA WHERE MaSV = @MaSV
    `);

      for (const dk of dsDangKy.recordset) {
        await pool.request().input("MaDangKy", sql.VarChar, dk.MaDangKy).query(`
        DELETE FROM KETQUA WHERE MaDangKy = @MaDangKy
      `);
      }

      await pool.request().input("MaSV", sql.VarChar, id).query(`
      DELETE FROM DANGKY_THAMGIA WHERE MaSV = @MaSV
    `);

      await pool.request().input("MaSV", sql.VarChar, id).query(`
      DELETE FROM THONGBAO WHERE MaSV = @MaSV
    `);

      if (MaTK) {
        await pool.request().input("MaTK", sql.VarChar, MaTK).query(`
        DELETE FROM NHATKY WHERE MaTK = @MaTK
      `);
      }

      await pool.request().input("MaSV", sql.VarChar, id).query(`
      DELETE FROM SINHVIEN WHERE MaSV = @MaSV
    `);

      if (MaTK) {
        await pool.request().input("MaTK", sql.VarChar, MaTK).query(`
        DELETE FROM TAIKHOAN WHERE MaTK = @MaTK
      `);
      }

      await logAction(req.user?.maTK || null, "Xóa sinh viên", `MaSV: ${id}`);
      res.json({ message: "Xóa sinh viên thành công" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  },
);

module.exports = router;
