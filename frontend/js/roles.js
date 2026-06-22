/* =========================================================
   js/roles.js – Role switching & sidebar nav builder
   Reads ROLES / NAV_META from data.js
   ========================================================= */

const RoleManager = (() => {
  let _activeRole = 'admin';

  /**
   * Switch the UI to the given role.
   * Rebuilds the sidebar nav and navigates to that role's first screen.
   * @param {string} roleKey  – key in ROLES object
   */
  function switchTo(roleKey) {
    const role = ROLES[roleKey];
    if (!role) return;

    _activeRole = roleKey;

    // Update role badge in sidebar
    const badge = document.getElementById('role-display');
    badge.textContent = role.label;
    badge.className = `role-badge ${role.badgeCls}`;

    // Update user avatar initials
    document.getElementById('user-avatar').textContent = role.initials;

    // Mark active role button in topbar
    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.classList.toggle('active-role', btn.dataset.role === roleKey);
    });

    // Rebuild sidebar navigation for this role
    _buildNav(role.screens);

    // Navigate to the first allowed screen
    Router.go(role.screens[0]);
  }

  /**
   * Build the sidebar <nav> based on an ordered list of screen ids.
   * Inserts section headers (Tổng quan / Quản lý / Hệ thống) automatically.
   * @param {string[]} screenIds
   */
  function _buildNav(screenIds) {
    const nav = document.getElementById('nav-menu');
    nav.innerHTML = '';

    let lastSection = null;

    screenIds.forEach(id => {
      const meta = NAV_META[id];
      if (!meta) return;

      // Insert section header when section changes
      if (meta.section !== lastSection) {
        const header = document.createElement('div');
        header.className = 'nav-section';
        header.textContent = meta.section;
        nav.appendChild(header);
        lastSection = meta.section;
      }

      // Nav item
      const item = document.createElement('div');
      item.className = 'nav-item';
      item.dataset.screen = id;
      item.innerHTML = `<i class="ti ${meta.icon}" aria-hidden="true"></i> ${meta.label}`;
      item.addEventListener('click', () => Router.go(id));
      nav.appendChild(item);
    });
  }

  /** Return the currently active role key */
  function active() {
    return _activeRole;
  }

  return { switchTo, active };
})();
