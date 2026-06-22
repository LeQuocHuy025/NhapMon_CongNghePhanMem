// js/screens/cuocthi.js
// Màn hình "Quản lý cuộc thi" – xem, thêm, sửa, xóa cuộc thi.

// ─── Biến module-level ────────────────────────────────────────────────────────
let editingContestId = null;
let _contestData = []; // cache dữ liệu cuộc thi hiện tại
let _contestStatusTimer = null; // setInterval handle để cập nhật badge live

// =============================================================================
// HÀM TÍNH TRẠNG THÁI THEO THỜI GIAN THỰC (phía client)
// Dùng để cập nhật badge mà không cần gọi API lại
// =============================================================================

/**
 * Tính TrangThai của một cuộc thi dựa vào thời gian hiện tại.
 * Logic khớp với SQL CASE trong backend sync-status.
 *   - Chưa đến giờ bắt đầu               → "Mở sớm"
 *   - Đang diễn ra, còn > 24h kết thúc   → "Đang mở"
 *   - Đang diễn ra, còn ≤ 24h kết thúc   → "Sắp đóng"
 *   - Đã qua giờ kết thúc                → "Đã kết thúc"
 */
function computeTrangThai(thoiGianBatDau, thoiGianKetThuc) {
  const now = Date.now();
  const batDau = new Date(thoiGianBatDau).getTime();
  const ketThuc = new Date(thoiGianKetThuc).getTime();
  const MS_24H = 24 * 60 * 60 * 1000;

  if (now > ketThuc) return "Đã kết thúc";
  if (now >= batDau && ketThuc - now < MS_24H) return "Sắp đóng";
  if (now >= batDau) return "Đang mở";
  return "Mở sớm";
}

/**
 * Cập nhật tất cả badge trạng thái trong bảng theo thời gian thực.
 * Chạy mỗi 60 giây qua setInterval.
 * Không re-render toàn bộ bảng (chỉ đổi text + class badge).
 */
function _refreshContestStatusBadges() {
  _contestData.forEach((ct) => {
    const badge = document.querySelector(
      `[data-contest-id="${ct.MaCuocThi}"] .status-badge`,
    );
    if (!badge) return;

    const newStatus = computeTrangThai(ct.ThoiGianBatDau, ct.ThoiGianKetThuc);
    const oldStatus = ct.TrangThai;

    if (newStatus !== oldStatus) {
      ct.TrangThai = newStatus; // cập nhật cache
      badge.textContent = newStatus;
      badge.className = `badge ${badgeClass(newStatus)} status-badge`;
    }
  });
}

/**
 * Dừng timer cập nhật trạng thái (gọi khi rời khỏi màn hình).
 * Router.go() sẽ re-render innerHTML, nên timer cũ không còn tham chiếu DOM.
 * Để an toàn, gọi hàm này trước khi navigate.
 */
function stopContestStatusTimer() {
  if (_contestStatusTimer) {
    clearInterval(_contestStatusTimer);
    _contestStatusTimer = null;
  }
}

// =============================================================================
// QUẢN LÝ CUỘC THI (admin / cb) – xem, thêm, sửa, xóa
// =============================================================================

