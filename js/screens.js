// js/screens.js
// Mỗi hàm tương ứng một màn hình, được gọi tự động bởi router.js

/** Gán nội dung text cho element theo id. Hiển thị "-" nếu value rỗng/null */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "-";
}

/** Định dạng chuỗi ngày giờ sang định dạng tiếng Việt */
function formatDate(str) {
  if (!str) return "-";
  return new Date(str).toLocaleString("vi-VN");
}

/** Trả về CSS class badge tương ứng với trạng thái */
function badgeClass(trangThai) {
  const map = {
    "Đang mở": "badge-green",
    "Mở sớm": "badge-blue",
    "Sắp đóng": "badge-amber",
    "Đã kết thúc": "badge-gray",
    "Đã duyệt": "badge-green",
    "Chờ duyệt": "badge-amber",
    "Từ chối": "badge-red",
    "Đã xác nhận": "badge-teal",
    "Chờ xác nhận": "badge-amber",
  };
  return map[trangThai] || "badge-gray";
}

// DASHBOARD
// Thay hàm screenDashboard() cũ trong js/screens.js bằng toàn bộ khối này.

/* ------------------------------------------------------------------
   Màu badge theo TrangThai cuộc thi
   ------------------------------------------------------------------ */
// =============================================================================
// DASHBOARD  – xây lại hoàn chỉnh, role-aware
// Thay hàm screenDashboard() cũ trong js/screens.js bằng toàn bộ khối này.
// =============================================================================

/* ------------------------------------------------------------------
   Màu badge theo TrangThai cuộc thi
   ------------------------------------------------------------------ */
const CONTEST_STATUS_CLS = {
  "Đang mở": "badge-green",
  "Mở sớm": "badge-blue",
  "Sắp đóng": "badge-amber",
  "Đã kết thúc": "badge-gray",
};

/* ------------------------------------------------------------------
   Màu / icon badge theo loại hành động nhật ký
   ------------------------------------------------------------------ */
const ACTION_CLS = {
  "Đăng ký": { cls: "badge-blue", icon: "ti-user-plus" },
  Duyệt: { cls: "badge-green", icon: "ti-check" },
  "Từ chối": { cls: "badge-red", icon: "ti-x" },
  "Xác nhận": { cls: "badge-teal", icon: "ti-circle-check" },
  Hủy: { cls: "badge-amber", icon: "ti-ban" },
  "Thêm sinh viên": { cls: "badge-blue", icon: "ti-user-plus" },
  "Xóa sinh viên": { cls: "badge-red", icon: "ti-trash" },
  "Thêm giảng viên": { cls: "badge-blue", icon: "ti-user-plus" },
  "Thêm cuộc thi": { cls: "badge-blue", icon: "ti-trophy" },
  "Sửa cuộc thi": { cls: "badge-blue", icon: "ti-edit" },
  "Xóa cuộc thi": { cls: "badge-red", icon: "ti-trash" },
  "Thêm kết quả": { cls: "badge-teal", icon: "ti-medal" },
  "Đổi mật khẩu": { cls: "badge-gray", icon: "ti-key" },
  "Khóa tài khoản": { cls: "badge-red", icon: "ti-lock" },
  "Mở khóa tài khoản": { cls: "badge-green", icon: "ti-lock-open" },
  "Xuất Excel": { cls: "badge-gray", icon: "ti-download" },
};

/* ------------------------------------------------------------------
   Thời gian tương đối: "2 giờ trước", "hôm qua"…
   ------------------------------------------------------------------ */
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

/* ------------------------------------------------------------------
   Render stat cards theo role
   ------------------------------------------------------------------ */
function renderDashStats(s) {
  const grid = document.getElementById("dash-stats-grid");
  if (!grid) return;

  let cards = [];

  if (s.role === "sv") {
    cards = [
      {
        label: "Cuộc thi đang mở",
        value: s.cuocThiDangMo,
        icon: "ti-trophy",
        sub: "Có thể đăng ký",
      },
      {
        label: "Đăng ký của tôi",
        value: s.tongDangKy,
        icon: "ti-list",
        sub: `${s.daDuyet || 0} đã được duyệt`,
      },
      {
        label: "Đã duyệt",
        value: s.daDuyet,
        icon: "ti-check",
        sub: "Chờ thi đấu",
      },
      {
        label: "Giải đạt được",
        value: s.soGiai,
        icon: "ti-medal",
        sub: "Thành tích của bạn",
      },
    ];
  } else if (s.role === "gv") {
    cards = [
      {
        label: "Cuộc thi phụ trách",
        value: s.cuocThiPhuTrach,
        icon: "ti-trophy",
        sub: "Tổng cộng",
      },
      {
        label: "Chờ xác nhận",
        value: s.choXacNhan,
        icon: "ti-clock",
        sub: "Cần xử lý",
        urgent: s.choXacNhan > 0,
      },
      {
        label: "Đã xác nhận",
        value: s.daXacNhan,
        icon: "ti-circle-check",
        sub: "Sinh viên hợp lệ",
      },
      {
        label: "Tổng kết quả",
        value: s.tongKetQua,
        icon: "ti-medal",
        sub: "Đã nhập kết quả",
      },
    ];
  } else if (s.role === "guest") {
    cards = [
      {
        label: "Cuộc thi đang mở",
        value: s.cuocThiDangMo,
        icon: "ti-trophy",
        sub: "Đang nhận đăng ký",
      },
      {
        label: "Tổng cuộc thi",
        value: s.tongCuocThi,
        icon: "ti-list",
        sub: "Đã tổ chức",
      },
      {
        label: "Sinh viên tham gia",
        value: s.tongSinhVien,
        icon: "ti-users",
        sub: "Trong hệ thống",
      },
      {
        label: "Giải thưởng",
        value: s.tongGiai,
        icon: "ti-medal",
        sub: "Đã trao",
      },
    ];
  } else {
    // admin / cb
    const tyLeDuyet =
      s.choDuyet + s.daDuyet > 0
        ? Math.round((s.daDuyet / (s.choDuyet + s.daDuyet)) * 100)
        : 0;
    cards = [
      {
        label: "Tổng sinh viên",
        value: s.tongSinhVien,
        icon: "ti-users",
        sub: `${s.tongGiangVien || 0} giảng viên`,
      },
      {
        label: "Cuộc thi đang mở",
        value: s.dangMo,
        icon: "ti-trophy",
        sub: `${s.dangHoatDong || 0} đang hoạt động`,
      },
      {
        label: "Chờ duyệt",
        value: s.choDuyet,
        icon: "ti-clock",
        sub: `Tỷ lệ duyệt: ${tyLeDuyet}%`,
        urgent: s.choDuyet > 0,
      },
      {
        label: "Giải đã trao",
        value: s.tongGiai,
        icon: "ti-medal",
        sub: `${s.tongCuocThi || 0} tổng cuộc thi`,
      },
    ];
  }

  grid.innerHTML = cards
    .map(
      (c) => `
    <div class="stat-card${c.urgent ? " stat-card-urgent" : ""}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <div class="stat-label">${c.label}</div>
        <i class="ti ${c.icon}" style="font-size:20px;opacity:.4"></i>
      </div>
      <div class="stat-value">${c.value ?? 0}</div>
      ${c.sub ? `<div class="stat-sub">${c.sub}</div>` : ""}
    </div>
  `,
    )
    .join("");
}

/* ------------------------------------------------------------------
   Render danh sách cuộc thi sắp diễn ra – layout theo cột thẳng hàng
   ------------------------------------------------------------------ */
function renderDashContests(contests) {
  const el = document.getElementById("dash-contest-list");
  if (!el) return;

  if (!contests.length) {
    el.innerHTML = `<div style="color:#666;font-size:13px;padding:16px 0">Không có cuộc thi nào sắp diễn ra.</div>`;
    return;
  }

  const loaiBadge = {
    "Học thuật": "#6366f1",
    NCKH: "#14b8a6",
    "Khởi nghiệp": "#f59e0b",
    "Văn nghệ": "#a855f7",
    "Thể thao": "#22c55e",
    CNTT: "#3b82f6",
  };

  // Header cột
  const header = `
    <div style="
      display:grid;
      grid-template-columns:1fr 88px 88px 140px 108px;
      gap:10px;
      padding:6px 14px 6px;
      font-size:11px;
      color:#555;
      text-transform:uppercase;
      letter-spacing:.04em;
      border-bottom:1px solid #222;
      margin-bottom:4px;
    ">
      <div>Tên cuộc thi</div>
      <div>Loại</div>
      <div>Ngày bắt đầu</div>
      <div>Địa điểm</div>
      <div style="text-align:right">Đăng ký</div>
    </div>`;

  const rows = contests
    .map((ct) => {
      const max = ct.SoLuongToiDa || 0;
      const current = ct.SoLuongDaDangKy || 0;
      const pct =
        max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
      const barColor =
        pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#6366f1";
      const loaiColor = loaiBadge[ct.LoaiCuocThi] || "#6b7280";
      const dateStr = ct.ThoiGianBatDau
        ? new Date(ct.ThoiGianBatDau).toLocaleDateString("vi-VN")
        : "—";
      return `
      <div style="
        display:grid;
        grid-template-columns:1fr 88px 88px 140px 108px;
        gap:10px;
        align-items:center;
        padding:9px 14px;
        border-radius:8px;
        transition:background .15s;
        cursor:default;
      "
      onmouseover="this.style.background='#1a1a1a'"
      onmouseout="this.style.background=''"
      >
        <!-- Tên cuộc thi -->
        <div style="min-width:0">
          <span style="
            font-size:13.5px;
            font-weight:500;
            color:#e5e7eb;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
            display:block;
          ">
            ${ct.TenCuocThi}
          </span>
        </div>

        <!-- Loại -->
        <div>
          <span style="
            font-size:11px;font-weight:600;
            padding:2px 8px;border-radius:4px;
            background:${loaiColor}22;color:${loaiColor};
            white-space:nowrap;
          ">${ct.LoaiCuocThi || "—"}</span>
        </div>

        <!-- Ngày -->
        <div style="font-size:12px;color:#9ca3af;white-space:nowrap">
          <i class="ti ti-calendar" style="font-size:11px;margin-right:3px"></i>${dateStr}
        </div>

        <!-- Địa điểm -->
        <div style="font-size:12px;color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
             title="${ct.DiaDiem || ""}">
          <i class="ti ti-map-pin" style="font-size:11px;margin-right:3px"></i>${ct.DiaDiem || "—"}
        </div>

        <!-- Đăng ký + progress bar -->
        <div style="text-align:right">
          <div style="font-size:12px;color:#9ca3af;margin-bottom:4px;white-space:nowrap">
            ${current}<span style="color:#4b5563"> / ${max > 0 ? max : "∞"}</span>
          </div>
          ${
            max > 0
              ? `
          <div style="height:4px;background:#2a2a2a;border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${barColor};border-radius:2px;transition:width .4s"></div>
          </div>`
              : ""
          }
        </div>
      </div>`;
    })
    .join("");

  el.innerHTML = header + rows;
}

