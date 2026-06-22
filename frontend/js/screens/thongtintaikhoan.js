// js/screens/thongtintaikhoan.js
// Màn hình "Thông tin tài khoản của tôi" (profile).
// (Tách nguyên văn từ js/screens.js – không đổi logic)

// =============================================================================
// THÔNG TIN TÀI KHOẢN CỦA TÔI
// Hiển thị thông tin cá nhân lấy từ backend, có chọn lọc theo vai trò
// =============================================================================

/**
 * Tải thông tin tài khoản hiện tại từ API /auth/profile.
 * Backend trả về các trường tuỳ theo vai trò (sv / gv / cb / admin).
 */
async function screenProfile() {
  const wrap = document.getElementById("profile-wrap");
  if (!wrap) return;

  // Hiển thị skeleton loading
  wrap.innerHTML = `<div class="profile-loading"><i class="ti ti-loader ti-spin"></i> Đang tải thông tin...</div>`;

  try {
    const p = await API.get("/auth/profile");

    /* ---------- Avatar / tên / badge ---------- */
    const initial = (p.HoTen || p.TenDangNhap || "?")[0].toUpperCase();
    const roleLabel =
      {
        admin: "Quản trị viên",
        cb: "Cán bộ quản lý",
        sv: "Sinh viên",
        gv: "Giảng viên",
        guest: "Khách",
      }[p.role] || p.role;
    const roleCls =
      {
        admin: "role-admin",
        cb: "role-cb",
        sv: "role-sv",
        gv: "role-gv",
        guest: "role-guest",
      }[p.role] || "";

    /* ---------- Các hàng thông tin chung ---------- */
    const rows = [];

    const addRow = (icon, label, value) => {
      if (!value && value !== 0) return;
      rows.push(`
        <div class="profile-row">
          <span class="profile-row-icon"><i class="ti ${icon}"></i></span>
          <span class="profile-row-label">${label}</span>
          <span class="profile-row-value">${value}</span>
        </div>`);
    };

    addRow("ti-id-badge", "Tên đăng nhập", p.TenDangNhap);
    addRow("ti-mail", "Email", p.Email);
    addRow("ti-phone", "Số điện thoại", p.SDT);
    addRow(
      "ti-calendar",
      "Ngày sinh",
      p.NgaySinh ? new Date(p.NgaySinh).toLocaleDateString("vi-VN") : null,
    );
    addRow("ti-gender-bigender", "Giới tính", p.GioiTinh);

    // Sinh viên
    addRow("ti-school", "Mã sinh viên", p.MaSV);
    addRow("ti-building", "Lớp", p.TenLop);
    addRow("ti-home", "Khoa", p.TenKhoa);

    // Giảng viên / Cán bộ
    addRow("ti-id", "Mã giảng viên", p.MaGV);
    addRow("ti-building-bank", "Khoa phụ trách", p.TenKhoa);

    // Tài khoản chung
    addRow("ti-shield-check", "Trạng thái TK", p.TrangThai);

    /* ---------- Thống kê nhỏ (sv) ---------- */
    let statsHtml = "";
    if (p.role === "sv" && p.thongKe) {
      const tk = p.thongKe;
      statsHtml = `
        <div class="profile-stats">
          <div class="profile-stat-card">
            <div class="profile-stat-num">${tk.tongDangKy ?? 0}</div>
            <div class="profile-stat-lbl">Tổng đăng ký</div>
          </div>
          <div class="profile-stat-card">
            <div class="profile-stat-num">${tk.daDuyet ?? 0}</div>
            <div class="profile-stat-lbl">Đã duyệt</div>
          </div>
          <div class="profile-stat-card">
            <div class="profile-stat-num">${tk.choDuyet ?? 0}</div>
            <div class="profile-stat-lbl">Chờ duyệt</div>
          </div>
          <div class="profile-stat-card">
            <div class="profile-stat-num">${tk.giai ?? 0}</div>
            <div class="profile-stat-lbl">Giải đã đạt</div>
          </div>
        </div>`;
    }

    /* ---------- Render ---------- */
    wrap.innerHTML = `
      <div class="profile-card">
        <!-- Header avatar -->
        <div class="profile-header">
          <div class="profile-avatar">${initial}</div>
          <div class="profile-header-info">
            <div class="profile-name">${p.HoTen || p.TenDangNhap || "—"}</div>
            <span class="role-badge ${roleCls}" style="font-size:12px">${roleLabel}</span>
          </div>
          <button class="btn btn-sm" style="margin-left:auto" onclick="showChangePassword()">
            <i class="ti ti-key"></i> Đổi mật khẩu
          </button>
        </div>

        <!-- Thông tin chi tiết -->
        <div class="profile-section-title">Thông tin cá nhân</div>
        <div class="profile-rows">
          ${rows.join("") || "<p style='color:#888;font-size:13px'>Không có thông tin bổ sung.</p>"}
        </div>

        ${statsHtml ? `<div class="profile-section-title" style="margin-top:20px">Thống kê hoạt động</div>${statsHtml}` : ""}
      </div>`;
  } catch (e) {
    wrap.innerHTML = `<div class="profile-loading" style="color:#f87171">
      <i class="ti ti-alert-circle"></i> Không thể tải thông tin: ${e.message}
    </div>`;
    console.error(e);
  }
}