/** Tải danh sách cuộc thi, populate filter dropdowns, render bảng */
async function screenContests() {
  stopContestStatusTimer(); // dừng timer cũ nếu có

  const tbody = document.getElementById("contests-tbody");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;opacity:.4;padding:24px">
      <i class="ti ti-loader ti-spin"></i> Đang tải...
    </td></tr>`;
  }

  try {
    // Gọi sync-status trước để DB cập nhật TrangThai theo thời gian thực,
    // sau đó lấy danh sách mới nhất đã được sync
    let data;
    try {
      data = await API.post("/cuocthi/sync-status", {});
    } catch (_) {
      // Nếu sync thất bại (không có quyền, mất mạng...) thì fallback GET thường
      data = await API.get("/cuocthi");
    }

    // Ghi đè TrangThai bằng giá trị tính từ thời gian thực (phía client)
    // để đảm bảo hiển thị chính xác ngay lập tức
    _contestData = data.map((ct) => ({
      ...ct,
      TrangThai: computeTrangThai(ct.ThoiGianBatDau, ct.ThoiGianKetThuc),
    }));

    // Populate dropdown lọc theo loại cuộc thi (luôn populate lại sau mỗi navigate)
    const loaiSelect = document.getElementById("filter-loai");
    if (loaiSelect) {
      const dsLoai = [
        ...new Set(_contestData.map((ct) => ct.LoaiCuocThi).filter(Boolean)),
      ];
      loaiSelect.innerHTML =
        `<option value="all">Tất cả loại</option>` +
        dsLoai
          .map((loai) => `<option value="${loai}">${loai}</option>`)
          .join("");
    }

    // Populate dropdown lọc theo trạng thái
    const trangThaiSelect = document.getElementById("filter-trangthai");
    if (trangThaiSelect) {
      const dsTrangThai = ["Mở sớm", "Đang mở", "Sắp đóng", "Đã kết thúc"];
      trangThaiSelect.innerHTML =
        `<option value="all">Tất cả trạng thái</option>` +
        dsTrangThai
          .map((tt) => `<option value="${tt}">${tt}</option>`)
          .join("");
    }

    _renderContestsTable();

    // Khởi động timer cập nhật badge mỗi 60 giây
    _contestStatusTimer = setInterval(() => {
      _refreshContestStatusBadges();
    }, 60 * 1000);
  } catch (e) {
    console.error("[screenContests]", e);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="9" style="color:#f87171;text-align:center;padding:16px">
        Lỗi tải dữ liệu: ${e.message}
      </td></tr>`;
    }
  }
}

/** Render bảng từ _contestData với bộ lọc hiện tại */
function _renderContestsTable() {
  const keyword =
    document.getElementById("search-contest")?.value.toLowerCase() || "";
  const loai = document.getElementById("filter-loai")?.value || "all";
  const trangThai = document.getElementById("filter-trangthai")?.value || "all";

  const filtered = _contestData.filter((ct) => {
    const matchKeyword =
      ct.TenCuocThi.toLowerCase().includes(keyword) ||
      ct.MaCuocThi.toLowerCase().includes(keyword);
    const matchLoai = loai === "all" || ct.LoaiCuocThi === loai;
    const matchTrangThai = trangThai === "all" || ct.TrangThai === trangThai;
    return matchKeyword && matchLoai && matchTrangThai;
  });

  const tbody = document.getElementById("contests-tbody");
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;opacity:.5;padding:24px">
      Không tìm thấy cuộc thi nào
    </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (ct) => `
      <tr data-contest-id="${ct.MaCuocThi}">
        <td>${ct.MaCuocThi}</td>
        <td>${ct.TenCuocThi}</td>
        <td>${ct.LoaiCuocThi || "-"}</td>
        <td>${formatDate(ct.ThoiGianBatDau)}</td>
        <td>${formatDate(ct.ThoiGianKetThuc)}</td>
        <td>${ct.DiaDiem || "-"}</td>
        <td>${ct.SoLuongDaDangKy || 0}/${ct.SoLuongToiDa || 0}</td>
        <td>
          <span class="badge ${badgeClass(ct.TrangThai)} status-badge">
            ${ct.TrangThai}
          </span>
        </td>
        <td class="action-cell">
          <button class="btn btn-sm" onclick="editContest('${ct.MaCuocThi}')">Sửa</button>
          <button class="btn btn-sm btn-danger" onclick="deleteContest('${ct.MaCuocThi}')">Xóa</button>
        </td>
      </tr>
    `,
    )
    .join("");
}

/** Xóa cuộc thi sau khi xác nhận, sau đó reload bảng */
async function deleteContest(id) {
  if (!confirm("Xóa cuộc thi này?")) return;
  try {
    await API.delete("/cuocthi/" + id);
    screenContests();
  } catch (e) {
    alert(e.message);
  }
}

/** Mở modal thêm mới cuộc thi */
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

