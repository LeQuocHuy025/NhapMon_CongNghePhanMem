/* =========================================================
   js/router.js – Client-side screen router
   ========================================================= */

const Router = (() => {
  let _currentScreen = null;

  // Map screen → hàm load data
  const SCREEN_LOADERS = {
    dashboard: screenDashboard,
    profile: screenProfile,
    contests: screenContests,
    registration: screenRegistration,
    participants: screenParticipants,
    confirm: screenConfirm,
    "gv-contests": screenGvContests,
    students: screenStudents,
    teachers: screenTeachers,
    results: screenResults,
    "my-registration": screenMyRegistration,
    "cancel-registration": screenCancelRegistration,
    accounts: screenAccounts,
    reports: screenReports,
    permissions: screenPermissions,
    logs: screenLogs,
  };

  /**
   * Navigate to a screen by id.
   * @param {string} screenId
   */
  function go(screenId) {
    const tpl = document.getElementById(`tpl-${screenId}`);

    if (!tpl) {
      console.warn(`Router: no template found for screen "${screenId}"`);
      return;
    }

    // Render content
    const content = document.getElementById("content");
    content.innerHTML = tpl.innerHTML;

    // Update topbar title
    document.getElementById("topbar-title").textContent =
      SCREEN_TITLES[screenId] || screenId;

    // Update active nav item
    document.querySelectorAll(".nav-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.screen === screenId);
    });

    _currentScreen = screenId;

    // ✅ Tự động gọi hàm load data
    const loader = SCREEN_LOADERS[screenId];

    if (loader) {
      loader();
    }
  }

  /** Return current screen */
  function current() {
    return _currentScreen;
  }

  return { go, current };
})();
