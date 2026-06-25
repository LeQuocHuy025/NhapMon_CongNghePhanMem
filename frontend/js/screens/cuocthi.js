// js/screens/cuocthi.js
// Màn hình "Quản lý cuộc thi" – xem, thêm, sửa, xóa cuộc thi.

// ─── Biến module-level ────────────────────────────────────────────────────────
let editingContestId = null;
let _contestData = []; // cache dữ liệu cuộc thi hiện tại
let _contestStatusTimer = null; // setInterval handle để cập nhật badge live

// =============================================================================
// HÀM TÍNH TRẠNG THÁI THEO THỜI GIAN THỰC (phía client – chỉ dùng để hiển thị)
// =============================================================================

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

function _refreshContestStatusBadges() {
  _contestData.forEach((ct) => {
    const badge = document.querySelector(
      `[data-contest-id="${ct.MaCuocThi}"] .status-badge`,
    );
    if (!badge) return;

    const newStatus = computeTrangThai(ct.ThoiGianBatDau, ct.ThoiGianKetThuc);
    const oldStatus = ct.TrangThai;

    if (newStatus !== oldStatus) {
      ct.TrangThai = newStatus;
      badge.textContent = newStatus;
      badge.className = `badge ${badgeClass(newStatus)} status-badge`;
    }
  });
}

function stopContestStatusTimer() {
  if (_contestStatusTimer) {
    clearInterval(_contestStatusTimer);
    _contestStatusTimer = null;
  }
}

// =============================================================================
// ẨN/HIỆN UI THEO ROLE
// =============================================================================

function _toggleContestAdminUI() {
  const isSV = currentUser?.role === "sv" || currentUser?.role === "guest";
  const isGuest = currentUser?.role === "guest";

  document.querySelectorAll(".content .btn-primary").forEach((btn) => {
    if (btn.getAttribute("onclick") === "addContest()") {
      const canAdd =
        currentUser?.role === "admin" || currentUser?.role === "cb";
      btn.style.display = canAdd ? "" : "none";
    }
  });

  const ths = document.querySelectorAll(".content table thead th");
  ths.forEach((th) => {
    if (th.textContent.trim() === "Thao tác") {
      th.style.display = isSV ? "none" : "";
    }
    if (th.textContent.trim() === "Đăng ký") {
      th.style.display = isGuest ? "none" : "";
    }
  });
}

// =============================================================================
// QUẢN LÝ CUỘC THI
// =============================================================================

