// js/screens/sinhvien.js
// Màn hình "Quản lý sinh viên" – danh sách, lọc, thêm/sửa/xóa, import Excel.
// (Tách nguyên văn từ js/screens.js – không đổi logic)

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

// =============================================================================
// IMPORT SINH VIÊN TỪ EXCEL
// =============================================================================

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