/* ------------------------------------------------------------------
   Render hoạt động gần đây (NHATKY)
   ------------------------------------------------------------------ */
function renderDashActivity(logs) {
  const el = document.getElementById("dash-activity-list");
  if (!el) return;

  if (!logs.length) {
    el.innerHTML = `<div style="color:#666;font-size:13px;padding:8px 0">Chưa có hoạt động nào.</div>`;
    return;
  }

  el.innerHTML = logs
    .map((nk) => {
      const meta = ACTION_CLS[nk.HanhDong] || {
        cls: "badge-gray",
        icon: "ti-activity",
      };
      return `
      <div style="display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid #222">
        <div style="margin-top:2px;flex-shrink:0">
          <span class="badge ${meta.cls}" style="padding:3px 5px;font-size:11px">
            <i class="ti ${meta.icon}"></i>
          </span>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px">
            <strong>${nk.TenDangNhap || "—"}</strong>
            <span style="color:#888;font-size:12px"> – ${nk.HanhDong}</span>
          </div>
          <div style="font-size:12px;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nk.MoTa || ""}</div>
        </div>
        <div style="font-size:11px;color:#555;flex-shrink:0;margin-top:2px">${timeAgo(nk.ThoiGian)}</div>
      </div>`;
    })
    .join("");
}

/* ------------------------------------------------------------------
   screenDashboard() – Entry point, router gọi khi vào màn Dashboard
   ------------------------------------------------------------------ */
async function screenDashboard() {
  // Hiện skeleton loading
  const grid = document.getElementById("dash-stats-grid");
  if (grid)
    grid.innerHTML = `
    ${[1, 2, 3, 4]
      .map(
        () => `
      <div class="stat-card" style="opacity:.4">
        <div class="stat-label">Đang tải...</div>
        <div class="stat-value">—</div>
      </div>`,
      )
      .join("")}`;

  ["dash-contest-list", "dash-activity-list"].forEach((id) => {
    const el = document.getElementById(id);
    if (el)
      el.innerHTML = `<div style="color:#555;font-size:13px;padding:8px 0">
      <i class="ti ti-loader ti-spin"></i> Đang tải...
    </div>`;
  });

  // Gọi song song 3 endpoint (bỏ notifications)
  const [stats, upcoming, activity] = await Promise.allSettled([
    API.get("/dashboard/stats"),
    API.get("/dashboard/upcoming"),
    API.get("/dashboard/activity"),
  ]);

  if (stats.status === "fulfilled") renderDashStats(stats.value);
  if (upcoming.status === "fulfilled") renderDashContests(upcoming.value);
  if (activity.status === "fulfilled") renderDashActivity(activity.value);
}

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

// Quản lý danh sách cuộc thi: xem, thêm, sửa, xóa
// =============================================================================

