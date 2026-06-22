// js/screens/tienich.js
// Các hàm tiện ích & hằng số dùng chung cho tất cả màn hình.
// (Tách nguyên văn từ js/screens.js – không đổi logic)

/** Gán nội dung text cho element theo id. Hiển thị "-" nếu value rỗng/null */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "-";
}

/** Định dạng chuỗi ngày giờ sang định dạng tiếng Việt */
function formatDate(str) {
  if (!str) return "-";
  return new Date(str).toLocaleString("vi-VN");
}

/** Trả về CSS class badge tương ứng với trạng thái */
function badgeClass(trangThai) {
  const map = {
    "Đang mở": "badge-green",
    "Mở sớm": "badge-blue",
    "Sắp đóng": "badge-amber",
    "Đã kết thúc": "badge-gray",
    "Đã duyệt": "badge-green",
    "Chờ duyệt": "badge-amber",
    "Từ chối": "badge-red",
    "Đã xác nhận": "badge-teal",
    "Chờ xác nhận": "badge-amber",
  };
  return map[trangThai] || "badge-gray";
}

// DASHBOARD
// Thay hàm screenDashboard() cũ trong js/screens.js bằng toàn bộ khối này.

/* ------------------------------------------------------------------
   Màu badge theo TrangThai cuộc thi
   ------------------------------------------------------------------ */
// =============================================================================
// DASHBOARD  – xây lại hoàn chỉnh, role-aware
// Thay hàm screenDashboard() cũ trong js/screens.js bằng toàn bộ khối này.
// =============================================================================

/* ------------------------------------------------------------------
   Màu badge theo TrangThai cuộc thi
   ------------------------------------------------------------------ */
const CONTEST_STATUS_CLS = {
  "Đang mở": "badge-green",
  "Mở sớm": "badge-blue",
  "Sắp đóng": "badge-amber",
  "Đã kết thúc": "badge-gray",
};

/* ------------------------------------------------------------------
   Màu / icon badge theo loại hành động nhật ký
   ------------------------------------------------------------------ */
const ACTION_CLS = {
  "Đăng ký": { cls: "badge-blue", icon: "ti-user-plus" },
  Duyệt: { cls: "badge-green", icon: "ti-check" },
  "Từ chối": { cls: "badge-red", icon: "ti-x" },
  "Xác nhận": { cls: "badge-teal", icon: "ti-circle-check" },
  Hủy: { cls: "badge-amber", icon: "ti-ban" },
  "Thêm sinh viên": { cls: "badge-blue", icon: "ti-user-plus" },
  "Xóa sinh viên": { cls: "badge-red", icon: "ti-trash" },
  "Thêm giảng viên": { cls: "badge-blue", icon: "ti-user-plus" },
  "Thêm cuộc thi": { cls: "badge-blue", icon: "ti-trophy" },
  "Sửa cuộc thi": { cls: "badge-blue", icon: "ti-edit" },
  "Xóa cuộc thi": { cls: "badge-red", icon: "ti-trash" },
  "Thêm kết quả": { cls: "badge-teal", icon: "ti-medal" },
  "Đổi mật khẩu": { cls: "badge-gray", icon: "ti-key" },
  "Khóa tài khoản": { cls: "badge-red", icon: "ti-lock" },
  "Mở khóa tài khoản": { cls: "badge-green", icon: "ti-lock-open" },
  "Xuất Excel": { cls: "badge-gray", icon: "ti-download" },
};

/* ------------------------------------------------------------------
   Thời gian tương đối: "2 giờ trước", "hôm qua"…
   ------------------------------------------------------------------ */
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function formatExcelDate(excelDate) {
  // Nếu đã là yyyy-mm-dd
  if (typeof excelDate === "string") {
    return excelDate;
  }

  // Excel serial number -> date
  const date = new Date((excelDate - 25569) * 86400 * 1000);

  return date.toISOString().split("T")[0];
}
