// js/screens/dangky.js
// Các màn hình liên quan đăng ký:
//   - Duyệt đăng ký (admin/cb)
//   - Danh sách tham gia (gv)
//   - Xác nhận sinh viên (gv)
//   - Đăng ký tham gia & Hủy đăng ký (sv)
// (Tách nguyên văn từ js/screens.js – không đổi logic)

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
