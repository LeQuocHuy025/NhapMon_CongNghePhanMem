const express = require("express");
const router = express.Router();
const { getPool, sql } = require("../db");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const logAction = require("../helpers/logAction");

// =============================================================================
// CÔNG THỨC TÍNH TRẠNG THÁI THEO THỜI GIAN THỰC (dùng chung cho mọi câu lệnh SQL)
// Bug cũ: TrangThai chỉ được tính 1 lần lúc INSERT/UPDATE rồi lưu cứng vào DB,
// nên càng về sau giá trị càng bị "đứng hình" (sai) nếu không ai sửa cuộc thi đó.
// => Mọi lần ĐỌC (GET) hoặc đồng bộ (sync-status) đều phải tính lại theo GETDATE()
//    hiện tại rồi UPDATE ngược vào bảng CUOCTHI, để cột TrangThai trong DB luôn
//    khớp với thời gian thực, không phụ thuộc lần sửa gần nhất.
// Lưu ý: dùng DATEDIFF(SECOND,...) thay vì HOUR để khớp chính xác với cách tính
// 24h (mốc "Sắp đóng") ở phía client (computeTrangThai trong cuocthi.js màn hình).
// =============================================================================
const TRANGTHAI_CASE_SQL = `
  CASE
    WHEN GETDATE() > ThoiGianKetThuc THEN N'Đã kết thúc'
    WHEN GETDATE() >= ThoiGianBatDau
      AND DATEDIFF(SECOND, GETDATE(), ThoiGianKetThuc) < 86400 THEN N'Sắp đóng'
    WHEN GETDATE() >= ThoiGianBatDau THEN N'Đang mở'
    ELSE N'Mở sớm'
  END
`;

// Đồng bộ TrangThai trong bảng CUOCTHI theo thời gian thực.
// id = null  -> đồng bộ TẤT CẢ cuộc thi
// id = "xxx" -> chỉ đồng bộ 1 cuộc thi (dùng cho GET chi tiết, nhẹ hơn)
async function syncContestStatus(pool, id = null) {
  const request = pool.request();
  let where = "";
  if (id) {
    request.input("id", sql.NVarChar, id);
    where = "WHERE MaCuocThi = @id";
  }
  await request.query(`
    UPDATE CUOCTHI
    SET TrangThai = ${TRANGTHAI_CASE_SQL}
    ${where}
  `);
}

