const express = require("express");
const router = express.Router();
const { getPool, sql } = require("../db");
const { verifyToken } = require("../middleware/auth");

/* ============================================================
   GET /api/dashboard/stats
   Trả về stat cards theo vai trò người dùng
   ============================================================ */
router.get("/stats", verifyToken, async (req, res) => {
  const { maTK, role } = req.user;
  try {
    const pool = await getPool();
    let data;

    if (role === "sv") {
      // ── SINH VIÊN ──────────────────────────────────────────
      const r = await pool.request().input("maTK", sql.VarChar, maTK).query(`
          DECLARE @maSV VARCHAR(10) = (SELECT MaSV FROM SINHVIEN WHERE MaTK = @maTK);
          SELECT
            (SELECT COUNT(*) FROM CUOCTHI WHERE TrangThai = N'Đang mở')
              AS cuocThiDangMo,
            (SELECT COUNT(*) FROM DANGKY_THAMGIA WHERE MaSV = @maSV)
              AS tongDangKy,
            (SELECT COUNT(*) FROM DANGKY_THAMGIA WHERE MaSV = @maSV AND TrangThai = N'Đã duyệt')
              AS daDuyet,
            (SELECT COUNT(*)
               FROM DANGKY_THAMGIA dk
               JOIN KETQUA kq ON dk.MaDangKy = kq.MaDangKy
               WHERE dk.MaSV = @maSV AND kq.GiaiThuong IS NOT NULL
                 AND LTRIM(RTRIM(kq.GiaiThuong)) <> '')
              AS soGiai
        `);
      data = { role, ...r.recordset[0] };
    } else if (role === "gv") {
      // ── GIẢNG VIÊN ─────────────────────────────────────────
      const r = await pool.request().input("maTK", sql.VarChar, maTK).query(`
          DECLARE @maGV VARCHAR(10) = (SELECT MaGV FROM GIANGVIEN WHERE MaTK = @maTK);
          SELECT
            (SELECT COUNT(*) FROM CUOCTHI WHERE MaGV = @maGV)
              AS cuocThiPhuTrach,
            (SELECT COUNT(*)
               FROM DANGKY_THAMGIA dk
               JOIN CUOCTHI ct ON dk.MaCuocThi = ct.MaCuocThi
               WHERE ct.MaGV = @maGV AND dk.TrangThaiGV = N'Chờ xác nhận')
              AS choXacNhan,
            (SELECT COUNT(*)
               FROM DANGKY_THAMGIA dk
               JOIN CUOCTHI ct ON dk.MaCuocThi = ct.MaCuocThi
               WHERE ct.MaGV = @maGV AND dk.TrangThaiGV = N'Đã xác nhận')
              AS daXacNhan,
            (SELECT COUNT(*)
               FROM KETQUA kq
               JOIN DANGKY_THAMGIA dk ON kq.MaDangKy = dk.MaDangKy
               JOIN CUOCTHI ct ON dk.MaCuocThi = ct.MaCuocThi
               WHERE ct.MaGV = @maGV)
              AS tongKetQua
        `);
      data = { role, ...r.recordset[0] };
    } else if (role === "guest") {
      // ── KHÁCH ──────────────────────────────────────────────
      const r = await pool.request().query(`
        SELECT
          (SELECT COUNT(*) FROM CUOCTHI WHERE TrangThai = N'Đang mở')   AS cuocThiDangMo,
          (SELECT COUNT(*) FROM CUOCTHI)                                  AS tongCuocThi,
          (SELECT COUNT(*) FROM SINHVIEN)                                 AS tongSinhVien,
          (SELECT COUNT(*) FROM KETQUA
             WHERE GiaiThuong IS NOT NULL AND LTRIM(RTRIM(GiaiThuong)) <> '')
                                                                          AS tongGiai
      `);
      data = { role, ...r.recordset[0] };
    } else {
      // ── ADMIN / CÁN BỘ ─────────────────────────────────────
      const r = await pool.request().query(`
        SELECT
          (SELECT COUNT(*) FROM SINHVIEN)                                       AS tongSinhVien,
          (SELECT COUNT(*) FROM GIANGVIEN)                                       AS tongGiangVien,
          (SELECT COUNT(*) FROM CUOCTHI WHERE TrangThai = N'Đang mở')           AS dangMo,
          (SELECT COUNT(*) FROM CUOCTHI
             WHERE TrangThai IN (N'Đang mở', N'Mở sớm', N'Sắp đóng'))          AS dangHoatDong,
          (SELECT COUNT(*) FROM DANGKY_THAMGIA WHERE TrangThai = N'Chờ duyệt') AS choDuyet,
          (SELECT COUNT(*) FROM DANGKY_THAMGIA WHERE TrangThai = N'Đã duyệt')  AS daDuyet,
          (SELECT COUNT(*) FROM KETQUA
             WHERE GiaiThuong IS NOT NULL AND LTRIM(RTRIM(GiaiThuong)) <> '')  AS tongGiai,
          (SELECT COUNT(*) FROM CUOCTHI)                                        AS tongCuocThi
      `);
      data = { role, ...r.recordset[0] };
    }

    res.json(data);
  } catch (err) {
    console.error("[/dashboard/stats]", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* ============================================================
   GET /api/dashboard/upcoming
   Cuộc thi sắp / đang diễn ra (top 5)
   SV chỉ thấy "Đang mở"; các role khác thấy cả "Mở sớm", "Sắp đóng"
   ============================================================ */
router.get("/upcoming", verifyToken, async (req, res) => {
  const { role } = req.user;
  try {
    const pool = await getPool();

    const where = `
      WHERE ct.TrangThai = N'Mở sớm'
    `;

    const result = await pool.request().query(`
      SELECT TOP 5
        ct.MaCuocThi,
        ct.TenCuocThi,
        ct.LoaiCuocThi,
        ct.DiaDiem,
        ct.ThoiGianBatDau,
        ct.ThoiGianKetThuc,
        ct.SoLuongToiDa,
        ct.TrangThai,
        COUNT(dk.MaDangKy) AS SoLuongDaDangKy
      FROM CUOCTHI ct
      LEFT JOIN DANGKY_THAMGIA dk
             ON ct.MaCuocThi  = dk.MaCuocThi
            AND dk.TrangThai <> N'Từ chối'
      ${where}
      GROUP BY ct.MaCuocThi, ct.TenCuocThi, ct.LoaiCuocThi, ct.DiaDiem,
               ct.ThoiGianBatDau, ct.ThoiGianKetThuc, ct.SoLuongToiDa, ct.TrangThai
      ORDER BY ct.ThoiGianBatDau ASC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("[/dashboard/upcoming]", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* ============================================================
   GET /api/dashboard/activity
   Hoạt động gần đây từ NHATKY – top 10 mới nhất, lọc theo vai trò:
     admin : xem tất cả (admin + cb + gv + sv)
     cb    : xem chính mình + gv + sv  (không thấy admin / cb khác)
     gv    : xem chính mình + sv       (không thấy admin / cb)
     sv    : chỉ xem hành động của mình
   ============================================================ */
router.get("/activity", verifyToken, async (req, res) => {
  const { maTK, role } = req.user;
  try {
    const pool = await getPool();
    const r = pool.request().input("maTK", sql.VarChar, maTK);

    let where;
    if (role === "admin") {
      where = ""; // tất cả
    } else if (role === "cb") {
      where = `WHERE (vt.MaVaiTro IN (N'gv', N'sv') OR nk.MaTK = @maTK)`;
    } else if (role === "gv") {
      where = `WHERE (vt.MaVaiTro = N'sv' OR nk.MaTK = @maTK)`;
    } else {
      where = `WHERE nk.MaTK = @maTK`; // sv / guest
    }

    const result = await r.query(`
      SELECT TOP 10
        nk.ThoiGian,
        nk.HanhDong,
        nk.MoTa,
        COALESCE(tk.TenDangNhap, N'Hệ thống') AS TenDangNhap,
        COALESCE(vt.MaVaiTro,    N'system')    AS MaVaiTro
      FROM NHATKY nk
      LEFT JOIN TAIKHOAN tk ON nk.MaTK     = tk.MaTK
      LEFT JOIN VAITRO   vt ON tk.MaVaiTro = vt.MaVaiTro
      ${where}
      ORDER BY nk.ThoiGian DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("[/dashboard/activity]", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* ============================================================
   GET /api/dashboard/notifications
   Admin/CB/GV: thông báo hệ thống (MaSV IS NULL)
   SV: thông báo cá nhân của họ
   ============================================================ */
router.get("/notifications", verifyToken, async (req, res) => {
  const { maTK, role } = req.user;
  try {
    const pool = await getPool();

    let result;

    if (role === "sv") {
      result = await pool.request().input("maTK", sql.VarChar, maTK).query(`
        SELECT TOP 5
          tb.TieuDe,
          tb.NoiDung,
          tb.NgayGui,
          ct.TenCuocThi
        FROM THONGBAO tb
        LEFT JOIN CUOCTHI  ct ON tb.MaCuocThi = ct.MaCuocThi
        JOIN      SINHVIEN sv ON tb.MaSV       = sv.MaSV
        WHERE sv.MaTK = @maTK
        ORDER BY tb.NgayGui DESC
      `);
    } else {
      result = await pool.request().query(`
        SELECT TOP 5
          tb.TieuDe,
          tb.NoiDung,
          tb.NgayGui,
          ct.TenCuocThi
        FROM THONGBAO tb
        LEFT JOIN CUOCTHI ct ON tb.MaCuocThi = ct.MaCuocThi
        WHERE tb.MaSV IS NULL
        ORDER BY tb.NgayGui DESC
      `);
    }

    res.json(result.recordset);
  } catch (err) {
    console.error("[/dashboard/notifications]", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