async function screenContests() {
  stopContestStatusTimer();

  const tbody = document.getElementById("contests-tbody");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;opacity:.4;padding:24px">
      <i class="ti ti-loader ti-spin"></i> Đang tải...
    </td></tr>`;
  }

  try {
    let data;
    try {
      data = await API.post("/cuocthi/sync-status", {});
    } catch (_) {
      data = await API.get("/cuocthi");
    }

    // TrangThai từ server là chuẩn; client chỉ override nếu server không trả về
    _contestData = data.map((ct) => ({
      ...ct,
      TrangThai:
        ct.TrangThai || computeTrangThai(ct.ThoiGianBatDau, ct.ThoiGianKetThuc),
    }));

    const loaiSelect = document.getElementById("filter-loai");
    if (loaiSelect && loaiSelect.options.length === 0) {
      const dsLoai = [
        ...new Set(_contestData.map((ct) => ct.LoaiCuocThi).filter(Boolean)),
      ];
      loaiSelect.innerHTML =
        `<option value="all">Tất cả loại</option>` +
        dsLoai
          .map((loai) => `<option value="${loai}">${loai}</option>`)
          .join("");
    }

    const trangThaiSelect = document.getElementById("filter-trangthai");
    if (trangThaiSelect && trangThaiSelect.options.length === 0) {
      const dsTrangThai = ["Mở sớm", "Đang mở", "Sắp đóng", "Đã kết thúc"];
      trangThaiSelect.innerHTML =
        `<option value="all">Tất cả trạng thái</option>` +
        dsTrangThai
          .map((tt) => `<option value="${tt}">${tt}</option>`)
          .join("");
    }

    _renderContestsTable();

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

function _renderContestsTable() {
  const keyword =
    document.getElementById("search-contest")?.value.toLowerCase() || "";
  const loai = document.getElementById("filter-loai")?.value || "all";
  const trangThai = document.getElementById("filter-trangthai")?.value || "all";

  const filtered = _contestData.filter((ct) => {
    const matchKeyword =
      ct.TenCuocThi.toLowerCase().includes(keyword) ||
      ct.MaCuocThi.toLowerCase().includes(keyword) ||
      (ct.DiaDiem || "").toLowerCase().includes(keyword) ||
      (ct.DonViToChuc || "").toLowerCase().includes(keyword);
    const matchLoai = loai === "all" || ct.LoaiCuocThi === loai;
    const matchTrangThai = trangThai === "all" || ct.TrangThai === trangThai;
    return matchKeyword && matchLoai && matchTrangThai;
  });

  const tbody = document.getElementById("contests-tbody");
  if (!tbody) return;

  const isGuest = currentUser?.role === "guest";
  const isSV = currentUser?.role === "sv" || isGuest;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="${isSV ? 8 : 9}" style="text-align:center;opacity:.5;padding:24px">
      Không tìm thấy cuộc thi nào
    </td></tr>`;
    _toggleContestAdminUI();
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
        <td>${ct.DonViToChuc || "-"}</td>
        ${!isGuest ? `<td>${ct.SoLuongDaDangKy || 0}/${ct.SoLuongToiDa || 0}</td>` : ""}
        <td>
          <span class="badge ${badgeClass(ct.TrangThai)} status-badge">
            ${ct.TrangThai}
          </span>
        </td>
        ${
          isSV
            ? ""
            : `
        <td class="action-cell">
          <button class="btn btn-sm" onclick="editContest('${ct.MaCuocThi}')">Sửa</button>
          <button class="btn btn-sm btn-danger" onclick="deleteContest('${ct.MaCuocThi}')">Xóa</button>
        </td>`
        }
      </tr>
    `,
    )
    .join("");

  _toggleContestAdminUI();
}

async function deleteContest(id) {
  if (!confirm("Xóa cuộc thi này?")) return;
  try {
    await API.delete("/cuocthi/" + id);
    screenContests();
  } catch (e) {
    alert(e.message);
  }
}

/** Load danh sách khoa vào dropdown #edit-donvitochuc */
async function _loadKhoaOptions(selectedValue) {
  const sel = document.getElementById("edit-donvitochuc");
  if (!sel) return;
  try {
    const khoaList = await API.get("/khoa");
    sel.innerHTML =
      `<option value="HVCS">HVCS (Toàn trường)</option>` +
      khoaList
        .map((k) => `<option value="${k.TenKhoa}">${k.TenKhoa}</option>`)
        .join("");
    sel.value = selectedValue || "HVCS";
  } catch (e) {
    // Nếu lỗi thì giữ nguyên option mặc định HVCS
    console.warn("Không load được danh sách khoa:", e.message);
  }
}

async function addContest() {
  editingContestId = null;
  document.getElementById("edit-ten").value = "";
  document.getElementById("edit-loai").value = "";
  document.getElementById("edit-diadiem").value = "";
  document.getElementById("edit-batdau").value = "";
  document.getElementById("edit-ketthuc").value = "";
  document.getElementById("edit-soluong").value = "";
  await _loadKhoaOptions("HVCS");
  document.querySelector("#contest-modal .section-title").textContent =
    "Thêm cuộc thi";
  document.querySelector("#contest-modal .btn.btn-primary").textContent =
    "Thêm";
  document.getElementById("contest-modal").style.display = "flex";
}

async function editContest(id) {
  try {
    const old = await API.get("/cuocthi/" + id);
    editingContestId = id;
    document.getElementById("edit-ten").value = old.TenCuocThi || "";
    document.getElementById("edit-loai").value = old.LoaiCuocThi || "";
    document.getElementById("edit-diadiem").value = old.DiaDiem || "";
    document.getElementById("edit-batdau").value = old.ThoiGianBatDau
      ? old.ThoiGianBatDau.slice(0, 16)
      : "";
    document.getElementById("edit-ketthuc").value = old.ThoiGianKetThuc
      ? old.ThoiGianKetThuc.slice(0, 16)
      : "";
    document.getElementById("edit-soluong").value = old.SoLuongToiDa || 0;
    await _loadKhoaOptions(old.DonViToChuc || "HVCS");
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

async function saveContest() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const batDauVal = document.getElementById("edit-batdau").value;
    const ketThucVal = document.getElementById("edit-ketthuc").value;

    // ✅ KHÔNG gửi TrangThai – server tự tính bằng SQL CASE theo thời gian thực
    const payload = {
      TenCuocThi: document.getElementById("edit-ten").value,
      LoaiCuocThi: document.getElementById("edit-loai").value,
      DiaDiem: document.getElementById("edit-diadiem").value,
      ThoiGianBatDau: new Date(batDauVal).toISOString(),
      ThoiGianKetThuc: new Date(ketThucVal).toISOString(),
      SoLuongToiDa: parseInt(document.getElementById("edit-soluong").value),
      DonViToChuc: document.getElementById("edit-donvitochuc")?.value || "HVCS",
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

function closeContestModal() {
  document.getElementById("contest-modal").style.display = "none";
}

// =============================================================================
// CUỘC THI CHO GIẢNG VIÊN (chỉ xem)
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

    _gvContestData = data.map((ct) => ({
      ...ct,
      TrangThai:
        ct.TrangThai || computeTrangThai(ct.ThoiGianBatDau, ct.ThoiGianKetThuc),
    }));

    const loaiSel = document.getElementById("filter-gv-loai");
    if (loaiSel) {
      const dsLoai = [
        ...new Set(_gvContestData.map((ct) => ct.LoaiCuocThi).filter(Boolean)),
      ];
      loaiSel.innerHTML =
        `<option value="all">Tất cả loại</option>` +
        dsLoai.map((l) => `<option value="${l}">${l}</option>`).join("");
    }

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
        <td>${ct.DonViToChuc || "-"}</td>
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