// GET /api/cuocthi  – Tất cả role (kể cả guest không cần token)
router.get("/", async (req, res) => {
  try {
    const pool = await getPool();
    // ✅ Đồng bộ trạng thái real-time vào DB trước khi đọc, để mọi client
    // luôn nhận TrangThai mới nhất (kể cả khi front-end fallback từ /sync-status).
    await syncContestStatus(pool);

    // Dùng View đã có sẵn trong DB
    const result = await pool.request().query(`
      SELECT * FROM VW_CUOCTHI_SOLUONG
      ORDER BY ThoiGianBatDau DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// POST /api/cuocthi/sync-status – Đồng bộ TrangThai TOÀN BỘ cuộc thi theo
// thời gian thực rồi trả về danh sách mới nhất. Front-end (screenContests)
// đã gọi endpoint này trước tiên — trước đây route này CHƯA tồn tại nên luôn
// rơi vào catch và fallback sang GET /cuocthi (không có gì để đồng bộ cả).
router.post("/sync-status", async (req, res) => {
  try {
    const pool = await getPool();
    await syncContestStatus(pool);

    const result = await pool.request().query(`
      SELECT * FROM VW_CUOCTHI_SOLUONG
      ORDER BY ThoiGianBatDau DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// GET /api/cuocthi/:id  – Chi tiết 1 cuộc thi
router.get("/:id", async (req, res) => {
  try {
    const pool = await getPool();
    // ✅ Đồng bộ trạng thái real-time cho riêng cuộc thi này trước khi đọc
    await syncContestStatus(pool, req.params.id);

    const result = await pool
      .request()
      .input("id", sql.NVarChar, req.params.id)
      .query(`SELECT * FROM VW_CUOCTHI_SOLUONG WHERE MaCuocThi = @id`);

    if (result.recordset.length === 0)
      return res.status(404).json({ message: "Không tìm thấy cuộc thi" });

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// POST /api/cuocthi  – Chỉ admin / cb
router.post("/", verifyToken, requireRole("admin", "cb"), async (req, res) => {
  const {
    TenCuocThi,
    LoaiCuocThi,
    DonViToChuc,
    DiaDiem,
    ThoiGianBatDau,
    ThoiGianKetThuc,
    SoLuongToiDa,
    MoTa,
    TrangThai,
    MaGV,
  } = req.body;

  try {
    const pool = await getPool();
    const maCT = "CT" + Math.random().toString(36).slice(2, 7).toUpperCase();

    await pool
      .request()
      .input("maCT", sql.NVarChar, maCT)
      .input("TenCuocThi", sql.NVarChar, TenCuocThi)
      .input("LoaiCuocThi", sql.NVarChar, LoaiCuocThi)
      .input("DonViToChuc", sql.NVarChar, DonViToChuc)
      .input("DiaDiem", sql.NVarChar, DiaDiem)
      .input("ThoiGianBatDau", sql.DateTime, new Date(ThoiGianBatDau))
      .input("ThoiGianKetThuc", sql.DateTime, new Date(ThoiGianKetThuc))
      .input("SoLuongToiDa", sql.Int, SoLuongToiDa)
      .input("MoTa", sql.NVarChar, MoTa)
      .input("MaGV", sql.NVarChar, MaGV).query(`
        INSERT INTO CUOCTHI
          (MaCuocThi, TenCuocThi, LoaiCuocThi, DonViToChuc, DiaDiem,
           ThoiGianBatDau, ThoiGianKetThuc, SoLuongToiDa, MoTa, TrangThai, MaGV)
        VALUES
          (@maCT, @TenCuocThi, @LoaiCuocThi, @DonViToChuc, @DiaDiem,
           @ThoiGianBatDau, @ThoiGianKetThuc, @SoLuongToiDa, @MoTa,
           CASE
             WHEN GETDATE() > @ThoiGianKetThuc THEN N'Đã kết thúc'
             WHEN GETDATE() >= @ThoiGianBatDau
               AND DATEDIFF(SECOND, GETDATE(), @ThoiGianKetThuc) < 86400 THEN N'Sắp đóng'
             WHEN GETDATE() >= @ThoiGianBatDau THEN N'Đang mở'
             ELSE N'Mở sớm'
           END,
           @MaGV)
      `);

    await logAction(
      req.user.maTK,
      "Thêm cuộc thi",
      `Thêm cuộc thi mới: ${TenCuocThi}`,
    );
    res
      .status(201)
      .json({ message: "Tạo cuộc thi thành công", MaCuocThi: maCT });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Lỗi server" });
  }
});

// PUT /api/cuocthi/:id  – Chỉ admin / cb
router.put(
  "/:id",
  verifyToken,
  requireRole("admin", "cb"),
  async (req, res) => {
    const {
      TenCuocThi,
      LoaiCuocThi,
      DonViToChuc,
      DiaDiem,
      ThoiGianBatDau,
      ThoiGianKetThuc,
      SoLuongToiDa,
      MoTa,
    } = req.body;

    try {
      const pool = await getPool();
      await pool
        .request()
        .input("id", sql.NVarChar, req.params.id)
        .input("TenCuocThi", sql.NVarChar, TenCuocThi)
        .input("LoaiCuocThi", sql.NVarChar, LoaiCuocThi)
        .input("DonViToChuc", sql.NVarChar, DonViToChuc)
        .input("DiaDiem", sql.NVarChar, DiaDiem)
        .input("ThoiGianBatDau", sql.DateTime, new Date(ThoiGianBatDau))
        .input("ThoiGianKetThuc", sql.DateTime, new Date(ThoiGianKetThuc))
        .input("SoLuongToiDa", sql.Int, SoLuongToiDa)
        .input("MoTa", sql.NVarChar, MoTa).query(`
        UPDATE CUOCTHI SET
          TenCuocThi=@TenCuocThi, LoaiCuocThi=@LoaiCuocThi,
          DonViToChuc=@DonViToChuc, DiaDiem=@DiaDiem,
          ThoiGianBatDau=@ThoiGianBatDau, ThoiGianKetThuc=@ThoiGianKetThuc,
          SoLuongToiDa=@SoLuongToiDa, MoTa=@MoTa,
          TrangThai = CASE
            WHEN GETDATE() > @ThoiGianKetThuc THEN N'Đã kết thúc'
            WHEN GETDATE() >= @ThoiGianBatDau
              AND DATEDIFF(SECOND, GETDATE(), @ThoiGianKetThuc) < 86400 THEN N'Sắp đóng'
            WHEN GETDATE() >= @ThoiGianBatDau THEN N'Đang mở'
            ELSE N'Mở sớm'
          END
        WHERE MaCuocThi = @id
      `);

      await logAction(
        req.user.maTK,
        "Cập nhật",
        `Sửa cuộc thi: ${req.params.id}`,
      );
      res.json({ message: "Cập nhật thành công" });
    } catch (err) {
      res.status(500).json({ message: "Lỗi server" });
    }
  },
);

// DELETE /api/cuocthi/:id  – Chỉ admin
router.delete("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const pool = await getPool();
    await pool
      .request()
      .input("id", sql.NVarChar, req.params.id)
      .query(`DELETE FROM CUOCTHI WHERE MaCuocThi = @id`);

    await logAction(
      req.user.maTK,
      "Xóa cuộc thi",
      `Xóa cuộc thi: ${req.params.id}`,
    );
    res.json({ message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