/** Tải danh sách cuộc thi, populate filter dropdowns, render bảng có search/filter */
async function screenContests() {
  try {
    const data = await API.get("/cuocthi");

    // Populate dropdown lọc theo loại cuộc thi (chỉ load lần đầu)
    const loaiSelect = document.getElementById("filter-loai");
    if (loaiSelect && loaiSelect.options.length <= 1) {
      const dsLoai = [...new Set(data.map((ct) => ct.LoaiCuocThi))];
      loaiSelect.innerHTML =
        `<option value="all">Tất cả loại</option>` +
        dsLoai
          .map((loai) => `<option value="${loai}">${loai}</option>`)
          .join("");
    }

    // Populate dropdown lọc theo trạng thái (chỉ load lần đầu)
    const trangThaiSelect = document.getElementById("filter-trangthai");
    if (trangThaiSelect && trangThaiSelect.options.length <= 1) {
      const dsTrangThai = [...new Set(data.map((ct) => ct.TrangThai))];
      trangThaiSelect.innerHTML =
        `<option value="all">Tất cả trạng thái</option>` +
        dsTrangThai
          .map((tt) => `<option value="${tt}">${tt}</option>`)
          .join("");
    }

    // Lấy giá trị search và filter hiện tại
    const keyword =
      document.getElementById("search-contest")?.value.toLowerCase() || "";
    const loai = document.getElementById("filter-loai")?.value || "";
    const trangThai = document.getElementById("filter-trangthai")?.value || "";

    // Lọc dữ liệu theo keyword, loại và trạng thái
    const filtered = data.filter((ct) => {
      const matchKeyword =
        ct.TenCuocThi.toLowerCase().includes(keyword) ||
        ct.MaCuocThi.toLowerCase().includes(keyword);
      const matchLoai = loai === "all" || !loai || ct.LoaiCuocThi === loai;
      const matchTrangThai =
        trangThai === "all" || !trangThai || ct.TrangThai === trangThai;
      return matchKeyword && matchLoai && matchTrangThai;
    });

    const tbody = document.getElementById("contests-tbody");
    if (!tbody) return;

    // Render bảng
    tbody.innerHTML = filtered
      .map(
        (ct) => `
      <tr>
        <td>${ct.MaCuocThi}</td>
        <td>${ct.TenCuocThi}</td>
        <td>${ct.LoaiCuocThi}</td>
        <td>${formatDate(ct.ThoiGianBatDau)}</td>
        <td>${formatDate(ct.ThoiGianKetThuc)}</td>
        <td>${ct.DiaDiem || "-"}</td>
        <td>${ct.SoLuongDangKy || 0}/${ct.SoLuongToiDa || 0}</td>
        <td>
          <span class="badge ${badgeClass(ct.TrangThai)}">
            ${ct.TrangThai}
          </span>
        </td>
        <td class="action-cell">
          <button class="btn btn-sm"
            onclick="editContest('${ct.MaCuocThi}')">
            Sửa
          </button>
          <button class="btn btn-sm btn-danger"
            onclick="deleteContest('${ct.MaCuocThi}')">
            Xóa
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

/** Xóa cuộc thi sau khi xác nhận, sau đó reload bảng */
async function deleteContest(id) {
  if (!confirm("Xóa cuộc thi này?")) return;
  try {
    await API.delete("/cuocthi/" + id);
    screenContests(); // reload lại bảng
  } catch (e) {
    alert(e.message);
  }
}

/** Mở modal thêm mới cuộc thi (reset toàn bộ form) */
async function addContest() {
  editingContestId = null;

  document.getElementById("edit-ten").value = "";
  document.getElementById("edit-loai").value = "";
  document.getElementById("edit-diadiem").value = "";
  document.getElementById("edit-trangthai").value = "Mở sớm";
  document.getElementById("edit-batdau").value = "";
  document.getElementById("edit-ketthuc").value = "";
  document.getElementById("edit-soluong").value = "";

  document.querySelector("#contest-modal .section-title").textContent =
    "Thêm cuộc thi";
  document.querySelector("#contest-modal .btn.btn-primary").textContent =
    "Thêm";

  document.getElementById("contest-modal").style.display = "flex";
}

// Lưu id đang được chỉnh sửa (null = đang thêm mới)
let editingContestId = null;

/** Tải thông tin cuộc thi lên modal để chỉnh sửa */
async function editContest(id) {
  try {
    const old = await API.get("/cuocthi/" + id);

    editingContestId = id;

    document.getElementById("edit-ten").value = old.TenCuocThi || "";
    document.getElementById("edit-loai").value = old.LoaiCuocThi || "";
    document.getElementById("edit-diadiem").value = old.DiaDiem || "";
    document.getElementById("edit-trangthai").value = old.TrangThai || "";
    document.getElementById("edit-batdau").value = old.ThoiGianBatDau
      ? old.ThoiGianBatDau.slice(0, 16)
      : "";
    document.getElementById("edit-ketthuc").value = old.ThoiGianKetThuc
      ? old.ThoiGianKetThuc.slice(0, 16)
      : "";
    document.getElementById("edit-soluong").value = old.SoLuongToiDa || 0;

    document.querySelector("#contest-modal .section-title").textContent =
      "Sửa cuộc thi";
    document.querySelector("#contest-modal .btn.btn-primary").textContent =
      "Lưu";

    document.getElementById("contest-modal").style.display = "flex";
  } catch (e) {
    console.error(e);
    alert("Lỗi tải dữ liệu");
  }
}

/** Lưu cuộc thi: thêm mới nếu editingContestId = null, ngược lại cập nhật */
async function saveContest() {
  try {
    // Lấy thông tin user từ localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const payload = {
      TenCuocThi: document.getElementById("edit-ten").value,
      LoaiCuocThi: document.getElementById("edit-loai").value,
      DiaDiem: document.getElementById("edit-diadiem").value,
      TrangThai: document.getElementById("edit-trangthai").value,
      ThoiGianBatDau: new Date(
        document.getElementById("edit-batdau").value,
      ).toISOString(),
      ThoiGianKetThuc: new Date(
        document.getElementById("edit-ketthuc").value,
      ).toISOString(),
      SoLuongToiDa: parseInt(document.getElementById("edit-soluong").value),
      DonViToChuc: "HVCS",
      MoTa: "",
      MaGV: user.MaGV || user.maGV || null, // ✅ Lấy từ user thật
    };

    if (!editingContestId) {
      // THÊM MỚI
      await API.post("/cuocthi", payload);
      alert("Thêm cuộc thi thành công!");
    } else {
      // CẬP NHẬT
      const old = await API.get("/cuocthi/" + editingContestId);
      await API.put("/cuocthi/" + editingContestId, {
        ...old,
        ...payload,
      });
      alert("Cập nhật thành công!");
    }

    closeContestModal();
    screenContests();
  } catch (e) {
    console.error(e);
    alert(e.message || JSON.stringify(e));
  }
}

/** Đóng modal cuộc thi */
function closeContestModal() {
  document.getElementById("contest-modal").style.display = "none";
}

// =============================================================================
// DUYỆT ĐĂNG KÝ (dành cho admin/giáo viên)
// Xem, duyệt, từ chối, và xuất danh sách đăng ký
// =============================================================================

/** Tải danh sách đăng ký, populate filter, render bảng có search/filter */
async function screenRegistration() {
  try {
    const data = await API.get("/dangky");

    // Populate dropdown lọc theo cuộc thi (chỉ load lần đầu)
    const contestSelect = document.getElementById(
      "filter-registration-contest",
    );
    if (contestSelect && contestSelect.options.length <= 0) {
      const contests = [...new Set(data.map((dk) => dk.TenCuocThi))];
      contestSelect.innerHTML =
        `<option value="all">
      Tất cả cuộc thi
    </option>` +
        contests
          .map(
            (ct) =>
              `<option value="${ct}">
        ${ct}
      </option>`,
          )
          .join("");
    }

    // Populate dropdown lọc theo trạng thái (chỉ load lần đầu)
    const statusSelect = document.getElementById("filter-registration-status");
    if (statusSelect && statusSelect.options.length <= 0) {
      const statuses = [...new Set(data.map((dk) => dk.TrangThai))];
      statusSelect.innerHTML =
        `<option value="">
      Tất cả trạng thái
    </option>` +
        statuses
          .map(
            (tt) =>
              `<option value="${tt}">
        ${tt}
      </option>`,
          )
          .join("");
    }

    // Lấy giá trị search và filter hiện tại
    const keyword =
      document.getElementById("search-registration")?.value.toLowerCase() || "";
    const contest =
      document.getElementById("filter-registration-contest")?.value || "";
    const status =
      document.getElementById("filter-registration-status")?.value || "";

    // Lọc dữ liệu
    const filtered = data.filter((dk) => {
      const matchKeyword =
        dk.MaDangKy.toLowerCase().includes(keyword) ||
        dk.TenSinhVien.toLowerCase().includes(keyword);
      const matchContest =
        contest === "all" || !contest || dk.TenCuocThi === contest;
      const matchStatus = !status || dk.TrangThai === status;
      return matchKeyword && matchContest && matchStatus;
    });

    const tbody = document.getElementById("registration-tbody");
    if (!tbody) return;

    // Render bảng
    tbody.innerHTML = filtered
      .map(
        (dk) => `
      <tr>
        <td>${dk.MaDangKy}</td>
        <td>${dk.TenSinhVien}</td>
        <td>${dk.TenKhoa}</td>
        <td>${dk.TenCuocThi}</td>
        <td>${formatDate(dk.NgayDangKy)}</td>
        <td><span class="badge ${badgeClass(dk.TrangThaiGV)}">${dk.TrangThaiGV}</span></td>
        <td><span class="badge ${badgeClass(dk.TrangThai)}">${dk.TrangThai}</span></td>
        <td class="action-cell">
          <button class="btn btn-sm btn-primary"
            onclick="duyetDangKy('${dk.MaDangKy}','Đã duyệt')">Duyệt</button>
          <button class="btn btn-sm btn-danger"
            onclick="duyetDangKy('${dk.MaDangKy}','Từ chối')">Từ chối</button>
        </td>
      </tr>
    `,
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

/** Duyệt hoặc từ chối một đăng ký, sau đó reload bảng */
async function duyetDangKy(id, trangThai) {
  try {
    await API.put("/dangky/" + id + "/duyet", { TrangThai: trangThai });
    screenRegistration();
  } catch (e) {
    alert(e.message);
  }
}

/** Duyệt tất cả các đăng ký đang hiển thị (chưa được duyệt) */
async function duyetTatCa() {
  try {
    const data = await API.get("/dangky");

    // Lấy giá trị search và filter hiện tại (lọc đúng theo bảng đang hiển thị)
    const keyword =
      document.getElementById("search-registration")?.value.toLowerCase() || "";
    const contest =
      document.getElementById("filter-registration-contest")?.value || "";
    const status =
      document.getElementById("filter-registration-status")?.value || "";

    const filtered = data.filter((dk) => {
      const matchKeyword =
        dk.MaDangKy.toLowerCase().includes(keyword) ||
        dk.TenSinhVien.toLowerCase().includes(keyword);
      const matchContest =
        contest === "all" || !contest || dk.TenCuocThi === contest;
      const matchStatus = !status || dk.TrangThai === status;
      return matchKeyword && matchContest && matchStatus;
    });

    // Chỉ duyệt các dòng chưa được duyệt
    const choDuyet = filtered.filter((dk) => dk.TrangThai !== "Đã duyệt");

    if (choDuyet.length === 0) {
      alert("Không có sinh viên cần duyệt!");
      return;
    }

    for (const dk of choDuyet) {
      await API.put("/dangky/" + dk.MaDangKy + "/duyet", {
        TrangThai: "Đã duyệt",
      });
    }

    alert("Đã duyệt " + choDuyet.length + " sinh viên!");
    screenRegistration();
  } catch (e) {
    console.error(e);
    alert("Lỗi duyệt tất cả");
  }
}

/** Xuất danh sách đăng ký đang hiển thị ra file CSV */
function xuatDanhSach() {
  const rows = document.querySelectorAll("#registration-tbody tr");

  let csv = "MaSV,TenSinhVien,Khoa,CuocThi,NgayDangKy,TrangThai\n";

  rows.forEach((tr) => {
    const td = tr.querySelectorAll("td");
    csv += [
      td[0]?.innerText,
      td[1]?.innerText,
      td[2]?.innerText,
      td[3]?.innerText,
      td[4]?.innerText,
      td[6]?.innerText,
    ].join(",");
    csv += "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "dang-ky.csv";
  a.click();
}

// =============================================================================
// DANH SÁCH THAM GIA (participants)
// Xem, xác nhận và xuất danh sách người tham gia
// =============================================================================

/** Tải danh sách tham gia, populate filter, render bảng có search/filter */
async function screenParticipants() {
  try {
    const data = await API.get("/dangky");

    // Populate dropdown lọc theo cuộc thi (chỉ load lần đầu)
    const contestSelect = document.getElementById("filter-participant-contest");
    if (contestSelect && contestSelect.options.length <= 0) {
      const contests = [...new Set(data.map((dk) => dk.TenCuocThi))];
      contestSelect.innerHTML =
        `<option value="all">
          Tất cả cuộc thi
        </option>` +
        contests
          .map(
            (ct) =>
              `<option value="${ct}">
            ${ct}
          </option>`,
          )
          .join("");
    }

    // Populate dropdown lọc theo trạng thái (chỉ load lần đầu, dùng giá trị cố định)
    const statusSelect = document.getElementById("filter-participant-status");
    if (statusSelect && statusSelect.options.length <= 0) {
      statusSelect.innerHTML = `
        <option value="">
          Tất cả trạng thái
        </option>

        <option value="Chờ xác nhận">
          Chờ xác nhận
        </option>

        <option value="Đã xác nhận">
          Đã xác nhận
        </option>
      `;
    }

    // Lấy giá trị search và filter hiện tại
    const keyword =
      document.getElementById("search-participant")?.value.toLowerCase() || "";
    const contest =
      document.getElementById("filter-participant-contest")?.value || "";
    const status =
      document.getElementById("filter-participant-status")?.value || "";

    // Lọc dữ liệu
    const filtered = data.filter((dk) => {
      const matchKeyword =
        dk.MaDangKy.toLowerCase().includes(keyword) ||
        dk.TenSinhVien.toLowerCase().includes(keyword);
      const matchContest =
        contest === "all" || !contest || dk.TenCuocThi === contest;
      const matchStatus = !status || dk.TrangThaiGV === status;
      return matchKeyword && matchContest && matchStatus;
    });

    const tbody = document.getElementById("participants-tbody");
    if (!tbody) return;

    // Render bảng
    tbody.innerHTML = filtered
      .map(
        (dk) => `
      <tr>

        <td>${dk.MaDangKy}</td>

        <td>${dk.TenSinhVien}</td>

        <td>${dk.TenKhoa}</td>

        <td>${dk.TenCuocThi}</td>

        <td>${formatDate(dk.NgayDangKy)}</td>

        <td>
          <span class="badge ${badgeClass(dk.TrangThaiGV)}">
            ${dk.TrangThaiGV}
          </span>
        </td>

        <td class="action-cell">
          ${
            dk.TrangThaiGV !== "Đã xác nhận"
              ? `<button class="btn btn-sm btn-primary"
                data-xacnhan-id="${dk.MaDangKy}"
                onclick="xacNhanParticipant('${dk.MaDangKy}')">
                <i class="ti ti-circle-check"></i> Xác nhận
               </button>`
              : `<span style="color:#4ade80;font-size:12px">
                <i class="ti ti-check"></i> Đã xác nhận
               </span>`
          }
        </td>

      </tr>
    `,
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

/** Xác nhận tất cả người tham gia đang hiển thị (chưa được xác nhận) */
async function xacNhanTatCa() {
  try {
    const data = await API.get("/dangky");

    // Lấy giá trị search và filter hiện tại
    const keyword =
      document.getElementById("search-participant")?.value.toLowerCase() || "";
    const contest =
      document.getElementById("filter-participant-contest")?.value || "";
    const status =
      document.getElementById("filter-participant-status")?.value || "";

    const filtered = data.filter((dk) => {
      const matchKeyword =
        dk.MaDangKy.toLowerCase().includes(keyword) ||
        dk.TenSinhVien.toLowerCase().includes(keyword);
      const matchContest =
        contest === "all" || !contest || dk.TenCuocThi === contest;
      const matchStatus = !status || dk.TrangThaiGV === status;
      return matchKeyword && matchContest && matchStatus;
    });

    // Chỉ xác nhận các dòng chưa được xác nhận
    const choXN = filtered.filter((dk) => dk.TrangThaiGV !== "Đã xác nhận");

    if (choXN.length === 0) {
      alert("Không có sinh viên cần xác nhận!");
      return;
    }

    for (const dk of choXN) {
      await API.put("/dangky/" + dk.MaDangKy + "/xacnhan", {});
    }

    alert("Đã xác nhận " + choXN.length + " sinh viên!");
    screenParticipants();
  } catch (e) {
    console.error(e);
    alert("Lỗi xác nhận tất cả");
  }
}

/** Xuất danh sách tham gia đang hiển thị ra file CSV */
function xuatDanhSachThamGia() {
  const rows = document.querySelectorAll("#participants-tbody tr");

  let csv = "MaSV,TenSinhVien,Khoa,CuocThi,NgayDangKy,TrangThaiGV\n";

  rows.forEach((tr) => {
    const td = tr.querySelectorAll("td");
    csv += [
      td[0]?.innerText,
      td[1]?.innerText,
      td[2]?.innerText,
      td[3]?.innerText,
      td[4]?.innerText,
      td[5]?.innerText,
    ].join(",");
    csv += "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "danh-sach-tham-gia.csv";
  a.click();
}

// =============================================================================
// XÁC NHẬN SINH VIÊN (dành cho giáo viên)
// Giáo viên xem và xác nhận danh sách sinh viên chờ duyệt
// =============================================================================

/** Tải danh sách đăng ký có trạng thái "Chờ xác nhận" và render bảng */
async function screenConfirm() {
  try {
    const data = await API.get("/dangky");
    const tbody = document.getElementById("confirm-tbody");
    if (!tbody) return;

    tbody.innerHTML = data
      .filter((dk) => dk.TrangThaiGV === "Chờ xác nhận")
      .map(
        (dk) => `
        <tr>
          <td>${dk.TenSinhVien}</td>
          <td>${dk.TenCuocThi}</td>
          <td>${formatDate(dk.NgayDangKy)}</td>
          <td class="action-cell">
            <button class="btn btn-sm btn-primary"
              onclick="xacNhanSV('${dk.MaDangKy}')">Xác nhận</button>
          </td>
        </tr>
      `,
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

/**
 * Xác nhận một sinh viên từ màn DS Tham gia.
 * Cập nhật DOM ngay tại chỗ (không reload toàn bộ) để UX mượt hơn.
 * Đồng thời ghi nhận vào DB qua API.
 */
async function xacNhanParticipant(id) {
  // Tìm nút được click và dòng chứa nó
  const btn = document.querySelector(`[data-xacnhan-id="${id}"]`);
  const row = btn?.closest("tr");

  try {
    // Vô hiệu hóa nút trong khi chờ API
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="ti ti-loader ti-spin"></i>`;
    }

    // Gọi API → cập nhật DB (PUT /dangky/:id/xacnhan)
    await API.put("/dangky/" + id + "/xacnhan", {});

    // Cập nhật badge ở cột "GV xác nhận" (index 5) ngay trên DOM
    if (row) {
      const badgeCell = row.cells[5];
      if (badgeCell) {
        badgeCell.innerHTML = `<span class="badge badge-teal">Đã xác nhận</span>`;
      }
      // Cập nhật cột Thao tác (index 6) → đổi thành text thành công
      const actionCell = row.cells[6];
      if (actionCell) {
        actionCell.innerHTML = `
          <span style="color:#4ade80;font-size:12px">
            <i class="ti ti-check"></i> Đã xác nhận
          </span>`;
      }
    }
  } catch (e) {
    // Khôi phục nút nếu lỗi
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="ti ti-circle-check"></i> Xác nhận`;
    }
    alert("Lỗi xác nhận: " + (e.message || e));
  }
}

// =============================================================================
// CUỘC THI CHO GIẢNG VIÊN (chỉ xem, không thêm/sửa/xóa)
// Dùng cùng API /cuocthi nhưng không render cột Thao tác
// =============================================================================

async function screenGvContests() {
  try {
    const data = await API.get("/cuocthi");

    // Populate dropdown Loại – router re-render template nên options.length = 1 (option mặc định)
    const loaiSel = document.getElementById("filter-gv-loai");
    if (loaiSel && loaiSel.options.length <= 1) {
      const dsLoai = [
        ...new Set(data.map((ct) => ct.LoaiCuocThi).filter(Boolean)),
      ];
      loaiSel.innerHTML =
        `<option value="all">Tất cả loại</option>` +
        dsLoai.map((l) => `<option value="${l}">${l}</option>`).join("");
    }

    // Populate dropdown Trạng thái – tương tự
    const ttSel = document.getElementById("filter-gv-trangthai");
    if (ttSel && ttSel.options.length <= 1) {
      const dsTT = [...new Set(data.map((ct) => ct.TrangThai).filter(Boolean))];
      ttSel.innerHTML =
        `<option value="all">Tất cả trạng thái</option>` +
        dsTT.map((tt) => `<option value="${tt}">${tt}</option>`).join("");
    }

    // Đọc filter
    const keyword =
      document.getElementById("search-gv-contest")?.value.toLowerCase() || "";
    const loai = document.getElementById("filter-gv-loai")?.value || "all";
    const tt = document.getElementById("filter-gv-trangthai")?.value || "all";

    // Lọc
    const filtered = data.filter((ct) => {
      const matchKw =
        ct.TenCuocThi.toLowerCase().includes(keyword) ||
        ct.MaCuocThi.toLowerCase().includes(keyword);
      const matchLoai = loai === "all" || ct.LoaiCuocThi === loai;
      const matchTT = tt === "all" || ct.TrangThai === tt;
      return matchKw && matchLoai && matchTT;
    });

    const tbody = document.getElementById("gv-contests-tbody");
    if (!tbody) return;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;opacity:.5;padding:24px">Không tìm thấy cuộc thi nào</td></tr>`;
      return;
    }

    // SoLuongDaDangKy là tên cột đúng từ VW_CUOCTHI_SOLUONG
    tbody.innerHTML = filtered
      .map(
        (ct) => `
        <tr>
          <td>${ct.MaCuocThi}</td>
          <td>${ct.TenCuocThi}</td>
          <td>${ct.LoaiCuocThi || "-"}</td>
          <td>${formatDate(ct.ThoiGianBatDau)}</td>
          <td>${formatDate(ct.ThoiGianKetThuc)}</td>
          <td>${ct.DiaDiem || "-"}</td>
          <td>${ct.SoLuongDaDangKy || 0}/${ct.SoLuongToiDa || 0}</td>
          <td>
            <span class="badge ${badgeClass(ct.TrangThai)}">
              ${ct.TrangThai}
            </span>
          </td>
        </tr>
      `,
      )
      .join("");
  } catch (e) {
    console.error("[screenGvContests]", e);
    const tbody = document.getElementById("gv-contests-tbody");
    if (tbody)
      tbody.innerHTML = `<tr><td colspan="8" style="color:#f87171;text-align:center;padding:16px">Lỗi tải dữ liệu: ${e.message}</td></tr>`;
  }
}

