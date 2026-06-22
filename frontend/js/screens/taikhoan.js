// js/screens/taikhoan.js
// Màn hình "Quản lý tài khoản" (khóa/mở khóa) và "Phân quyền".
// (Tách nguyên văn từ js/screens.js – không đổi logic)

// =============================================================================
// TÀI KHOẢN
// Quản lý tài khoản người dùng: xem, khóa/mở khóa
// =============================================================================

/** Tải và render danh sách tài khoản */
async function screenAccounts() {
  try {
    const data = await API.get("/taikhoan");

    const tbody = document.getElementById("accounts-tbody");

    if (!tbody) return;

    tbody.innerHTML = data
      .map(
        (tk) => `
      <tr>
        <td>${tk.MaTK}</td>
        <td>${tk.TenDangNhap}</td>
        <td>${tk.HoTen || ""}</td>
        <td>${tk.TenVaiTro}</td>
        <td>
          <span class="badge ${
            tk.TrangThai === "Hoạt động" ? "badge-green" : "badge-red"
          }">
            ${tk.TrangThai}
          </span>
        </td>
        <td class="action-cell">
          <button
            class="btn btn-sm"
            onclick="toggleKhoaTK('${tk.MaTK}', '${tk.TrangThai}')"
          >
            ${tk.TrangThai === "Hoạt động" ? "Khóa" : "Mở khóa"}
          </button>
        </td>

      </tr>
    `,
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

/** Đổi trạng thái tài khoản giữa "Hoạt động" và "Bị khóa", sau đó reload bảng */
async function toggleKhoaTK(id, trangThaiHienTai) {
  const moi = trangThaiHienTai === "Hoạt động" ? "Bị khóa" : "Hoạt động";
  try {
    await API.put("/taikhoan/" + id + "/khoa", { TrangThai: moi });
    screenAccounts();
  } catch (e) {
    alert(e.message);
  }
}

// =============================================================================
// PHÂN QUYỀN
// Xem danh sách quyền hạn theo vai trò
// =============================================================================

/** Tải và render bảng phân quyền */
async function screenPermissions() {
  try {
    const data = await API.get("/phanquyen");
    const tbody = document.getElementById("permissions-tbody");
    if (!tbody) return;

    tbody.innerHTML = data
      .map(
        (pq) => `
      <tr>
        <td>${pq.TenVaiTro}</td>
        <td>${pq.TenChucNang}</td>
        <td>${pq.QuyenHan}</td>
        <td><span class="badge badge-green">${pq.TrangThai}</span></td>
      </tr>
    `,
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}
