const express = require("express");
const router = express.Router();
const { getPool, sql } = require("../db");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const logAction = require("../helpers/logAction");

// GET /api/cuocthi  – Tất cả role (kể cả guest không cần token)
router.get("/", async (req, res) => {
  try {
    const pool = await getPool();
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

// GET /api/cuocthi/:id  – Chi tiết 1 cuộc thi
router.get("/:id", async (req, res) => {
  try {
    const pool = await getPool();
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
      .input("TrangThai", sql.NVarChar, TrangThai || "Mở sớm")
      .input("MaGV", sql.NVarChar, MaGV).query(`
        INSERT INTO CUOCTHI
          (MaCuocThi, TenCuocThi, LoaiCuocThi, DonViToChuc, DiaDiem,
           ThoiGianBatDau, ThoiGianKetThuc, SoLuongToiDa, MoTa, TrangThai, MaGV)
        VALUES
          (@maCT, @TenCuocThi, @LoaiCuocThi, @DonViToChuc, @DiaDiem,
           @ThoiGianBatDau, @ThoiGianKetThuc, @SoLuongToiDa, @MoTa, @TrangThai, @MaGV)
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
      TrangThai,
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
        .input("MoTa", sql.NVarChar, MoTa)
        .input("TrangThai", sql.NVarChar, TrangThai).query(`
        UPDATE CUOCTHI SET
          TenCuocThi=@TenCuocThi, LoaiCuocThi=@LoaiCuocThi,
          DonViToChuc=@DonViToChuc, DiaDiem=@DiaDiem,
          ThoiGianBatDau=@ThoiGianBatDau, ThoiGianKetThuc=@ThoiGianKetThuc,
          SoLuongToiDa=@SoLuongToiDa, MoTa=@MoTa, TrangThai=@TrangThai
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