// =============================================================================
// ĐĂNG KÝ THAM GIA (dành cho sinh viên – my-registration)
// Sinh viên xem danh sách cuộc thi và tự đăng ký
// =============================================================================

/** Tải danh sách cuộc thi để SV chọn đăng ký, và hiển thị các đăng ký của SV */
async function screenMyRegistration() {
  try {
    // Danh sách cuộc thi để SV chọn đăng ký
    const cuocthiList = await API.get("/cuocthi");
    const select = document.getElementById("select-cuoc-thi");
    if (select) {
      select.innerHTML = cuocthiList
        .filter((ct) => ct.TrangThai !== "Đã kết thúc")
        .map(
          (ct) => `<option value="${ct.MaCuocThi}">${ct.TenCuocThi}</option>`,
        )
        .join("");
    }

    // Danh sách đăng ký của sinh viên hiện tại
    const myList = await API.get("/dangky/my");
    const tbody = document.getElementById("my-registration-tbody");
    if (!tbody) return;

    tbody.innerHTML = myList
      .map(
        (dk) => `
      <tr>
        <td>${dk.TenCuocThi}</td>
        <td>${formatDate(dk.NgayDangKy)}</td>
        <td><span class="badge ${badgeClass(dk.TrangThaiGV)}">${dk.TrangThaiGV}</span></td>
        <td><span class="badge ${badgeClass(dk.TrangThai)}">${dk.TrangThai}</span></td>
      </tr>
    `,
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

/** Gửi đăng ký tham gia cuộc thi được chọn trong dropdown */
async function submitDangKy() {
  const maCT = document.getElementById("select-cuoc-thi").value;
  try {
    await API.post("/dangky", { MaCuocThi: maCT });
    alert("Đăng ký thành công!");
    screenMyRegistration();
  } catch (e) {
    alert(e.message);
  }
}

// =============================================================================
// HỦY ĐĂNG KÝ (dành cho sinh viên – cancel-registration)
// Sinh viên xem và hủy các đăng ký của mình
// =============================================================================

/** Tải danh sách đăng ký của SV (trừ đã bị từ chối) và render bảng */
async function screenCancelRegistration() {
  try {
    const myList = await API.get("/dangky/my");
    const tbody = document.getElementById("cancel-tbody");
    if (!tbody) return;

    tbody.innerHTML = myList
      .filter((dk) => dk.TrangThai !== "Từ chối")
      .map(
        (dk) => `
        <tr>
          <td>${dk.TenKhoa}</td>
          <td>${dk.TenCuocThi}</td>
          <td><span class="badge ${badgeClass(dk.TrangThai)}">${dk.TrangThai}</span></td>
          <td class="action-cell">
            <button class="btn btn-sm btn-danger"
              onclick="huyDangKy('${dk.MaDangKy}')">Hủy</button>
          </td>
        </tr>
      `,
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

/** Hủy đăng ký sau khi xác nhận, sau đó reload bảng */
async function huyDangKy(id) {
  if (!confirm("Hủy đăng ký này?")) return;
  try {
    await API.delete("/dangky/" + id);
    screenCancelRegistration();
  } catch (e) {
    alert(e.message);
  }
}

// =============================================================================
// KẾT QUẢ
// Hiển thị bảng xếp hạng kết quả thi
// =============================================================================

/** Tải và render danh sách kết quả thi */
async function screenResults() {
  await loadResultContests();

  // Ẩn nút "Nhập kết quả" với role giảng viên
  const importBtn = document.getElementById("btn-import-result");
  const importFile = document.getElementById("import-result-file");
  if (importBtn && currentUser?.role === "gv") {
    importBtn.style.display = "none";
    if (importFile) importFile.style.display = "none";
  }

  try {
    const data = await API.get("/ketqua");
    window.allResults = data;
    const tbody = document.getElementById("results-tbody");
    if (!tbody) return;

    tbody.innerHTML = data
      .map(
        (kq, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${kq.MaSV}</td>
      <td>${kq.HoTen}</td>
      <td>${kq.TenLop || "-"}</td>
      <td>${kq.TenKhoa || "-"}</td>
      <td>${kq.TenCuocThi || "-"}</td>
      <td>${kq.Diem}</td>
      <td>${kq.GiaiThuong || "-"}</td>
    </tr>
    `,
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

// =============================================================
// LOAD DANH SÁCH CUỘC THI CHO KẾT QUẢ
// =============================================================

let allResultContests = [];

async function loadResultContests() {
  try {
    const contests = await API.get("/cuocthi");

    const select = document.getElementById("result-contest");

    if (!select) return;

    const now = new Date();

    // Sắp xếp theo alphabet
    contests.sort((a, b) => a.TenCuocThi.localeCompare(b.TenCuocThi, "vi"));

    allResultContests = contests;

    renderContestOptions(contests.slice(0, 10));
  } catch (e) {
    console.error(e);
  }
}

// =============================================================
// IMPORT KẾT QUẢ TỪ EXCEL
// =============================================================

async function importResults(event) {
  try {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async function (e) {
      const data = new Uint8Array(e.target.result);

      const workbook = XLSX.read(data, {
        type: "array",
      });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const json = XLSX.utils.sheet_to_json(sheet);

      console.log(json);

      if (json.length === 0) {
        alert("File không có dữ liệu!");
        return;
      }

      // Chuyển đổi dữ liệu Excel sang định dạng API
      // ==========================
      // IMPORT THEO FILE EXCEL
      // ==========================

      const payload = [];
      const usedSV = new Set();

      let success = 0;
      let fail = 0;

      const errorBox = document.getElementById("result-error");

      const successBox = document.getElementById("result-success");

      errorBox.style.display = "none";
      successBox.style.display = "none";

      errorBox.innerHTML = "";
      successBox.innerHTML = "";
      // Tìm sinh viên đăng ký đúng cuộc thi
      const dangKyList = await API.get("/dangky");
      // ========================
      // CHECK ĐÃ CÓ KẾT QUẢ
      // ========================
      const allResults = await API.get("/ketqua");
      const usedDangKy = new Set();
      for (let i = 0; i < json.length; i++) {
        const row = json[i];
        const maSV = String(row["Mã SV"] || "").trim();
        const tenCuocThi = String(row["Cuộc thi"] || "").trim();
        const diem = parseFloat(row["Điểm"]);
        const giaiThuong = String(row["Giải thưởng"] || "").trim();
        // ========================
        // CHECK RỖNG
        // ========================

        if (!maSV || !tenCuocThi) {
          fail++;
          errorBox.style.display = "block";
          errorBox.innerHTML += `
        <div>
          Dòng ${i + 2}: Thiếu Mã SV hoặc Cuộc thi
        </div>
      `;
          continue;
        }
        // ========================
        // CHECK ĐIỂM
        // ========================
        if (isNaN(diem) || diem < 0 || diem > 100) {
          fail++;

          errorBox.style.display = "block";

          errorBox.innerHTML += `
          <div>
            ${maSV}: Điểm không hợp lệ (0-100)
          </div>
        `;
          continue;
        }
        // ========================
        // CHECK TRÙNG TRONG FILE
        // ========================
        const key = maSV + "_" + tenCuocThi;
        if (usedSV.has(key)) {
          fail++;
          errorBox.style.display = "block";
          errorBox.innerHTML += `
          <div>
            ${maSV}: Bị trùng kết quả trong file Excel
          </div>
        `;
          continue;
        }
        usedSV.add(key);
        const dk = dangKyList.find(
          (x) => x.MaSV === maSV && x.TenCuocThi === tenCuocThi,
        );

        if (!dk) {
          fail++;
          errorBox.style.display = "block";
          errorBox.innerHTML += `
        <div>
          ${maSV}: Chưa đăng ký cuộc thi "${tenCuocThi}"
        </div>
      `;
          continue;
        }
        if (usedDangKy.has(dk.MaDangKy)) {
          fail++;

          errorBox.style.display = "block";
          errorBox.innerHTML += `
          <div>
            ${maSV}: Bị trùng kết quả trong file
          </div>
        `;
          continue;
        }

        usedDangKy.add(dk.MaDangKy);
        const existed = allResults.find((x) => x.MaDangKy === dk.MaDangKy);
        if (existed) {
          fail++;
          errorBox.style.display = "block";
          errorBox.innerHTML += `
          <div>
            ${maSV}: Đã có kết quả trước đó
          </div>
        `;

          continue;
        }

        payload.push({
          MaKetQua:
            "KQ" + Math.random().toString(36).substring(2, 8).toUpperCase(),
          MaDangKy: dk.MaDangKy,
          XepHang: parseInt(row["STT"]) || null,
          GiaiThuong: String(row["Giải thưởng"] || "").trim(),
          Diem: parseFloat(row["Điểm"]) || 0,
        });
      }

      try {
        const errors = [];

        for (const row of payload) {
          try {
            await API.post("/ketqua", row);
            success++;
          } catch (err) {
            fail++;
            errors.push(
              `${row.MaKetQua}: ${err.message || "Lỗi không xác định"}`,
            );
          }
        }

        successBox.style.display = "block";
        successBox.innerHTML = `
        Import thành công: ${success} dòng
        <br>
        Thất bại: ${fail} dòng
        `;
        if (errors.length > 0) {
          errorBox.style.display = "block";
          errorBox.innerHTML += errors.map((e) => `<div>${e}</div>`).join("");
        }

        // Reload lại bảng kết quả
        screenResults();
      } catch (apiErr) {
        console.error(apiErr);
        alert("❌ Lỗi khi gửi dữ liệu lên server: " + (apiErr.message || ""));
      }
    };

    reader.readAsArrayBuffer(file);
  } catch (e) {
    console.error(e);

    alert("Lỗi import file");
  }
}

function renderContestOptions(list) {
  const select = document.getElementById("result-contest");

  if (!select) return;

  const now = new Date();

  select.innerHTML = `
    <option value="">
      -- Chọn cuộc thi --
    </option>
  `;

  select.innerHTML += list
    .map((ct) => {
      const ended = new Date(ct.ThoiGianKetThuc) < now;

      return `
        <option value="${ct.MaCuocThi}">
          ${ct.TenCuocThi}
          ${ended ? "(Đã kết thúc)" : ""}
        </option>
      `;
    })
    .join("");
}
//Load cuộc thi theo thời gian thực
function filterContestOptions() {
  const keyword =
    document.getElementById("search-result-contest")?.value.toLowerCase() || "";

  const filtered = allResultContests.filter((ct) =>
    ct.TenCuocThi.toLowerCase().includes(keyword),
  );

  renderContestOptions(filtered.slice(0, 10));
}

function loadResultContest() {
  const maCuocThi = document.getElementById("result-contest").value;

  const tbody = document.getElementById("results-tbody");

  if (!tbody) return;

  // Nếu chưa chọn -> load tất cả
  if (!maCuocThi) {
    screenResults();
    return;
  }

  const selectedContest = allResultContests.find(
    (ct) => ct.MaCuocThi === maCuocThi,
  );

  if (!selectedContest) return;

  const filtered = window.allResults.filter(
    (kq) => kq.TenCuocThi === selectedContest.TenCuocThi,
  );

  // ========================
  // THỐNG KÊ
  // ========================

  setText("res-stat-participants", filtered.length);

  setText("res-stat-awarded", filtered.filter((kq) => kq.GiaiThuong).length);

  setText(
    "res-stat-first",
    filtered.filter((kq) => kq.GiaiThuong && kq.GiaiThuong.includes("Nhất"))
      .length,
  );

  // ========================
  // SORT ĐIỂM
  // ========================

  filtered.sort((a, b) => b.Diem - a.Diem);

  // ========================
  // RENDER TABLE
  // ========================

  tbody.innerHTML = filtered
    .map(
      (kq, index) => `
      <tr>

        <td>${index + 1}</td>

        <td>${kq.MaSV}</td>

        <td>${kq.HoTen}</td>

        <td>${kq.TenLop || "-"}</td>

        <td>${kq.TenKhoa || "-"}</td>

        <td>${kq.TenCuocThi || "-"}</td>

        <td>${kq.Diem}</td>

        <td>${kq.GiaiThuong || "-"}</td>

      </tr>
    `,
    )
    .join("");
}

// =============================================================================
// SINH VIÊN
// Xem danh sách toàn bộ sinh viên
// =============================================================================

/** Tải và render danh sách sinh viên */
let allStudents = [];

async function screenStudents() {
  try {
    // ===== LOAD DATA =====
    allStudents = await API.get("/sinhvien");

    renderStudents(allStudents);

    // ===== LOAD FILTER KHOA =====
    const khoaSelect = document.getElementById("filter-khoa-student");

    const khoaList = [
      ...new Set(allStudents.map((s) => s.Khoa).filter(Boolean)),
    ];

    khoaSelect.innerHTML =
      `<option value="">Tất cả khoa</option>` +
      khoaList.map((k) => `<option value="${k}">${k}</option>`).join("");

    // ===== LOAD FILTER LỚP =====
    const lopSelect = document.getElementById("filter-lop-student");

    const lopList = [...new Set(allStudents.map((s) => s.Lop).filter(Boolean))];

    lopSelect.innerHTML =
      `<option value="">Tất cả lớp</option>` +
      lopList.map((l) => `<option value="${l}">${l}</option>`).join("");

    // ===== SEARCH =====
    document
      .getElementById("search-student")
      .addEventListener("input", filterStudents);

    khoaSelect.addEventListener("change", filterStudents);

    lopSelect.addEventListener("change", filterStudents);
  } catch (err) {
    console.error(err);
    alert("Không load được dữ liệu sinh viên");
  }
}

function filterStudents() {
  const keyword = document.getElementById("search-student").value.toLowerCase();

  const khoa = document.getElementById("filter-khoa-student").value;

  const lop = document.getElementById("filter-lop-student").value;

  const filtered = allStudents.filter((s) => {
    const matchKeyword =
      s.MaSV?.toLowerCase().includes(keyword) ||
      s.HoTen?.toLowerCase().includes(keyword) ||
      s.Email?.toLowerCase().includes(keyword);

    const matchKhoa = !khoa || s.Khoa === khoa;

    const matchLop = !lop || s.Lop === lop;

    return matchKeyword && matchKhoa && matchLop;
  });

  renderStudents(filtered);
}

function renderStudents(data) {
  const tbody = document.getElementById("students-tbody");

  tbody.innerHTML = data
    .map(
      (s) => `
      <tr>
        <td>${s.MaSV || ""}</td>
        <td>${s.HoTen || ""}</td>
        <td>${s.GioiTinh || ""}</td>
        <td>
          ${s.NgaySinh ? new Date(s.NgaySinh).toLocaleDateString("vi-VN") : ""}
        </td>
        <td>${s.Lop || ""}</td>
        <td>${s.Khoa || ""}</td>
        <td>${s.Email || ""}</td>
        <td>${s.SDT || ""}</td>
        <td style="text-align:center">${s.SoCuocThi || 0}</td>
        <td class="action-cell">
          <button
            class="btn btn-sm"
            onclick="editStudent('${s.MaSV}')"
          >
            Sửa
          </button>
          <button
            class="btn btn-sm btn-danger"
            onclick="deleteStudent('${s.MaSV}')"
          >
            Xóa
          </button>
        </td>
      </tr>
    `,
    )
    .join("");
}

// =============================================================================
// SINH VIÊN – THÊM / SỬA / XÓA
// =============================================================================

let editingStudentId = null;

function openStudentModal() {
  editingStudentId = null;
  document.getElementById("student-masv").disabled = false;
  document.getElementById("student-masv").value = "";
  document.getElementById("student-hoten").value = "";
  document.getElementById("student-ngaysinh").value = "";
  document.getElementById("student-gioitinh").value = "Nam";
  document.getElementById("student-email").value = "";
  document.getElementById("student-sdt").value = "";
  document.getElementById("student-malop").value = "";
  document.querySelector("#student-modal .section-title").textContent =
    "Thêm sinh viên";
  document.querySelector("#student-modal .btn.btn-primary").textContent =
    "Thêm";
  document.getElementById("student-modal").style.display = "flex";
}

async function editStudent(id) {
  const sv = allStudents.find((x) => x.MaSV === id);
  if (!sv) return;

  editingStudentId = id;
  document.getElementById("student-masv").disabled = true;
  document.getElementById("student-masv").value = sv.MaSV;
  document.getElementById("student-hoten").value = sv.HoTen || "";
  document.getElementById("student-ngaysinh").value = sv.NgaySinh
    ? sv.NgaySinh.slice(0, 10)
    : "";
  document.getElementById("student-gioitinh").value = sv.GioiTinh || "Nam";
  document.getElementById("student-email").value = sv.Email || "";
  document.getElementById("student-sdt").value = sv.SDT || "";
  document.getElementById("student-malop").value = sv.MaLop || "";
  document.querySelector("#student-modal .section-title").textContent =
    "Sửa sinh viên";
  document.querySelector("#student-modal .btn.btn-primary").textContent = "Lưu";
  document.getElementById("student-modal").style.display = "flex";
}

async function saveStudent() {
  try {
    const payload = {
      MaSV: document.getElementById("student-masv").value.trim(),
      HoTen: document.getElementById("student-hoten").value.trim(),
      NgaySinh: document.getElementById("student-ngaysinh").value,
      GioiTinh: document.getElementById("student-gioitinh").value,
      Email: document.getElementById("student-email").value.trim(),
      SDT: document.getElementById("student-sdt").value.trim(),
      MaLop: document.getElementById("student-malop").value.trim(),
    };

    if (editingStudentId) {
      await API.put("/sinhvien/" + editingStudentId, payload);
      alert("Cập nhật sinh viên thành công!");
    } else {
      await API.post("/sinhvien", payload);
      alert("Thêm sinh viên thành công!");
    }

    closeStudentModal();
    await screenStudents();
  } catch (e) {
    console.error(e);
    alert(e.message || "Lỗi lưu sinh viên");
  }
}

async function deleteStudent(id) {
  if (!confirm("Bạn có chắc muốn xóa sinh viên " + id + "?")) return;
  try {
    await API.delete("/sinhvien/" + id);
    alert("Xóa sinh viên thành công!");
    await screenStudents();
  } catch (e) {
    console.error(e);
    alert(e.message || "Lỗi xóa sinh viên");
  }
}

function closeStudentModal() {
  document.getElementById("student-modal").style.display = "none";
}

let allTeachers = [];

async function screenTeachers() {
  try {
    allTeachers = await API.get("/giangvien");

    renderTeachers(allTeachers);
  } catch (e) {
    console.error(e);
  }
}

function renderTeachers(data) {
  const tbody = document.getElementById("teachers-tbody");

  tbody.innerHTML = data
    .map(
      (gv) => `

    <tr>

      <td>${gv.MaGV}</td>

      <td>${gv.HoTen}</td>

      <td>${gv.TenKhoa || ""}</td>

      <td>${gv.Email || ""}</td>

      <td>${gv.SDT || ""}</td>

      <td>${gv.TenDangNhap || ""}</td>

      <td>
        <span class="badge ${
          gv.MaVaiTro === "cb" ? "badge-teal" : "badge-amber"
        }">

          ${gv.MaVaiTro === "cb" ? "Cán bộ" : "Giảng viên"}

        </span>
      </td>

      <td>
        <span class="badge ${
          gv.TrangThai === "Hoạt động" ? "badge-green" : "badge-red"
        }">

          ${gv.TrangThai}

        </span>
      </td>

      <td class="action-cell">

        <button
          class="btn btn-sm"
          onclick="editTeacher('${gv.MaGV}')"
        >
          Sửa
        </button>

        <button
          class="btn btn-sm btn-danger"
          onclick="deleteTeacher('${gv.MaGV}')"
        >
          Xóa
        </button>

      </td>

    </tr>

  `,
    )
    .join("");
}

let editingTeacherId = null;

function openTeacherModal() {
  editingTeacherId = null;
  document.getElementById("teacher-magv").disabled = false;
  document.getElementById("teacher-magv").value = "";
  document.getElementById("teacher-hoten").value = "";
  document.getElementById("teacher-email").value = "";
  document.getElementById("teacher-sdt").value = "";
  document.getElementById("teacher-makhoa").value = "";
  document.getElementById("teacher-username").value = "";
  document.getElementById("teacher-password").value = "";
  document.getElementById("teacher-role").value = "gv";
  document.getElementById("teacher-status").value = "Hoạt động";
  document.getElementById("teacher-modal").style.display = "flex";
}

async function editTeacher(id) {
  const gv = allTeachers.find((x) => x.MaGV === id);

  if (!gv) return;

  editingTeacherId = id;
  document.getElementById("teacher-magv").disabled = true;
  document.getElementById("teacher-magv").value = gv.MaGV;
  document.getElementById("teacher-hoten").value = gv.HoTen;
  document.getElementById("teacher-email").value = gv.Email;
  document.getElementById("teacher-sdt").value = gv.SDT;
  document.getElementById("teacher-makhoa").value = gv.MaKhoa;
  document.getElementById("teacher-username").value = gv.TenDangNhap;
  document.getElementById("teacher-role").value = gv.MaVaiTro;
  document.getElementById("teacher-status").value = gv.TrangThai;
  document.getElementById("teacher-modal").style.display = "flex";
}

async function saveTeacher() {
  try {
    const payload = {
      MaGV: document.getElementById("teacher-magv").value,

      HoTen: document.getElementById("teacher-hoten").value,

      Email: document.getElementById("teacher-email").value,

      SDT: document.getElementById("teacher-sdt").value,

      MaKhoa: document.getElementById("teacher-makhoa").value,

      TenDangNhap: document.getElementById("teacher-username").value,

      MatKhau: document.getElementById("teacher-password").value,

      TrangThai: document.getElementById("teacher-status").value,

      MaVaiTro: document.getElementById("teacher-role").value,
    };

    // =========================
    // UPDATE
    // =========================

    if (editingTeacherId) {
      await API.put("/giangvien/" + editingTeacherId, payload);

      alert("Cập nhật thành công");
    }

    // =========================
    // ADD
    // =========================
    else {
      await API.post("/giangvien", payload);

      alert("Thêm thành công");
    }

    closeTeacherModal();

    await screenTeachers();
    await screenAccounts();
  } catch (e) {
    console.error(e);

    alert(e.message || "Lỗi lưu giảng viên");
  }
}

async function deleteTeacher(id) {
  if (!confirm("Xóa giảng viên này?")) return;

  try {
    await API.delete("/giangvien/" + id);

    alert("Xóa thành công");
    await screenTeachers();
    await screenAccounts();
  } catch (e) {
    console.error(e);

    alert(e.message);
  }
}

function closeTeacherModal() {
  document.getElementById("teacher-modal").style.display = "none";
}

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

function formatExcelDate(excelDate) {
  // Nếu đã là yyyy-mm-dd
  if (typeof excelDate === "string") {
    return excelDate;
  }

  // Excel serial number -> date
  const date = new Date((excelDate - 25569) * 86400 * 1000);

  return date.toISOString().split("T")[0];
}

async function importStudents(event) {
  try {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async function (e) {
      const data = new Uint8Array(e.target.result);

      const workbook = XLSX.read(data, {
        type: "array",
      });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const json = XLSX.utils.sheet_to_json(sheet);

      if (json.length === 0) {
        alert("File không có dữ liệu!");
        return;
      }

      console.log(json);
      let success = 0;
      let fail = 0;
      const usedEmails = new Set();
      const usedSDT = new Set();

      // RESET THÔNG BÁO
      const errorBox = document.getElementById("student-error");

      const successBox = document.getElementById("student-success");

      errorBox.style.display = "none";
      successBox.style.display = "none";

      for (const row of json) {
        try {
          const payload = {
            MaSV: String(row["MaSV"] || "").trim(),

            HoTen: String(row["HoTen"] || "").trim(),

            NgaySinh: formatExcelDate(row["NgaySinh"]),

            GioiTinh: String(row["GioiTinh"] || "").trim(),

            Email: String(row["Email"] || "").trim(),

            SDT: String(row["SDT"] || "").trim(),

            MaLop: String(row["MaLop"] || "").trim(),
          };
          // CHECK TRÙNG EMAIL TRONG FILE EXCEL
          if (usedEmails.has(payload.Email)) {
            fail++;
            errorBox.style.display = "block";
            errorBox.innerHTML += `
              <div>
                Email bị trùng trong file Excel: ${payload.Email}
              </div>
            `;
            continue;
          }

          // CHECK TRÙNG SDT TRONG FILE EXCEL
          if (usedSDT.has(payload.SDT)) {
            fail++;

            errorBox.style.display = "block";

            errorBox.textContent = `SĐT bị trùng trong file Excel: ${payload.SDT}`;

            continue;
          }

          // LƯU EMAIL + SDT ĐÃ DÙNG
          usedEmails.add(payload.Email);
          usedSDT.add(payload.SDT);
          // CHECK RỖNG
          if (!payload.MaSV || !payload.HoTen || !payload.MaLop) {
            fail++;

            errorBox.style.display = "block";

            errorBox.textContent = "Có dòng bị thiếu dữ liệu!";

            continue;
          }

          await API.post("/sinhvien", payload);

          success++;
        } catch (err) {
          fail++;

          errorBox.style.display = "block";

          errorBox.textContent = err.message || "Có lỗi xảy ra!";

          console.error(err);
        }
      }

      // THÔNG BÁO THÀNH CÔNG
      if (success > 0) {
        successBox.style.display = "block";

        successBox.textContent = `Import thành công ${success} sinh viên`;

        setTimeout(() => {
          successBox.style.display = "none";
        }, 4000);
      }

      // ẨN LỖI SAU 5S
      if (fail > 0) {
        setTimeout(() => {
          errorBox.style.display = "none";
        }, 5000);
      }

      await screenStudents();
      // RESET INPUT FILE
      event.target.value = "";
    };

    reader.readAsArrayBuffer(file);
  } catch (e) {
    console.error(e);

    const errorBox = document.getElementById("student-error");

    errorBox.style.display = "block";

    errorBox.textContent = "Lỗi import sinh viên!";
  }
}

// BÁO CÁO  (BM_BC_01)  -  Admin / Cán bộ
// Thêm đoạn này vào CUỐI file js/screens.js
/**
 * State của màn báo cáo - giữ filter hiện tại + dữ liệu vừa load để xuất Excel.
 */
// BÁO CÁO THỐNG KÊ

async function screenReports() {
  try {
    // LOAD FILTERS
    const filters = await API.get("/baocao/filters");

    const yearSelect = document.getElementById("report-filter-year");
    const khoaSelect = document.getElementById("report-filter-khoa");

    if (!yearSelect || !khoaSelect) return;

    // TÍNH NĂM HỌC HIỆN TẠI
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    let currentSchoolYear = "";

    if (month >= 9) {
      currentSchoolYear = `${year}-${year + 1}`;
    } else {
      currentSchoolYear = `${year - 1}-${year}`;
    }

    // DROPDOWN NĂM HỌC
    yearSelect.innerHTML = filters.namHoc
      .map(
        (y) => `
        <option value="${y}">
          ${y}
        </option>
      `,
      )
      .join("");

    // Nếu có năm hiện tại thì chọn mặc định
    if (filters.namHoc.includes(currentSchoolYear)) {
      yearSelect.value = currentSchoolYear;
    }

    // DROPDOWN KHOA
    khoaSelect.innerHTML =
      `<option value="all">Tất cả</option>` +
      filters.khoa
        .map(
          (k) => `
          <option value="${k.MaKhoa}">
            ${k.TenKhoa}
          </option>
        `,
        )
        .join("");

    // LOAD DATA BAN ĐẦU
    await loadReportData();

    // EVENT FILTER
    yearSelect.onchange = loadReportData;
    khoaSelect.onchange = loadReportData;
  } catch (e) {
    console.error(e);
  }
}

async function loadReportData() {
  try {
    const namHoc = document.getElementById("report-filter-year")?.value || "";

    const maKhoa =
      document.getElementById("report-filter-khoa")?.value || "all";

    // LOAD STATS
    const stats = await API.get(
      `/baocao/stats?namHoc=${namHoc}&maKhoa=${maKhoa}`,
    );

    setText("report-total-reg", stats.tongDangKy || 0);
    setText("report-approval-rate", `${stats.tyLeDuyet || 0}%`);
    setText("report-total-awards", stats.tongGiai || 0);
    setText("report-top-faculty", stats.khoaDanDau || "-");

    setText("report-sub-reg", `${stats.daDuyet || 0} lượt được duyệt`);

    setText("report-sub-approval", `Đã duyệt ${stats.daDuyet || 0} hồ sơ`);

    setText("report-sub-awards", `${stats.khoaDanDauSoGiai || 0} giải`);

    setText("report-sub-faculty", `${stats.khoaDanDauSoGiai || 0} giải thưởng`);

    // LOAD BẢNG KHOA
    const khoaData = await API.get(
      `/baocao/theo-khoa?namHoc=${namHoc}&maKhoa=${maKhoa}`,
    );

    const tbody = document.getElementById("reports-faculty-tbody");

    if (!tbody) return;

    tbody.innerHTML = khoaData
      .map(
        (k) => `
        <tr>
          <td>${k.TenKhoa}</td>
          <td>${k.SoSV || 0}</td>
          <td>${k.SoGiai || 0}</td>
        </tr>
      `,
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

const reportState = {
  namHoc: "all",
  maKhoa: "all",
  loai: "theo-khoa",
  theoKhoa: [], // cache dữ liệu bảng "Thống kê theo khoa" để xuất Excel
};

/** Đọc giá trị filter hiện tại từ DOM */
function readReportFilters() {
  reportState.namHoc =
    document.getElementById("report-filter-year")?.value || "all";
  reportState.maKhoa =
    document.getElementById("report-filter-khoa")?.value || "all";
  reportState.loai =
    document.getElementById("report-filter-type")?.value || "theo-khoa";
}

/** Build querystring từ filter */
function reportQuery() {
  const p = new URLSearchParams();
  if (reportState.namHoc && reportState.namHoc !== "all")
    p.append("namHoc", reportState.namHoc);
  if (reportState.maKhoa && reportState.maKhoa !== "all")
    p.append("maKhoa", reportState.maKhoa);
  const qs = p.toString();
  return qs ? "?" + qs : "";
}

/** Nạp options cho 2 dropdown Năm học + Khoa */
async function loadReportFilters() {
  try {
    const data = await API.get("/baocao/filters");

    const yearSel = document.getElementById("report-filter-year");
    if (yearSel) {
      yearSel.innerHTML =
        `<option value="all">Tất cả</option>` +
        (data.namHoc || [])
          .map((n) => `<option value="${n}">${n}</option>`)
          .join("");
    }

    const khoaSel = document.getElementById("report-filter-khoa");
    if (khoaSel) {
      khoaSel.innerHTML =
        `<option value="all">Tất cả</option>` +
        (data.khoa || [])
          .map((k) => `<option value="${k.MaKhoa}">${k.TenKhoa}</option>`)
          .join("");
    }
  } catch (e) {
    console.error("[loadReportFilters]", e);
  }
}

/** Nạp 4 stat cards */
async function loadReportStats() {
  try {
    const s = await API.get("/baocao/stats" + reportQuery());

    setText("report-total-reg", (s.tongDangKy ?? 0).toLocaleString("vi-VN"));
    setText("report-sub-reg", `${s.daDuyet || 0} đăng ký đã được duyệt`);

    setText("report-approval-rate", `${s.tyLeDuyet ?? 0}%`);
    setText(
      "report-sub-approval",
      s.tongDangKy ? `${s.daDuyet}/${s.tongDangKy} đăng ký` : "Chưa có dữ liệu",
    );

    setText("report-total-awards", (s.tongGiai ?? 0).toLocaleString("vi-VN"));
    setText("report-sub-awards", "Tổng số giải thưởng đạt được");

    setText("report-top-faculty", s.khoaDanDau || "—");
    setText(
      "report-sub-faculty",
      s.khoaDanDau ? `${s.khoaDanDauSoGiai} giải` : "Chưa có dữ liệu",
    );
  } catch (e) {
    console.error("[loadReportStats]", e);
  }
}

/** Nạp bảng "Thống kê theo khoa" */
async function loadReportFacultyTable() {
  try {
    const data = await API.get("/baocao/theo-khoa" + reportQuery());
    reportState.theoKhoa = data;

    const tbody = document.getElementById("reports-faculty-tbody");
    if (!tbody) return;

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;opacity:.6">Chưa có dữ liệu</td></tr>`;
      return;
    }

    tbody.innerHTML = data
      .map(
        (r) => `
        <tr>
          <td>${r.TenKhoa || "-"}</td>
          <td>${(r.SoSV || 0).toLocaleString("vi-VN")}</td>
          <td>${(r.SoGiai || 0).toLocaleString("vi-VN")}</td>
        </tr>
      `,
      )
      .join("");
  } catch (e) {
    console.error("[loadReportFacultyTable]", e);
  }
}

/** Bind sự kiện change cho filter (chỉ bind 1 lần) */
function bindReportFilters() {
  ["report-filter-year", "report-filter-khoa"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el || el.dataset.bound === "1") return;
    el.dataset.bound = "1";
    el.addEventListener("change", () => {
      readReportFilters();
      loadReportStats();
      loadReportFacultyTable();
    });
  });

  const typeSel = document.getElementById("report-filter-type");
  if (typeSel && typeSel.dataset.bound !== "1") {
    typeSel.dataset.bound = "1";
    typeSel.addEventListener("change", () => readReportFilters());
  }
}

/** Entry point – router gọi khi chuyển sang màn báo cáo */
async function screenReports() {
  await loadReportFilters();
  readReportFilters();
  bindReportFilters();
  await Promise.all([loadReportStats(), loadReportFacultyTable()]);
}

/*EXPORT EXCEL – gọi bởi onclick của nút "Xuất báo cáo"*/
async function exportReport() {
  readReportFilters();
  const { loai, namHoc, maKhoa } = reportState;

  const btn = document.getElementById("report-export-btn");
  const oldHtml = btn?.innerHTML;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="ti ti-loader ti-spin"></i> Đang xuất...`;
  }

  try {
    let rows = [];
    let header = [];
    let sheetName = "BaoCao";
    let fileName = "BaoCao";

    if (loai === "theo-khoa") {
      const data =
        reportState.theoKhoa.length > 0
          ? reportState.theoKhoa
          : await API.get("/baocao/theo-khoa" + reportQuery());

      header = ["Mã khoa", "Tên khoa", "SV tham gia", "Số giải"];
      rows = data.map((r) => [
        r.MaKhoa || "",
        r.TenKhoa || "",
        r.SoSV || 0,
        r.SoGiai || 0,
      ]);
      sheetName = "Theo khoa";
      fileName = "BaoCao_TheoKhoa";
    } else if (loai === "theo-cuoc-thi") {
      const data = await API.get("/baocao/theo-cuoc-thi" + reportQuery());

      header = [
        "Mã cuộc thi",
        "Tên cuộc thi",
        "Loại",
        "Thời gian bắt đầu",
        "Trạng thái",
        "Số đăng ký",
        "Đã duyệt",
        "Số giải",
      ];
      rows = data.map((r) => [
        r.MaCuocThi || "",
        r.TenCuocThi || "",
        r.LoaiCuocThi || "",
        r.ThoiGianBatDau ? formatDate(r.ThoiGianBatDau) : "",
        r.TrangThai || "",
        r.SoDangKy || 0,
        r.SoDaDuyet || 0,
        r.SoGiai || 0,
      ]);
      sheetName = "Theo cuộc thi";
      fileName = "BaoCao_TheoCuocThi";
    } else if (loai === "bang-vang") {
      const data = await API.get("/baocao/bang-vang" + reportQuery());

      header = [
        "Mã SV",
        "Họ tên",
        "Lớp",
        "Khoa",
        "Cuộc thi",
        "Giải thưởng",
        "Xếp hạng",
        "Điểm",
      ];
      rows = data.map((r) => [
        r.MaSV || "",
        r.HoTen || "",
        r.TenLop || "",
        r.TenKhoa || "",
        r.TenCuocThi || "",
        r.GiaiThuong || "",
        r.XepHang ?? "",
        r.Diem ?? "",
      ]);
      sheetName = "Bảng vàng";
      fileName = "BaoCao_BangVang";
    }

    if (rows.length === 0) {
      alert("Không có dữ liệu để xuất với bộ lọc hiện tại.");
      return;
    }

    // Tiêu đề + bộ lọc ở dòng đầu (giúp xem nguồn báo cáo)
    const meta = [
      ["BÁO CÁO THỐNG KÊ (BM_BC_01)"],
      [
        `Năm học: ${namHoc === "all" ? "Tất cả" : namHoc}`,
        `Khoa: ${
          maKhoa === "all"
            ? "Tất cả"
            : document.getElementById("report-filter-khoa")?.selectedOptions[0]
                ?.text || maKhoa
        }`,
        `Loại: ${
          document.getElementById("report-filter-type")?.selectedOptions[0]
            ?.text || loai
        }`,
        `Xuất lúc: ${new Date().toLocaleString("vi-VN")}`,
      ],
      [],
      header,
      ...rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(meta);

    // Cài bề rộng cột tương đối
    ws["!cols"] = header.map((h) => ({ wch: Math.max(14, h.length + 2) }));

    // Merge tiêu đề "BÁO CÁO THỐNG KÊ" qua các cột header
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(header.length - 1, 1) } },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `${fileName}_${stamp}.xlsx`);
  } catch (e) {
    console.error("[exportReport]", e);
    alert("Xuất báo cáo thất bại: " + (e.message || e));
  } finally {
    if (btn) {
      btn.disabled = false;
      if (oldHtml) btn.innerHTML = oldHtml;
    }
  }
}

// NHẬT KÝ HỆ THỐNG (BM_LOG_01)  –  server-side pagination + filtering
// Thay hàm screenLogs() cũ trong js/screens.js bằng toàn bộ khối này.
// Xóa hàm screenLogs() hiện tại rồi paste vào cuối file (hoặc cùng vị trí).

//STATE – lưu trang hiện tại để các hàm phụ có thể dùng
const logState = {
  page: 1,
  total: 0,
  totalPages: 1,
  limit: 50,
  _debounceTimer: null,
  _metaLoaded: false,
};

//Đọc toàn bộ filter từ DOM → object params để build query string
function getLogParams(overridePage) {
  const page = overridePage ?? logState.page;
  const limit = parseInt(document.getElementById("log-limit")?.value) || 50;

  const p = new URLSearchParams({ page, limit });

  const q = document.getElementById("log-search")?.value.trim();
  if (q) p.set("q", q);

  const tuNgay = document.getElementById("log-tu-ngay")?.value;
  if (tuNgay) p.set("tuNgay", tuNgay);

  const denNgay = document.getElementById("log-den-ngay")?.value;
  if (denNgay) p.set("denNgay", denNgay);

  const hanhDong = document.getElementById("log-hanh-dong")?.value;
  if (hanhDong && hanhDong !== "all") p.set("hanhDong", hanhDong);

  const vaiTro = document.getElementById("log-vai-tro")?.value;
  if (vaiTro && vaiTro !== "all") p.set("vaiTro", vaiTro);

  return p;
}

//Nạp danh sách HanhDong từ /api/nhatky/meta → điền vào dropdown.
//Chỉ gọi 1 lần khi vào màn hình.

async function loadLogMeta() {
  if (logState._metaLoaded) return;
  try {
    const meta = await API.get("/nhatky/meta");
    const sel = document.getElementById("log-hanh-dong");
    if (!sel) return;

    // Giữ lại option "Tất cả" rồi thêm vào
    const existing = Array.from(sel.options).map((o) => o.value);
    (meta.hanhDong || []).forEach((hd) => {
      if (!existing.includes(hd)) {
        const opt = document.createElement("option");
        opt.value = hd;
        opt.textContent = hd;
        sel.appendChild(opt);
      }
    });
    logState._metaLoaded = true;
  } catch (e) {
    console.warn("[loadLogMeta]", e);
  }
}

//Render bảng – nhận mảng dòng từ API

function renderLogTable(rows) {
  const tbody = document.getElementById("logs-tbody");
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;opacity:.5;padding:32px">
          Không tìm thấy bản ghi nào phù hợp
        </td>
      </tr>`;
    return;
  }

  // Map mã vai trò → nhãn tiếng Việt
  const roleLabel = {
    admin: "Quản trị viên",
    cb: "Cán bộ",
    gv: "Giảng viên",
    sv: "Sinh viên",
  };

  // Badge class theo loại hành động
  const actionBadge = {
    "Đăng ký": "badge-blue",
    Duyệt: "badge-green",
    "Từ chối": "badge-red",
    "Xác nhận": "badge-teal",
    Hủy: "badge-amber",
    "Cập nhật": "badge-blue",
    Xóa: "badge-red",
  };

  tbody.innerHTML = rows
    .map((nk) => {
      const badge = actionBadge[nk.HanhDong] || "badge-gray";
      const lbl = roleLabel[nk.MaVaiTro] || nk.TenVaiTro || nk.MaVaiTro || "-";
      return `
      <tr>
        <td style="white-space:nowrap;font-size:12px;color:#aaa">${formatDate(nk.ThoiGian)}</td>
        <td><strong>${nk.TenDangNhap || "-"}</strong></td>
        <td><span style="font-size:11px;color:#888">${lbl}</span></td>
        <td><span class="badge ${badge}">${nk.HanhDong || "-"}</span></td>
        <td style="font-size:13px;color:#ccc">${nk.MoTa || "-"}</td>
      </tr>`;
    })
    .join("");
}

//Render thanh phân trang

function renderLogPagination() {
  const el = document.getElementById("log-pagination");
  if (!el) return;

  const { page, total, totalPages, limit } = logState;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const btnCls = (disabled) =>
    `style="padding:4px 10px;border-radius:6px;border:1px solid #333;
            background:#1a1a1a;color:${disabled ? "#444" : "#ccc"};cursor:${disabled ? "default" : "pointer"}"`;

  el.innerHTML = `
    <span>
      Hiển thị <strong>${start.toLocaleString("vi-VN")}–${end.toLocaleString("vi-VN")}</strong>
      trong tổng số <strong>${total.toLocaleString("vi-VN")}</strong> bản ghi
    </span>
    <span style="display:flex;gap:4px;align-items:center">
      <button onclick="loadLogs(1)"           ${page <= 1 ? "disabled" : ""} ${btnCls(page <= 1)}>«</button>
      <button onclick="loadLogs(${page - 1})" ${page <= 1 ? "disabled" : ""} ${btnCls(page <= 1)}>‹ Trước</button>
      <span style="padding:0 10px;color:#ccc">Trang ${page} / ${totalPages}</span>
      <button onclick="loadLogs(${page + 1})" ${page >= totalPages ? "disabled" : ""} ${btnCls(page >= totalPages)}>Sau ›</button>
      <button onclick="loadLogs(${totalPages})" ${page >= totalPages ? "disabled" : ""} ${btnCls(page >= totalPages)}>»</button>
    </span>`;
}

//loadLogs(page) – gọi API, cập nhật bảng + pagination
async function loadLogs(page = 1) {
  logState.page = page;
  logState.limit = parseInt(document.getElementById("log-limit")?.value) || 50;

  // Hiển thị trạng thái loading
  const tbody = document.getElementById("logs-tbody");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;opacity:.5;padding:32px">
          <i class="ti ti-loader ti-spin"></i> Đang tải...
        </td>
      </tr>`;
  }

  try {
    const params = getLogParams(page);
    const result = await API.get("/nhatky?" + params.toString());

    // result = { data, total, page, limit, totalPages }
    logState.total = result.total ?? 0;
    logState.totalPages = result.totalPages ?? 1;
    logState.page = result.page ?? page;

    renderLogTable(result.data || []);
    renderLogPagination();
  } catch (e) {
    console.error("[loadLogs]", e);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;color:#c94c4c;padding:24px">
            Tải nhật ký thất bại. Vui lòng thử lại.
          </td>
        </tr>`;
    }
  }
}

