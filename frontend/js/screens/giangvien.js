// js/screens/giangvien.js
// Màn hình "Quản lý giảng viên" – danh sách, thêm/sửa/xóa giảng viên.
// (Tách nguyên văn từ js/screens.js – không đổi logic)

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