/** Lưu cuộc thi: thêm mới hoặc cập nhật */
async function saveContest() {
  try {
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
      MaGV: user.MaGV || user.maGV || null,
    };

    if (!editingContestId) {
      await API.post("/cuocthi", payload);
      alert("Thêm cuộc thi thành công!");
    } else {
      const old = await API.get("/cuocthi/" + editingContestId);
      await API.put("/cuocthi/" + editingContestId, { ...old, ...payload });
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
// =============================================================================

let _gvContestData = [];
let _gvContestStatusTimer = null;

function stopGvContestStatusTimer() {
  if (_gvContestStatusTimer) {
    clearInterval(_gvContestStatusTimer);
    _gvContestStatusTimer = null;
  }
}

function _refreshGvContestStatusBadges() {
  _gvContestData.forEach((ct) => {
    const badge = document.querySelector(
      `[data-gv-contest-id="${ct.MaCuocThi}"] .status-badge`,
    );
    if (!badge) return;
    const newStatus = computeTrangThai(ct.ThoiGianBatDau, ct.ThoiGianKetThuc);
    if (newStatus !== ct.TrangThai) {
      ct.TrangThai = newStatus;
      badge.textContent = newStatus;
      badge.className = `badge ${badgeClass(newStatus)} status-badge`;
    }
  });
}

async function screenGvContests() {
  stopGvContestStatusTimer();

  const tbody = document.getElementById("gv-contests-tbody");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;opacity:.4;padding:24px">
      <i class="ti ti-loader ti-spin"></i> Đang tải...
    </td></tr>`;
  }

  try {
    const data = await API.get("/cuocthi");

    // Tính lại TrangThai từ thời gian thực
    _gvContestData = data.map((ct) => ({
      ...ct,
      TrangThai: computeTrangThai(ct.ThoiGianBatDau, ct.ThoiGianKetThuc),
    }));

    // Populate dropdown Loại
    const loaiSel = document.getElementById("filter-gv-loai");
    if (loaiSel) {
      const dsLoai = [
        ...new Set(_gvContestData.map((ct) => ct.LoaiCuocThi).filter(Boolean)),
      ];
      loaiSel.innerHTML =
        `<option value="all">Tất cả loại</option>` +
        dsLoai.map((l) => `<option value="${l}">${l}</option>`).join("");
    }

    // Populate dropdown Trạng thái
    const ttSel = document.getElementById("filter-gv-trangthai");
    if (ttSel) {
      ttSel.innerHTML = `
        <option value="all">Tất cả trạng thái</option>
        <option value="Mở sớm">Mở sớm</option>
        <option value="Đang mở">Đang mở</option>
        <option value="Sắp đóng">Sắp đóng</option>
        <option value="Đã kết thúc">Đã kết thúc</option>
      `;
    }

    _renderGvContestsTable();

    // Timer cập nhật badge mỗi 60 giây
    _gvContestStatusTimer = setInterval(() => {
      _refreshGvContestStatusBadges();
    }, 60 * 1000);
  } catch (e) {
    console.error("[screenGvContests]", e);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="8" style="color:#f87171;text-align:center;padding:16px">
        Lỗi tải dữ liệu: ${e.message}
      </td></tr>`;
    }
  }
}

function _renderGvContestsTable() {
  const keyword =
    document.getElementById("search-gv-contest")?.value.toLowerCase() || "";
  const loai = document.getElementById("filter-gv-loai")?.value || "all";
  const tt = document.getElementById("filter-gv-trangthai")?.value || "all";

  const filtered = _gvContestData.filter((ct) => {
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
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;opacity:.5;padding:24px">
      Không tìm thấy cuộc thi nào
    </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (ct) => `
      <tr data-gv-contest-id="${ct.MaCuocThi}">
        <td>${ct.MaCuocThi}</td>
        <td>${ct.TenCuocThi}</td>
        <td>${ct.LoaiCuocThi || "-"}</td>
        <td>${formatDate(ct.ThoiGianBatDau)}</td>
        <td>${formatDate(ct.ThoiGianKetThuc)}</td>
        <td>${ct.DiaDiem || "-"}</td>
        <td>${ct.SoLuongDaDangKy || 0}/${ct.SoLuongToiDa || 0}</td>
        <td>
          <span class="badge ${badgeClass(ct.TrangThai)} status-badge">
            ${ct.TrangThai}
          </span>
        </td>
      </tr>
    `,
    )
    .join("");
}
