// js/screens/dashboard.js
// Màn hình Dashboard – stat cards, cuộc thi sắp diễn ra, hoạt động gần đây.
// (Tách nguyên văn từ js/screens.js – không đổi logic)

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
