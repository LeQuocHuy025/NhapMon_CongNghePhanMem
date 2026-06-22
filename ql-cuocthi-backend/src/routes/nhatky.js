const express = require("express");
const router = express.Router();
const { getPool, sql } = require("../db");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

/* ============================================================
   HELPER: Xây WHERE clause + gán input cho cả 2 query (count + data)
   Trả về { whereSql: string, bindInputs: (req) => void }
   ============================================================ */
function buildWhere(query) {
  const parts = ["1=1"];
  const binders = [];

  // Tìm theo tên đăng nhập (LIKE – không index-friendly với leading %, nhưng
  // thường kết hợp với filter ngày nên vẫn nhanh)
  if (query.q && query.q.trim()) {
    parts.push("tk.TenDangNhap LIKE @q");
    binders.push((r) => r.input("q", sql.NVarChar, `%${query.q.trim()}%`));
  }

  // Khoảng thời gian — đây là filter QUAN TRỌNG NHẤT, nên có INDEX trên ThoiGian
  if (query.tuNgay) {
    parts.push("nk.ThoiGian >= @tuNgay");
    // Cộng 00:00:00 để đảm bảo bao gồm từ đầu ngày
    binders.push((r) =>
      r.input("tuNgay", sql.DateTime, new Date(query.tuNgay + "T00:00:00")),
    );
  }
  if (query.denNgay) {
    parts.push("nk.ThoiGian <= @denNgay");
    // 23:59:59.999 để bao gồm hết ngày cuối
    binders.push((r) =>
      r.input("denNgay", sql.DateTime, new Date(query.denNgay + "T23:59:59")),
    );
  }

  // Lọc theo loại hành động
  if (query.hanhDong && query.hanhDong !== "all") {
    parts.push("nk.HanhDong = @hanhDong");
    binders.push((r) => r.input("hanhDong", sql.NVarChar, query.hanhDong));
  }

  // Lọc theo vai trò người dùng
  if (query.vaiTro && query.vaiTro !== "all") {
    parts.push("vt.MaVaiTro = @vaiTro");
    binders.push((r) => r.input("vaiTro", sql.NVarChar, query.vaiTro));
  }

  const whereSql = parts.join(" AND ");

  // Hàm bind: nhận sql.Request và attach tất cả inputs
  const bind = (req) => binders.forEach((fn) => fn(req));

  return { whereSql, bind };
}

/* ============================================================
   GET /api/nhatky/meta
   Trả về danh sách hành động phân biệt (cho dropdown filter)
   Giới hạn 30 ngày gần nhất để không scan toàn bảng
   ============================================================ */
router.get("/meta", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT DISTINCT HanhDong
        FROM NHATKY
        WHERE ThoiGian >= DATEADD(DAY, -180, GETDATE())
        ORDER BY HanhDong
      `);

    res.json({
      hanhDong: result.recordset.map((r) => r.HanhDong).filter(Boolean),
    });
  } catch (err) {
    console.error("[/nhatky/meta]", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* ============================================================
   GET /api/nhatky
   Query params:
     page      – số trang, bắt đầu từ 1 (default: 1)
     limit     – số dòng mỗi trang, max 200 (default: 50)
     q         – tìm kiếm TenDangNhap
     tuNgay    – từ ngày, ISO "2025-01-01"
     denNgay   – đến ngày
     hanhDong  – "Đăng ký" | "Duyệt" | ... | "all"
     vaiTro    – "sv" | "gv" | "cb" | "admin" | "all"

   Response: { data, total, page, limit, totalPages }

   ⚡ PERFORMANCE: Cần tạo index sau (xem README):
     CREATE INDEX IX_NHATKY_ThoiGian ON NHATKY(ThoiGian DESC);
     CREATE INDEX IX_NHATKY_MaTK     ON NHATKY(MaTK);
     CREATE INDEX IX_NHATKY_HanhDong ON NHATKY(HanhDong);
   ============================================================ */
router.get("/", verifyToken, requireRole("admin"), async (req, res) => {
  // ── Đọc & ép kiểu params ─────────────────────────────────
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
  const offset = (page - 1) * limit;

  const { whereSql, bind } = buildWhere(req.query);

  // Base JOIN (dùng chung cho count và data)
  // LEFT JOIN để log từ route chưa có verifyToken vẫn hiện (maTK = null)
  const joinSql = `
      FROM NHATKY nk
      LEFT JOIN TAIKHOAN tk ON nk.MaTK    = tk.MaTK
      LEFT JOIN VAITRO   vt ON tk.MaVaiTro = vt.MaVaiTro
    `;

  try {
    const pool = await getPool();

    // ── 1) Đếm tổng dòng (cùng điều kiện WHERE) ──────────
    // Với bảng >1 triệu dòng + không có filter ngày →
    // query này sẽ full-scan. Giải pháp: luôn khuyến khích
    // admin chọn khoảng ngày trước khi tìm kiếm (xử lý ở UI).
    //
    // Nếu muốn faster, thêm hint NOLOCK (chấp nhận dirty read):
    //   FROM NHATKY nk WITH (NOLOCK) JOIN ...
    const countReq = pool.request();
    bind(countReq);
    const countRs = await countReq.query(`
        SELECT COUNT(1) AS total
        ${joinSql}
        WHERE ${whereSql}
      `);
    const total = countRs.recordset[0]?.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // ── 2) Lấy dữ liệu trang hiện tại ────────────────────
    const dataReq = pool.request();
    bind(dataReq);
    dataReq.input("offset", sql.Int, offset);
    dataReq.input("limit", sql.Int, limit);

    const dataRs = await dataReq.query(`
        SELECT
          nk.ThoiGian,
          nk.HanhDong,
          nk.MoTa,
          nk.MaTK,
          tk.TenDangNhap,
          vt.MaVaiTro,
          vt.TenVaiTro
        ${joinSql}
        WHERE ${whereSql}
        ORDER BY nk.ThoiGian DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    res.json({
      data: dataRs.recordset,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (err) {
    console.error("[/nhatky]", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* ============================================================
   GET /api/nhatky/export
   Giống query GET / nhưng KHÔNG phân trang – xuất toàn bộ
   kết quả filter (giới hạn tối đa 10 000 dòng để bảo vệ server).
   Dùng cho nút "Xuất Excel" ở frontend.
   ============================================================ */
router.get("/export", verifyToken, requireRole("admin"), async (req, res) => {
  const { whereSql, bind } = buildWhere(req.query);

  const joinSql = `
      FROM NHATKY nk
      LEFT JOIN TAIKHOAN tk ON nk.MaTK     = tk.MaTK
      LEFT JOIN VAITRO   vt ON tk.MaVaiTro = vt.MaVaiTro
    `;

  try {
    const pool = await getPool();
    const dataReq = pool.request();
    bind(dataReq);

    const result = await dataReq.query(`
        SELECT TOP 10000
          nk.ThoiGian,
          nk.HanhDong,
          nk.MoTa,
          nk.MaTK,
          tk.TenDangNhap,
          vt.MaVaiTro,
          vt.TenVaiTro
        ${joinSql}
        WHERE ${whereSql}
        ORDER BY nk.ThoiGian DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("[/nhatky/export]", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
