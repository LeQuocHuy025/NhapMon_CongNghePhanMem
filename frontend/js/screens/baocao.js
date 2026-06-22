// js/screens/baocao.js
// Màn hình "Báo cáo thống kê" (BM_BC_01) – stats, bảng theo khoa, xuất Excel.
// (Tách nguyên văn từ js/screens.js – không đổi logic, GIỮ NGUYÊN thứ tự kể cả
//  các hàm trùng tên screenReports: bản định nghĩa sau sẽ ghi đè bản trước,
//  đúng y như khi còn nằm chung trong screens.js)

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
