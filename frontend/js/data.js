/* =========================================================
   js/data.js – Static configuration data
   Role definitions, navigation items, screen metadata
   ========================================================= */

/** =====================================================
 * ROLES
 * ===================================================== */

const ROLES = {
  /* ================= ADMIN ================= */

  admin: {
    label: "Quản trị viên",
    badgeCls: "role-admin",
    initials: "AD",

    screens: [
      "dashboard",
      "profile",
      "contests",
      "registration",
      "results",
      "students",
      "teachers",
      "accounts",
      "reports",
      "logs",
    ],
  },

  /* ================= CÁN BỘ ================= */

  cb: {
    label: "Cán bộ quản lý",
    badgeCls: "role-cb",
    initials: "CB",

    screens: [
      "dashboard",
      "profile",
      "contests",
      "registration",
      "results",
      "reports",
    ],
  },

  /* ================= SINH VIÊN ================= */

  sv: {
    label: "Sinh viên",
    badgeCls: "role-sv",
    initials: "SV",

    screens: [
      "dashboard",
      "profile",
      "contests",
      "my-registration",
      "cancel-registration",
      "results",
    ],
  },

  /* ================= GIẢNG VIÊN ================= */

  gv: {
    label: "Giảng viên",
    badgeCls: "role-gv",
    initials: "GV",

    screens: ["dashboard", "profile", "gv-contests", "participants", "results"],
  },

  guest: {
    label: "Khách",
    badgeCls: "role-guest",
    initials: "G",

    screens: ["dashboard", "contests", "results"],
  },
};

/** =====================================================
 * NAVIGATION META
 * ===================================================== */

const NAV_META = {
  /* ===== Tổng quan ===== */

  dashboard: {
    label: "Dashboard",
    icon: "ti-layout-dashboard",
    section: "Tổng quan",
  },

  profile: {
    label: "Tài khoản của tôi",
    icon: "ti-user-circle",
    section: "Tổng quan",
  },

  /* ===== Quản lý ===== */

  contests: {
    label: "Cuộc thi",
    icon: "ti-trophy",
    section: "Quản lý",
  },

  registration: {
    label: "Duyệt đăng ký",
    icon: "ti-user-check",
    section: "Quản lý",
  },

  participants: {
    label: "DS tham gia",
    icon: "ti-list-details",
    section: "Quản lý",
  },

  "gv-contests": {
    label: "Cuộc thi",
    icon: "ti-trophy",
    section: "Quản lý",
  },

  confirm: {
    label: "Xác nhận SV",
    icon: "ti-check",
    section: "Quản lý",
  },

  students: {
    label: "Sinh viên",
    icon: "ti-users",
    section: "Quản lý",
  },

  teachers: {
    label: "Giảng viên",
    icon: "ti-school",
    section: "Quản lý",
  },

  results: {
    label: "Kết quả",
    icon: "ti-medal",
    section: "Quản lý",
  },

  /* ===== Sinh viên ===== */

  "my-registration": {
    label: "Đăng ký tham gia",
    icon: "ti-user-plus",
    section: "Sinh viên",
  },

  "cancel-registration": {
    label: "Hủy đăng ký",
    icon: "ti-user-x",
    section: "Sinh viên",
  },

  /* ===== Hệ thống ===== */

  reports: {
    label: "Báo cáo",
    icon: "ti-chart-bar",
    section: "Hệ thống",
  },

  accounts: {
    label: "Tài khoản",
    icon: "ti-settings",
    section: "Hệ thống",
  },

  permissions: {
    label: "Phân quyền",
    icon: "ti-lock",
    section: "Hệ thống",
  },

  logs: {
    label: "Nhật ký",
    icon: "ti-file-text",
    section: "Hệ thống",
  },
};

/** =====================================================
 * SCREEN TITLES
 * ===================================================== */

const SCREEN_TITLES = {
  dashboard: "Dashboard",

  profile: "Thông tin tài khoản",

  contests: "Quản lý cuộc thi",

  registration: "Duyệt đăng ký",

  participants: "Danh sách tham gia",

  "gv-contests": "Cuộc thi",

  confirm: "Xác nhận sinh viên",

  students: "Quản lý sinh viên",

  teachers: "Quản lý giảng viên",

  results: "Kết quả cuộc thi",

  "my-registration": "Đăng ký tham gia",

  "cancel-registration": "Hủy đăng ký",

  reports: "Báo cáo thống kê",

  accounts: "Quản lý tài khoản",

  permissions: "Phân quyền hệ thống",

  logs: "Nhật ký hệ thống",
};
