// js/screens/nhatky.js
// Màn hình "Nhật ký hệ thống" (BM_LOG_01) – server-side pagination + filtering + export.
// (Tách nguyên văn từ js/screens.js – không đổi logic)

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
