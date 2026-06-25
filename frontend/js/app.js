// Đăng nhập người dùng từ backend
async function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById("login-username").value.trim();

  const password = document.getElementById("login-password").value;

  const err = document.getElementById("login-err-msg");

  try {
    const data = await API.post("/auth/login", {
      username,
      password,
    });

    // Lưu JWT token
    localStorage.setItem("token", data.token);

    err.style.display = "none";

    startUserSession({
      username: data.username,
      role: data.role,
    });
  } catch (e) {
    err.textContent = e.message || "Sai tên đăng nhập hoặc mật khẩu";

    err.style.display = "block";
  }
}

// Login guest
function loginAsGuest() {
  startUserSession({
    username: "guest",
    role: "guest",
  });
}

// Đăng xuất
function handleLogout() {
  localStorage.removeItem("token");

  document.getElementById("main-app-layout").style.display = "none";

  document.getElementById("login-container").style.display = "flex";

  document.getElementById("login-form").reset();
}

let currentUser = null;

/* =========================
   LOGIN SESSION
========================= */

function startUserSession(user) {
  currentUser = user;

  document.getElementById("login-container").style.display = "none";
  document.getElementById("main-app-layout").style.display = "flex";

  // Ẩn nút "Đổi mật khẩu" với tài khoản khách
  const btnDoiMK = document.querySelector(
    '.topbar-actions .btn[onclick="showChangePassword()"]',
  );
  if (btnDoiMK) btnDoiMK.style.display = user.role === "guest" ? "none" : "";

  RoleManager.switchTo(user.role);
}

/* =========================
   CHANGE PASSWORD
========================= */

function showChangePassword() {
  document.getElementById("change-password-modal").style.display = "flex";
}

function closeChangePassword() {
  document.getElementById("change-password-modal").style.display = "none";

  document.getElementById("old-password").value = "";
  document.getElementById("new-password").value = "";
  document.getElementById("confirm-password").value = "";
}

async function changePassword() {
  const oldPassword = document.getElementById("old-password").value;

  const newPassword = document.getElementById("new-password").value;

  const confirmPassword = document.getElementById("confirm-password").value;

  if (newPassword !== confirmPassword) {
    alert("Mật khẩu nhập lại không khớp!");
    return;
  }

  try {
    await API.post("/auth/change-password", {
      oldPassword,
      newPassword,
    });

    alert("Đổi mật khẩu thành công!");

    closeChangePassword();
  } catch (e) {
    alert(e.message);
  }
}
