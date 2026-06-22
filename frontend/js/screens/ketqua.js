// js/screens/ketqua.js
// Màn hình "Kết quả cuộc thi" – hiển thị bảng xếp hạng, import Excel, lọc theo cuộc thi.
// (Tách nguyên văn từ js/screens.js – không đổi logic)

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
