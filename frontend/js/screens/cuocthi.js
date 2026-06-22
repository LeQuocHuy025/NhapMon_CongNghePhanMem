// js/screens/cuocthi.js
// Màn hình "Quản lý cuộc thi" – xem, thêm, sửa, xóa cuộc thi.
// (Tách nguyên văn từ js/screens.js – không đổi logic)

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
