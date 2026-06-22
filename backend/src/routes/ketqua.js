const express = require("express");
const router = express.Router();
const { getPool, sql } = require("../db");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const logAction = require("../helpers/logAction");

// GET /api/ketqua
router.get("/", async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        kq.*,

        dk.MaSV,

        sv.HoTen,

        sv.MaLop,

        l.TenLop,

        k.TenKhoa,

        ct.MaCuocThi,

        ct.TenCuocThi

      FROM KETQUA kq

      JOIN DANGKY_THAMGIA dk
        ON kq.MaDangKy = dk.MaDangKy

      JOIN SINHVIEN sv
        ON dk.MaSV = sv.MaSV

      LEFT JOIN LOP l
        ON sv.MaLop = l.MaLop

      LEFT JOIN KHOA k
        ON l.MaKhoa = k.MaKhoa

      JOIN CUOCTHI ct
        ON dk.MaCuocThi = ct.MaCuocThi

      ORDER BY kq.Diem DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Lỗi server",
    });
  }
});

// POST /api/ketqua — Thêm một kết quả mới
router.post("/", verifyToken, requireRole("admin", "cb"), async (req, res) => {
  try {
    const { MaKetQua, MaDangKy, XepHang, GiaiThuong, Diem } = req.body;

    // Validate bắt buộc
    if (!MaKetQua || !MaDangKy) {
      return res
        .status(400)
        .json({ message: "MaKetQua và MaDangKy là bắt buộc" });
    }

    //Check diem [0, 100]
    if (Diem < 0 || Diem > 100) {
      return res.status(400).json({
        message: "Điểm phải từ 0 đến 100",
      });
    }

    const pool = await getPool();

    // Kiểm tra MaDangKy tồn tại
    const checkDK = await pool
      .request()
      .input("MaDangKy", sql.NVarChar, MaDangKy)
      .query("SELECT MaDangKy FROM DANGKY_THAMGIA WHERE MaDangKy = @MaDangKy");

    if (checkDK.recordset.length === 0) {
      return res
        .status(400)
        .json({ message: `MaDangKy '${MaDangKy}' không tồn tại` });
    }

    // Kiểm tra MaKetQua chưa bị trùng
    const checkKQ = await pool
      .request()
      .input("MaKetQua", sql.NVarChar, MaKetQua)
      .query("SELECT MaKetQua FROM KETQUA WHERE MaKetQua = @MaKetQua");

    if (checkKQ.recordset.length > 0) {
      return res
        .status(409)
        .json({ message: `MaKetQua '${MaKetQua}' đã tồn tại` });
    }
    const existedDangKy = await pool
      .request()
      .input("MaDangKy", sql.NVarChar, MaDangKy).query(`
      SELECT MaKetQua
      FROM KETQUA
      WHERE MaDangKy = @MaDangKy
    `);

    if (existedDangKy.recordset.length > 0) {
      return res.status(400).json({
        message: "Đăng ký này đã có kết quả",
      });
    }
    await pool
      .request()
      .input("MaKetQua", sql.NVarChar, MaKetQua)
      .input("MaDangKy", sql.NVarChar, MaDangKy)
      .input("XepHang", sql.Int, parseInt(XepHang) || null)
      .input("GiaiThuong", sql.NVarChar, GiaiThuong || null)
      .input("Diem", sql.Float, Diem ?? null).query(`
        INSERT INTO KETQUA (MaKetQua, MaDangKy, XepHang, GiaiThuong, Diem)
        VALUES (@MaKetQua, @MaDangKy, @XepHang, @GiaiThuong, @Diem)
      `);

    await logAction(
      req.user?.maTK || null,
      "Thêm kết quả",
      `${MaKetQua} – đăng ký ${MaDangKy} – điểm ${Diem}`,
    );
    res.status(201).json({ message: "Thêm kết quả thành công", MaKetQua });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message,
      detail: err.originalError?.info || err,
    });
  }
});

module.exports = router;
