const { getPool, sql } = require("../db");

/**
 * @param {string|null} maTK      Mã tài khoản thực hiện (req.user.maTK)
 * @param {string}      hanhDong  Loại hành động: "Đăng ký", "Duyệt", "Từ chối", "Xóa"…
 * @param {string}      moTa      Mô tả chi tiết
 */
async function logAction(maTK, hanhDong, moTa) {
  try {
    const pool = await getPool();

    // Date.now() base36 = 8 ký tự + 2 ký tự random = "NK" + 8 + 2 = 12 → dùng 8 random thay
    const maNK = "NK" + Math.random().toString(36).slice(2, 10).toUpperCase();

    await pool
      .request()
      .input("MaNK", sql.VarChar, maNK)
      .input("MaTK", sql.VarChar, maTK || null)
      .input("HanhDong", sql.NVarChar, (hanhDong || "").slice(0, 100))
      .input("MoTa", sql.NVarChar, (moTa || "").slice(0, 500)).query(`
        INSERT INTO NHATKY (MaNhatKy, MaTK, ThoiGian, HanhDong, MoTa)
        VALUES (@MaNK, @MaTK, GETDATE(), @HanhDong, @MoTa)
      `);
  } catch (err) {
    // KHÔNG throw → không block nghiệp vụ chính khi ghi log thất bại
    // Nhưng PHẢI log ra console để dễ debug
    console.error("[logAction FAILED]", {
      maTK,
      hanhDong,
      moTa: (moTa || "").slice(0, 80),
      error: err.message,
    });
  }
}

module.exports = logAction;
