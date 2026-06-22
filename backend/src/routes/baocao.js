const express = require("express");
const router = express.Router();
const { getPool, sql } = require("../db");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

/* ============================================================
   HELPER: Chuyển "2024-2025" → { from: '2024-09-01', to: '2025-08-31' }
   Năm học VN: 1/9 năm N → 31/8 năm N+1
   ============================================================ */
function parseNamHoc(namHoc) {
  if (!namHoc || namHoc === "all") return null;
  const m = /^(\d{4})-(\d{4})$/.exec(String(namHoc));
  if (!m) return null;
  return {
    from: `${m[1]}-09-01`,
    to: `${m[2]}-08-31`,
  };
}

/* ============================================================
   GET /api/baocao/filters
   Trả về danh sách năm học + danh sách khoa cho 2 dropdown
   ============================================================ */
router.get(
  "/filters",
  verifyToken,
  requireRole("admin", "cb"),
  async (req, res) => {
    try {
      const pool = await getPool();

      // Lấy năm học từ ThoiGianBatDau của các cuộc thi
      const yearsRs = await pool.request().query(`
        SELECT DISTINCT
          CASE
            WHEN MONTH(ThoiGianBatDau) >= 9
              THEN CONCAT(YEAR(ThoiGianBatDau), '-', YEAR(ThoiGianBatDau)+1)
            ELSE CONCAT(YEAR(ThoiGianBatDau)-1, '-', YEAR(ThoiGianBatDau))
          END AS NamHoc
        FROM CUOCTHI
        WHERE ThoiGianBatDau IS NOT NULL
        ORDER BY NamHoc DESC
      `);

      const khoaRs = await pool
        .request()
        .query(`SELECT MaKhoa, TenKhoa FROM KHOA ORDER BY TenKhoa`);

      res.json({
        namHoc: yearsRs.recordset.map((r) => r.NamHoc),
        khoa: khoaRs.recordset,
      });
    } catch (err) {
      console.error("[/baocao/filters]", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },
);

/* ============================================================
   GET /api/baocao/stats?namHoc=2024-2025&maKhoa=K01
   4 stat cards: Tổng đăng ký / Tỷ lệ duyệt / Tổng giải / Khoa dẫn đầu
   ============================================================ */
router.get(
  "/stats",
  verifyToken,
  requireRole("admin", "cb"),
  async (req, res) => {
    try {
      const pool = await getPool();
      const range = parseNamHoc(req.query.namHoc);
      const maKhoa =
        req.query.maKhoa && req.query.maKhoa !== "all"
          ? req.query.maKhoa
          : null;

      // WHERE cho lọc theo năm học (qua CUOCTHI) và khoa (qua SV→LOP→KHOA)
      const whereParts = ["1=1"];
      const r = pool.request();

      if (range) {
        whereParts.push("ct.ThoiGianBatDau BETWEEN @from AND @to");
        r.input("from", sql.DateTime, new Date(range.from));
        r.input("to", sql.DateTime, new Date(range.to + " 23:59:59"));
      }
      if (maKhoa) {
        whereParts.push("l.MaKhoa = @maKhoa");
        r.input("maKhoa", sql.NVarChar, maKhoa);
      }
      const whereSql = whereParts.join(" AND ");

      // 1) Tổng đăng ký + tỷ lệ duyệt
      const dkRs = await r.query(`
        SELECT
          COUNT(*) AS tongDangKy,
          SUM(CASE WHEN dk.TrangThai = N'Đã duyệt' THEN 1 ELSE 0 END) AS daDuyet
        FROM DANGKY_THAMGIA dk
        JOIN CUOCTHI  ct ON dk.MaCuocThi = ct.MaCuocThi
        JOIN SINHVIEN sv ON dk.MaSV       = sv.MaSV
        LEFT JOIN LOP l  ON sv.MaLop      = l.MaLop
        WHERE ${whereSql}
      `);
      const dkRow = dkRs.recordset[0] || { tongDangKy: 0, daDuyet: 0 };

      // 2) Tổng giải + khoa dẫn đầu (cùng 1 lượt query để dùng filter)
      const r2 = pool.request();
      if (range) {
        r2.input("from", sql.DateTime, new Date(range.from));
        r2.input("to", sql.DateTime, new Date(range.to + " 23:59:59"));
      }
      if (maKhoa) r2.input("maKhoa", sql.NVarChar, maKhoa);

      const giaiRs = await r2.query(`
        SELECT
          COUNT(*) AS tongGiai
        FROM KETQUA kq
        JOIN DANGKY_THAMGIA dk ON kq.MaDangKy  = dk.MaDangKy
        JOIN CUOCTHI  ct       ON dk.MaCuocThi = ct.MaCuocThi
        JOIN SINHVIEN sv       ON dk.MaSV       = sv.MaSV
        LEFT JOIN LOP l        ON sv.MaLop      = l.MaLop
        WHERE kq.GiaiThuong IS NOT NULL
          AND LTRIM(RTRIM(kq.GiaiThuong)) <> ''
          AND ${whereSql}
      `);
      const tongGiai = giaiRs.recordset[0]?.tongGiai || 0;

      // 3) Khoa dẫn đầu (theo số giải)
      const r3 = pool.request();
      if (range) {
        r3.input("from", sql.DateTime, new Date(range.from));
        r3.input("to", sql.DateTime, new Date(range.to + " 23:59:59"));
      }
      if (maKhoa) r3.input("maKhoa", sql.NVarChar, maKhoa);

      const topRs = await r3.query(`
        SELECT TOP 1
          k.TenKhoa,
          COUNT(*) AS SoGiai
        FROM KETQUA kq
        JOIN DANGKY_THAMGIA dk ON kq.MaDangKy  = dk.MaDangKy
        JOIN CUOCTHI  ct       ON dk.MaCuocThi = ct.MaCuocThi
        JOIN SINHVIEN sv       ON dk.MaSV       = sv.MaSV
        LEFT JOIN LOP  l       ON sv.MaLop      = l.MaLop
        LEFT JOIN KHOA k       ON l.MaKhoa      = k.MaKhoa
        WHERE kq.GiaiThuong IS NOT NULL
          AND LTRIM(RTRIM(kq.GiaiThuong)) <> ''
          AND ${whereSql}
        GROUP BY k.TenKhoa
        ORDER BY SoGiai DESC
      `);
      const top = topRs.recordset[0];

      const tyLe =
        dkRow.tongDangKy > 0
          ? Math.round((dkRow.daDuyet / dkRow.tongDangKy) * 1000) / 10
          : 0;

      res.json({
        tongDangKy: dkRow.tongDangKy || 0,
        daDuyet: dkRow.daDuyet || 0,
        tyLeDuyet: tyLe,
        tongGiai,
        khoaDanDau: top?.TenKhoa || null,
        khoaDanDauSoGiai: top?.SoGiai || 0,
      });
    } catch (err) {
      console.error("[/baocao/stats]", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },
);

/* ============================================================
   GET /api/baocao/theo-khoa?namHoc=&maKhoa=
   Bảng thống kê theo khoa: Khoa | SV tham gia | Số giải
   ============================================================ */
router.get(
  "/theo-khoa",
  verifyToken,
  requireRole("admin", "cb"),
  async (req, res) => {
    try {
      const pool = await getPool();
      const range = parseNamHoc(req.query.namHoc);
      const maKhoa =
        req.query.maKhoa && req.query.maKhoa !== "all"
          ? req.query.maKhoa
          : null;

      const r = pool.request();
      const where = ["1=1"];
      if (range) {
        where.push(
          "(ct.ThoiGianBatDau IS NULL OR ct.ThoiGianBatDau BETWEEN @from AND @to)",
        );
        r.input("from", sql.DateTime, new Date(range.from));
        r.input("to", sql.DateTime, new Date(range.to + " 23:59:59"));
      }
      if (maKhoa) {
        where.push("k.MaKhoa = @maKhoa");
        r.input("maKhoa", sql.NVarChar, maKhoa);
      }

      const result = await r.query(`
        SELECT
          k.MaKhoa,
          k.TenKhoa,
          COUNT(DISTINCT dk.MaSV) AS SoSV,
          SUM(CASE
                WHEN kq.GiaiThuong IS NOT NULL
                 AND LTRIM(RTRIM(kq.GiaiThuong)) <> ''
                THEN 1 ELSE 0
              END) AS SoGiai
        FROM KHOA k
        LEFT JOIN LOP             l  ON l.MaKhoa     = k.MaKhoa
        LEFT JOIN SINHVIEN        sv ON sv.MaLop     = l.MaLop
        LEFT JOIN DANGKY_THAMGIA  dk ON dk.MaSV      = sv.MaSV
        LEFT JOIN CUOCTHI         ct ON ct.MaCuocThi = dk.MaCuocThi
        LEFT JOIN KETQUA          kq ON kq.MaDangKy  = dk.MaDangKy
        WHERE ${where.join(" AND ")}
        GROUP BY k.MaKhoa, k.TenKhoa
        ORDER BY SoGiai DESC, SoSV DESC, k.TenKhoa
      `);

      res.json(result.recordset);
    } catch (err) {
      console.error("[/baocao/theo-khoa]", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },
);

/* ============================================================
   GET /api/baocao/theo-cuoc-thi?namHoc=&maKhoa=
   Bảng theo cuộc thi: Tên cuộc thi | Loại | Số đăng ký | Đã duyệt | Số giải
   ============================================================ */
router.get(
  "/theo-cuoc-thi",
  verifyToken,
  requireRole("admin", "cb"),
  async (req, res) => {
    try {
      const pool = await getPool();
      const range = parseNamHoc(req.query.namHoc);
      const maKhoa =
        req.query.maKhoa && req.query.maKhoa !== "all"
          ? req.query.maKhoa
          : null;

      const r = pool.request();
      const where = ["1=1"];
      if (range) {
        where.push("ct.ThoiGianBatDau BETWEEN @from AND @to");
        r.input("from", sql.DateTime, new Date(range.from));
        r.input("to", sql.DateTime, new Date(range.to + " 23:59:59"));
      }
      if (maKhoa) {
        where.push(`EXISTS (
          SELECT 1
          FROM DANGKY_THAMGIA dk2
          JOIN SINHVIEN sv2 ON dk2.MaSV = sv2.MaSV
          JOIN LOP      l2  ON sv2.MaLop = l2.MaLop
          WHERE dk2.MaCuocThi = ct.MaCuocThi
            AND l2.MaKhoa = @maKhoa
        )`);
        r.input("maKhoa", sql.NVarChar, maKhoa);
      }

      const result = await r.query(`
        SELECT
          ct.MaCuocThi,
          ct.TenCuocThi,
          ct.LoaiCuocThi,
          ct.ThoiGianBatDau,
          ct.TrangThai,
          COUNT(dk.MaDangKy) AS SoDangKy,
          SUM(CASE WHEN dk.TrangThai = N'Đã duyệt' THEN 1 ELSE 0 END) AS SoDaDuyet,
          SUM(CASE
                WHEN kq.GiaiThuong IS NOT NULL
                 AND LTRIM(RTRIM(kq.GiaiThuong)) <> ''
                THEN 1 ELSE 0
              END) AS SoGiai
        FROM CUOCTHI ct
        LEFT JOIN DANGKY_THAMGIA dk ON dk.MaCuocThi = ct.MaCuocThi
        LEFT JOIN KETQUA         kq ON kq.MaDangKy  = dk.MaDangKy
        WHERE ${where.join(" AND ")}
        GROUP BY ct.MaCuocThi, ct.TenCuocThi, ct.LoaiCuocThi,
                 ct.ThoiGianBatDau, ct.TrangThai
        ORDER BY ct.ThoiGianBatDau DESC
      `);

      res.json(result.recordset);
    } catch (err) {
      console.error("[/baocao/theo-cuoc-thi]", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },
);

/* ============================================================
   GET /api/baocao/bang-vang?namHoc=&maKhoa=
   Bảng vàng thành tích: SV có giải
   ============================================================ */
router.get(
  "/bang-vang",
  verifyToken,
  requireRole("admin", "cb"),
  async (req, res) => {
    try {
      const pool = await getPool();
      const range = parseNamHoc(req.query.namHoc);
      const maKhoa =
        req.query.maKhoa && req.query.maKhoa !== "all"
          ? req.query.maKhoa
          : null;

      const r = pool.request();
      const where = [
        "kq.GiaiThuong IS NOT NULL",
        "LTRIM(RTRIM(kq.GiaiThuong)) <> ''",
      ];
      if (range) {
        where.push("ct.ThoiGianBatDau BETWEEN @from AND @to");
        r.input("from", sql.DateTime, new Date(range.from));
        r.input("to", sql.DateTime, new Date(range.to + " 23:59:59"));
      }
      if (maKhoa) {
        where.push("l.MaKhoa = @maKhoa");
        r.input("maKhoa", sql.NVarChar, maKhoa);
      }

      const result = await r.query(`
        SELECT
          sv.MaSV,
          sv.HoTen,
          l.TenLop,
          k.TenKhoa,
          ct.TenCuocThi,
          kq.GiaiThuong,
          kq.XepHang,
          kq.Diem,
          ct.ThoiGianBatDau
        FROM KETQUA kq
        JOIN DANGKY_THAMGIA dk ON kq.MaDangKy  = dk.MaDangKy
        JOIN SINHVIEN       sv ON dk.MaSV       = sv.MaSV
        JOIN CUOCTHI        ct ON dk.MaCuocThi  = ct.MaCuocThi
        LEFT JOIN LOP       l  ON sv.MaLop      = l.MaLop
        LEFT JOIN KHOA      k  ON l.MaKhoa      = k.MaKhoa
        WHERE ${where.join(" AND ")}
        ORDER BY kq.XepHang ASC, kq.Diem DESC
      `);

      res.json(result.recordset);
    } catch (err) {
      console.error("[/baocao/bang-vang]", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },
);

module.exports = router;
