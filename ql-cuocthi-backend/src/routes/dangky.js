const express = require("express");
const router = express.Router();
const { getPool, sql } = require("../db");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const logAction = require("../helpers/logAction");

// GET /api/dangky  – Danh sách (admin/cb/gv)
router.get(
  "/",
  verifyToken,
  requireRole("admin", "cb", "gv"),
  async (req, res) => {
    try {
      const pool = await getPool();
      const result = await pool.request().query(`
      SELECT * FROM VW_DANGKY_CHITIET
      ORDER BY NgayDangKy DESC
    `);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).json({ message: "Lỗi server" });
    }
  },
);

// GET /api/dangky/my  – Đăng ký của SV đang đăng nhập
router.get("/my", verifyToken, requireRole("sv"), async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("maTK", sql.NVarChar, req.user.maTK).query(`
        SELECT dk.*, ct.TenCuocThi, ct.ThoiGianBatDau, ct.DiaDiem
        FROM DANGKY_THAMGIA dk
        JOIN CUOCTHI ct ON dk.MaCuocThi = ct.MaCuocThi
        JOIN SINHVIEN sv ON dk.MaSV = sv.MaSV
        WHERE sv.MaTK = @maTK
        ORDER BY dk.NgayDangKy DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// POST /api/dangky  – SV đăng ký cuộc thi
// Body: { MaCuocThi }
router.post("/", verifyToken, requireRole("sv"), async (req, res) => {
  const { MaCuocThi } = req.body;
  if (!MaCuocThi) return res.status(400).json({ message: "Thiếu mã cuộc thi" });

  try {
    const pool = await getPool();

    // Tìm MaSV từ MaTK
    const svRes = await pool
      .request()
      .input("maTK", sql.NVarChar, req.user.maTK)
      .query(`SELECT MaSV FROM SINHVIEN WHERE MaTK = @maTK`);
    if (svRes.recordset.length === 0)
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });

    const maSV = svRes.recordset[0].MaSV;

    // Kiểm tra trùng
    const dup = await pool
      .request()
      .input("maSV", sql.NVarChar, maSV)
      .input("maCT", sql.NVarChar, MaCuocThi)
      .query(
        `SELECT MaDangKy FROM DANGKY_THAMGIA WHERE MaSV=@maSV AND MaCuocThi=@maCT`,
      );
    if (dup.recordset.length > 0)
      return res
        .status(400)
        .json({ message: "Bạn đã đăng ký cuộc thi này rồi" });

    const maDK = "DK" + Date.now();
    await pool
      .request()
      .input("maDK", sql.NVarChar, maDK)
      .input("maSV", sql.NVarChar, maSV)
      .input("maCT", sql.NVarChar, MaCuocThi).query(`
        INSERT INTO DANGKY_THAMGIA (MaDangKy, MaSV, MaCuocThi, NgayDangKy, TrangThaiGV, TrangThai)
        VALUES (@maDK, @maSV, @maCT, GETDATE(), N'Chờ xác nhận', N'Chờ duyệt')
      `);

    await logAction(
      req.user.maTK,
      "Đăng ký",
      `Đăng ký tham gia cuộc thi ${MaCuocThi}`,
    );
    res.status(201).json({ message: "Đăng ký thành công", MaDangKy: maDK });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// PUT /api/dangky/:id/duyet  – CB duyệt hoặc từ chối
// Body: { TrangThai: "Đã duyệt" | "Từ chối" }
router.put(
  "/:id/duyet",
  verifyToken,
  requireRole("admin", "cb"),
  async (req, res) => {
    const { TrangThai } = req.body;
    const allowed = ["Đã duyệt", "Từ chối"];
    if (!allowed.includes(TrangThai))
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });

    try {
      const pool = await getPool();
      await pool
        .request()
        .input("id", sql.NVarChar, req.params.id)
        .input("TrangThai", sql.NVarChar, TrangThai)
        .query(
          `UPDATE DANGKY_THAMGIA SET TrangThai=@TrangThai WHERE MaDangKy=@id`,
        );

      await logAction(
        req.user.maTK,
        TrangThai === "Đã duyệt" ? "Duyệt" : "Từ chối",
        `${TrangThai} đơn đăng ký ${req.params.id}`,
      );
      res.json({ message: `${TrangThai} thành công` });
    } catch (err) {
      res.status(500).json({ message: "Lỗi server" });
    }
  },
);

// PUT /api/dangky/:id/xacnhan  – GV xác nhận sinh viên
router.put(
  "/:id/xacnhan",
  verifyToken,
  requireRole("admin", "gv"),
  async (req, res) => {
    try {
      const pool = await getPool();
      await pool
        .request()
        .input("id", sql.NVarChar, req.params.id)
        .query(
          `UPDATE DANGKY_THAMGIA SET TrangThaiGV=N'Đã xác nhận' WHERE MaDangKy=@id`,
        );

      await logAction(
        req.user.maTK,
        "Xác nhận",
        `Xác nhận đăng ký ${req.params.id}`,
      );
      res.json({ message: "Xác nhận thành công" });
    } catch (err) {
      res.status(500).json({ message: "Lỗi server" });
    }
  },
);

// DELETE /api/dangky/:id  – SV hủy đăng ký của chính mình
router.delete(
  "/:id",
  verifyToken,
  requireRole("sv", "admin"),
  async (req, res) => {
    try {
      const pool = await getPool();

      // SV chỉ được hủy đăng ký của chính mình
      if (req.user.role === "sv") {
        const svRes = await pool
          .request()
          .input("maTK", sql.NVarChar, req.user.maTK)
          .query(`SELECT MaSV FROM SINHVIEN WHERE MaTK = @maTK`);
        const maSV = svRes.recordset[0]?.MaSV;

        const check = await pool
          .request()
          .input("id", sql.NVarChar, req.params.id)
          .input("maSV", sql.NVarChar, maSV)
          .query(
            `SELECT MaDangKy FROM DANGKY_THAMGIA WHERE MaDangKy=@id AND MaSV=@maSV`,
          );
        if (check.recordset.length === 0)
          return res
            .status(403)
            .json({ message: "Không có quyền hủy đăng ký này" });
      }

      await pool
        .request()
        .input("id", sql.NVarChar, req.params.id)
        .query(`DELETE FROM DANGKY_THAMGIA WHERE MaDangKy = @id`);

      await logAction(req.user.maTK, "Hủy", `Hủy đăng ký ${req.params.id}`);
      res.json({ message: "Hủy đăng ký thành công" });
    } catch (err) {
      res.status(500).json({ message: "Lỗi server" });
    }
  },
);

module.exports = router;
