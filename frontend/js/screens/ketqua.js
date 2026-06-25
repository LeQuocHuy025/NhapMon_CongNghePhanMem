// js/screens/ketqua.js

// =============================================================================
// KẾT QUẢ
// =============================================================================

async function screenResults() {
  await loadResultContests();

  const importBtn = document.getElementById("btn-import-result");
  const canImport = currentUser?.role === "admin" || currentUser?.role === "cb";
  if (importBtn) importBtn.style.display = canImport ? "" : "none";

  try {
    const data = await API.get("/ketqua");
    window.allResults = data;
    filterResultTable();
  } catch (e) {
    console.error(e);
  }
}

// =============================================================
// LOAD DROPDOWN CUỘC THI
// =============================================================

let allResultContests = [];

async function loadResultContests() {
  try {
    const contests = await API.get("/cuocthi");
    const select = document.getElementById("result-contest");
    if (!select) return;

    contests.sort((a, b) => a.TenCuocThi.localeCompare(b.TenCuocThi, "vi"));
    allResultContests = contests;

    const now = new Date();
    select.innerHTML =
      `<option value="">-- Tất cả cuộc thi --</option>` +
      contests
        .map((ct) => {
          const ended = new Date(ct.ThoiGianKetThuc) < now;
          return `<option value="${ct.MaCuocThi}">${ct.TenCuocThi}${ended ? " (Đã kết thúc)" : ""}</option>`;
        })
        .join("");
  } catch (e) {
    console.error(e);
  }
}

// =============================================================
// LỌC VÀ RENDER BẢNG KẾT QUẢ
// =============================================================

function filterResultTable() {
  const keyword = (
    document.getElementById("search-result-keyword")?.value || ""
  ).toLowerCase();
  const maCuocThi = document.getElementById("result-contest")?.value || "";

  const filtered = (window.allResults || []).filter((kq) => {
    const matchKeyword =
      !keyword ||
      [kq.MaSV, kq.HoTen, kq.TenLop, kq.TenKhoa, kq.TenCuocThi].some((v) =>
        (v || "").toLowerCase().includes(keyword),
      );

    const matchContest =
      !maCuocThi ||
      allResultContests.find((ct) => ct.MaCuocThi === maCuocThi)?.TenCuocThi ===
        kq.TenCuocThi;

    return matchKeyword && matchContest;
  });

  // Cập nhật thống kê
  setText("res-stat-participants", filtered.length);
  setText("res-stat-awarded", filtered.filter((kq) => kq.GiaiThuong).length);
  setText(
    "res-stat-first",
    filtered.filter((kq) => kq.GiaiThuong?.includes("Nhất")).length,
  );

  // Render bảng
  const tbody = document.getElementById("results-tbody");
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;opacity:.5;padding:24px">Không tìm thấy kết quả</td></tr>`;
    return;
  }

  filtered.sort((a, b) => b.Diem - a.Diem);

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
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      if (json.length === 0) {
        alert("File không có dữ liệu!");
        return;
      }

      const payload = [];
      const usedSV = new Set();
      const usedDangKy = new Set();
      let success = 0;
      let fail = 0;

      const errorBox = document.getElementById("result-error");
      const successBox = document.getElementById("result-success");
      errorBox.style.display = "none";
      successBox.style.display = "none";
      errorBox.innerHTML = "";
      successBox.innerHTML = "";

      const dangKyList = await API.get("/dangky");
      const allResults = await API.get("/ketqua");

      for (let i = 0; i < json.length; i++) {
        const row = json[i];
        const maSV = String(row["Mã SV"] || "").trim();
        const tenCuocThi = String(row["Cuộc thi"] || "").trim();
        const diem = parseFloat(row["Điểm"]);
        const giaiThuong = String(row["Giải thưởng"] || "").trim();

        if (!maSV || !tenCuocThi) {
          fail++;
          errorBox.style.display = "block";
          errorBox.innerHTML += `<div>Dòng ${i + 2}: Thiếu Mã SV hoặc Cuộc thi</div>`;
          continue;
        }

        if (isNaN(diem) || diem < 0 || diem > 100) {
          fail++;
          errorBox.style.display = "block";
          errorBox.innerHTML += `<div>${maSV}: Điểm không hợp lệ (0-100)</div>`;
          continue;
        }

        const key = maSV + "_" + tenCuocThi;
        if (usedSV.has(key)) {
          fail++;
          errorBox.style.display = "block";
          errorBox.innerHTML += `<div>${maSV}: Bị trùng kết quả trong file Excel</div>`;
          continue;
        }
        usedSV.add(key);

        const dk = dangKyList.find(
          (x) => x.MaSV === maSV && x.TenCuocThi === tenCuocThi,
        );
        if (!dk) {
          fail++;
          errorBox.style.display = "block";
          errorBox.innerHTML += `<div>${maSV}: Chưa đăng ký cuộc thi "${tenCuocThi}"</div>`;
          continue;
        }

        if (usedDangKy.has(dk.MaDangKy)) {
          fail++;
          errorBox.style.display = "block";
          errorBox.innerHTML += `<div>${maSV}: Bị trùng kết quả trong file</div>`;
          continue;
        }
        usedDangKy.add(dk.MaDangKy);

        const existed = allResults.find((x) => x.MaDangKy === dk.MaDangKy);
        if (existed) {
          fail++;
          errorBox.style.display = "block";
          errorBox.innerHTML += `<div>${maSV}: Đã có kết quả trước đó</div>`;
          continue;
        }

        payload.push({
          MaKetQua:
            "KQ" + Math.random().toString(36).substring(2, 8).toUpperCase(),
          MaDangKy: dk.MaDangKy,
          XepHang: parseInt(row["STT"]) || null,
          GiaiThuong: giaiThuong,
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
        successBox.innerHTML = `Import thành công: ${success} dòng<br>Thất bại: ${fail} dòng`;

        if (errors.length > 0) {
          errorBox.style.display = "block";
          errorBox.innerHTML += errors.map((e) => `<div>${e}</div>`).join("");
        }

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