//Debounce cho ô tìm kiếm (chờ 400ms sau khi gõ xong mới gọi API)
function debounceLoadLogs() {
  clearTimeout(logState._debounceTimer);
  logState._debounceTimer = setTimeout(() => loadLogs(1), 400);
}

//Xóa toàn bộ bộ lọc, về trang 1

function resetLogFilters() {
  const ids = ["log-search", "log-tu-ngay", "log-den-ngay"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  ["log-hanh-dong", "log-vai-tro"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "all";
  });

  const limitSel = document.getElementById("log-limit");
  if (limitSel) limitSel.value = "50";

  loadLogs(1);
}

//Xuất Excel – lấy dữ liệu từ /api/nhatky/export (giới hạn 10 000)
//Dùng SheetJS (đã load trong index.html)
async function exportLogs() {
  const btn = document.querySelector('[onclick="exportLogs()"]');
  const oldHtml = btn?.innerHTML;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="ti ti-loader ti-spin"></i> Đang xuất...`;
  }

  try {
    const params = getLogParams(1);
    // Xóa page & limit vì endpoint export không phân trang
    params.delete("page");
    params.delete("limit");

    const rows = await API.get("/nhatky/export?" + params.toString());

    if (!rows.length) {
      alert("Không có dữ liệu để xuất với bộ lọc hiện tại.");
      return;
    }

    const roleLabel = {
      admin: "Quản trị viên",
      cb: "Cán bộ",
      gv: "Giảng viên",
      sv: "Sinh viên",
    };

    const header = ["Thời gian", "Tài khoản", "Vai trò", "Hành động", "Mô tả"];
    const data = rows.map((r) => [
      r.ThoiGian ? new Date(r.ThoiGian).toLocaleString("vi-VN") : "",
      r.TenDangNhap || "",
      roleLabel[r.MaVaiTro] || r.TenVaiTro || r.MaVaiTro || "",
      r.HanhDong || "",
      r.MoTa || "",
    ]);

    // Dòng metadata ở đầu
    const tuNgay = document.getElementById("log-tu-ngay")?.value || "Tất cả";
    const denNgay = document.getElementById("log-den-ngay")?.value || "Tất cả";
    const meta = [
      ["NHẬT KÝ HỆ THỐNG (BM_LOG_01)"],
      [
        `Từ ngày: ${tuNgay}`,
        `Đến ngày: ${denNgay}`,
        `Tổng bản ghi: ${rows.length}`,
        `Xuất lúc: ${new Date().toLocaleString("vi-VN")}`,
      ],
      [],
      header,
      ...data,
    ];

    const ws = XLSX.utils.aoa_to_sheet(meta);
    ws["!cols"] = [
      { wch: 20 }, // Thời gian
      { wch: 16 }, // Tài khoản
      { wch: 16 }, // Vai trò
      { wch: 14 }, // Hành động
      { wch: 50 }, // Mô tả
    ];
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Merge tiêu đề
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nhật ký");

    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `NhatKy_HeTHong_${stamp}.xlsx`);
  } catch (e) {
    console.error("[exportLogs]", e);
    alert("Xuất thất bại: " + (e.message || e));
  } finally {
    if (btn) {
      btn.disabled = false;
      if (oldHtml) btn.innerHTML = oldHtml;
    }
  }
}

//screenLogs() – Entry point, được router gọi khi vào tab Nhật ký
async function screenLogs() {
  // Reset state về trang 1 mỗi khi enter màn hình
  logState.page = 1;

  // Load meta (hành động) chỉ lần đầu
  await loadLogMeta();

  // Load dữ liệu
  await loadLogs(1);
}
