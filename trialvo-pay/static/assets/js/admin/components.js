/**
 * Trialvo Pay Admin SPA - Reusable Components
 * Renders the shell, sidebar, header, tables, cards, forms
 * Delegates to shared UI library (ui.js) for reusable elements
 * Light Theme — Teal/Emerald
 */

const Components = {

  // ─── App Shell ─────────────────────────────────────────────────────────────
  renderShell() {
    const navHTML = NAV_ITEMS.map(item => {
      if (item.separator) return `<div class="nav-separator"></div>`;
      return `
        <div class="nav-item" data-path="${item.path}" ${item.external ? 'data-external="true"' : ''} id="nav-${item.icon}">
          <i data-lucide="${item.icon}" class="nav-icon"></i>
          <span class="nav-label">${item.label}</span>
          ${item.badge ? `<span class="nav-badge-count" id="badge-${item.badge}"></span>` : ''}
          ${item.external ? '<i data-lucide="external-link" style="width:12px;height:12px;opacity:.35;margin-left:auto"></i>' : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="admin-layout">
        <!-- Mobile Sidebar Backdrop -->
        <div class="sidebar-backdrop" id="sidebar-backdrop"></div>

        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-header">
            <div class="sidebar-logo">
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="url(#sg)"/>
                <path d="M12 20h16M20 12v16" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="40" y2="40">
                    <stop stop-color="#0d9488"/><stop offset="1" stop-color="#14b8a6"/>
                  </linearGradient>
                </defs>
              </svg>
              <div>
                <div class="logo-name">Trialvo Pay</div>
                <div class="logo-sub">Admin Console</div>
              </div>
            </div>
            <button class="sidebar-close-btn" id="sidebar-close" aria-label="Close sidebar">
              <i data-lucide="x"></i>
            </button>
          </div>
          <nav class="sidebar-nav">
            ${navHTML}
          </nav>
          <div class="sidebar-footer">
            <div class="nav-item" data-path="/admin/profile" id="nav-profile">
              <i data-lucide="user" class="nav-icon"></i>
              <span class="nav-label" id="admin-name">Admin</span>
            </div>
            <div class="nav-item danger" id="logout-btn">
              <i data-lucide="log-out" class="nav-icon"></i>
              <span class="nav-label">Logout</span>
            </div>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <!-- Top Header -->
          <header class="top-header">
            <button class="btn-icon" id="sidebar-toggle" aria-label="Toggle navigation">
              <i data-lucide="menu"></i>
            </button>
            <div class="header-right">
              <div class="header-clock" id="header-clock"></div>
              <div class="header-avatar">
                <i data-lucide="user-circle-2"></i>
              </div>
            </div>
          </header>

          <!-- Page Content Area -->
          <div class="page-content" id="page-content">
            <div class="page-loading"><div class="spinner"></div></div>
          </div>
        </main>
      </div>
    `;
  },

  // ─── Error State ────────────────────────────────────────────────────────────
  renderError(message) {
    return UI.errorState(message, "Router.render(location.pathname)");
  },

  // ─── Stats Card → delegates to UI ──────────────────────────────────────────
  renderStatCard(title, value, icon, color = 'primary', trend = null) {
    return UI.statCard(title, value, icon, color, trend);
  },

  // ─── Data Table → delegates to UI ──────────────────────────────────────────
  renderTable(columns, rows, emptyMessage = 'No data found') {
    return UI.table(columns, rows, { emptyMessage });
  },

  // ─── Form Input → delegates to UI ──────────────────────────────────────────
  renderInput(id, label, type = 'text', placeholder = '', value = '', required = false) {
    return UI.input(id, label, { type, placeholder, value, required });
  },

  renderSelect(id, label, options, value = '') {
    return UI.select(id, label, options, { value });
  },

  renderTextarea(id, label, placeholder = '', value = '') {
    return UI.textarea(id, label, { placeholder, value });
  },

  // ─── Page Header → delegates to UI ────────────────────────────────────────
  renderPageHeader(title, subtitle, actions = '') {
    return UI.pageHeader(title, subtitle, actions);
  },

  // ─── Loading Skeleton → delegates to UI ────────────────────────────────────
  renderSkeleton(rows = 5) {
    return UI.skeleton(rows);
  },

  // ─── Filter Bar → delegates to UI ──────────────────────────────────────────
  renderFilterBar(filters) {
    return UI.filterBar(filters);
  },

  // ─── Detail Row → delegates to UI ──────────────────────────────────────────
  renderDetailRow(label, value) {
    return UI.detailRow(label, value);
  },
};

// ─── Live Clock in Header ────────────────────────────────────────────────────
setInterval(() => {
  const el = document.getElementById('header-clock');
  if (el) el.textContent = new Date().toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' });
}, 1000);
