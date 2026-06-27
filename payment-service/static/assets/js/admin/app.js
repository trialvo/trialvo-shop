/**
 * PayVault Admin SPA - Router & Application Shell
 * Handles navigation, auth state, and page mounting
 */

// ─── Auth State ───────────────────────────────────────────────────────────────
const Auth = {
  token: localStorage.getItem('pv_admin_token'),
  admin: JSON.parse(localStorage.getItem('pv_admin_info') || 'null'),

  setToken(token, adminInfo) {
    this.token = token;
    this.admin = adminInfo;
    localStorage.setItem('pv_admin_token', token);
    localStorage.setItem('pv_admin_info', JSON.stringify(adminInfo));
    API.setToken(token);
  },

  clear() {
    this.token = null;
    this.admin = null;
    localStorage.removeItem('pv_admin_token');
    localStorage.removeItem('pv_admin_info');
    API.setToken(null);
  },

  isAuthenticated() {
    return !!this.token;
  }
};

// Initialize API with stored token
if (Auth.token) API.setToken(Auth.token);

// ─── Route Definitions ────────────────────────────────────────────────────────
const ROUTES = {
  '/admin/login':       { page: 'login',        auth: false, title: 'Login' },
  '/admin/2fa':         { page: '2fa',           auth: false, title: '2FA Verification' },
  '/admin':             { page: 'dashboard',     auth: true,  title: 'Dashboard' },
  '/admin/dashboard':   { page: 'dashboard',     auth: true,  title: 'Dashboard' },
  '/admin/services':    { page: 'services',      auth: true,  title: 'Services' },
  '/admin/transactions':{ page: 'transactions',  auth: true,  title: 'Transactions' },
  '/admin/bills':       { page: 'bills',         auth: true,  title: 'Bills' },
  '/admin/refunds':     { page: 'refunds',       auth: true,  title: 'Refunds' },
  '/admin/customers':   { page: 'customers',     auth: true,  title: 'Customers' },
  '/admin/config':      { page: 'config',        auth: true,  title: 'Configuration' },
  '/admin/ipn':         { page: 'ipn',           auth: true,  title: 'IPN Endpoints' },
  '/admin/audit':       { page: 'audit',         auth: true,  title: 'Audit Logs' },
  '/admin/admins':      { page: 'admins',        auth: true,  title: 'Administrators' },
  '/admin/merchants':   { page: 'merchants',     auth: true,  title: 'Merchants' },
  '/admin/profile':     { page: 'profile',       auth: true,  title: 'Profile' },
  '/admin/flow':        { page: 'flow',          auth: true,  title: 'Process Flow' },
  '/admin/docs':        { page: 'docs',          auth: true,  title: 'Admin Documentation' },
};

// ─── Navigation Items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: '/admin/dashboard',    icon: 'layout-dashboard', label: 'Dashboard' },
  { path: '/admin/services',     icon: 'layers',           label: 'Services' },
  { path: '/admin/transactions', icon: 'credit-card',      label: 'Transactions' },
  { path: '/admin/bills',        icon: 'receipt',          label: 'Bills' },
  { path: '/admin/refunds',      icon: 'rotate-ccw',       label: 'Refunds',  badge: 'pending_refunds' },
  { path: '/admin/customers',    icon: 'users',            label: 'Customers' },
  { path: '/admin/ipn',          icon: 'webhook',          label: 'IPN Endpoints' },
  { path: '/admin/config',       icon: 'settings',         label: 'Configuration' },
  { path: '/admin/audit',        icon: 'shield-check',     label: 'Audit Logs' },
  { path: '/admin/admins',       icon: 'user-cog',         label: 'Administrators' },
  { path: '/admin/merchants',    icon: 'store',            label: 'Merchants' },
  { separator: true },
  { path: '/admin/flow',         icon: 'git-branch',       label: 'Process Flow' },
  { path: '/admin/docs',         icon: 'book-open',        label: 'Admin Guide' },
  { path: '/docs',               icon: 'code-2',           label: 'API Docs', external: true },
];

// ─── Router ───────────────────────────────────────────────────────────────────
const Router = {
  currentPage: null,
  currentPath: null,

  navigate(path, replace = false) {
    if (replace) {
      history.replaceState({}, '', path);
    } else {
      history.pushState({}, '', path);
    }
    this.render(path);
  },

  async render(path) {
    const route = ROUTES[path] || ROUTES['/admin'];

    document.title = `${route.title} — PayVault Admin`;

    // Auth guard
    if (route.auth && !Auth.isAuthenticated()) {
      this.navigate('/admin/login', true);
      return;
    }
    if (!route.auth && Auth.isAuthenticated() && path !== '/admin/2fa') {
      this.navigate('/admin/dashboard', true);
      return;
    }

    const app = document.getElementById('app');

    // Render shell for authenticated routes
    if (route.auth) {
      if (!document.getElementById('sidebar')) {
        app.innerHTML = Components.renderShell();
        this._initShell();
      }
      // Update active nav
      document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.path === path);
      });
      // Render page into content area
      const content = document.getElementById('page-content');
      content.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';

      try {
        await Pages[route.page](content);
      } catch (e) {
        content.innerHTML = Components.renderError(e.message);
      }
    } else {
      // Auth pages (login, 2fa)
      app.innerHTML = '';
      try {
        await Pages[route.page](app);
      } catch (e) {
        app.innerHTML = Components.renderError(e.message);
      }
    }

    // Re-init Lucide icons
    if (window.lucide) lucide.createIcons();
  },

  _initShell() {
    // Sidebar nav clicks
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (el.dataset.external === 'true') {
          window.open(path, '_blank');
        } else {
          this.navigate(path);
        }
      });
    });

    // Mobile sidebar toggle
    const toggle = document.getElementById('sidebar-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
      });
    }

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      try { await API.logout(); } catch (e) {}
      Auth.clear();
      Router.navigate('/admin/login', true);
    });

    // Admin name in header
    const adminName = document.getElementById('admin-name');
    if (adminName && Auth.admin) {
      adminName.textContent = Auth.admin.display_name || Auth.admin.email;
    }
  }
};

// ─── Global Toast System (delegates to UI) ───────────────────────────────────
const Toast = {
  show(message, type = 'info', duration = 4000) {
    UI.toast(message, type, duration);
  },
  success: (msg) => UI.toast(msg, 'success'),
  error: (msg) => UI.toast(msg, 'error'),
  info: (msg) => UI.toast(msg, 'info'),
  warning: (msg) => UI.toast(msg, 'warning'),
};

// ─── Modal System (delegates to UI) ───────────────────────────────────────────
const Modal = {
  show(title, content, actions = []) {
    UI.modal(title, content, actions);
  },
  close() {
    UI.closeModal();
  }
};

// ─── Pagination Helper (delegates to UI) ──────────────────────────────────────
function renderPagination(page, total, limit, onPage) {
  return UI.pagination(page, total, limit, onPage);
}

// ─── Format Helpers (delegates to UI) ─────────────────────────────────────────
function formatCurrency(amount) {
  return UI.formatCurrency(amount);
}
function formatDate(dt) {
  return UI.formatDate(dt);
}
function statusBadge(status) {
  return UI.statusBadge(status);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
window.addEventListener('popstate', () => Router.render(location.pathname));

document.addEventListener('DOMContentLoaded', () => {
  // Hide loading screen
  setTimeout(() => {
    const loading = document.getElementById('loading-screen');
    if (loading) loading.style.display = 'none';
  }, 800);

  const path = location.pathname;
  const route = ROUTES[path];

  if (!route || (route.auth && !Auth.isAuthenticated())) {
    Router.navigate('/admin/login', true);
  } else {
    Router.render(path);
  }
});

// Global error handler for unhandled API errors
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason?.message?.includes('401') || e.reason?.message?.includes('Unauthorized')) {
    Auth.clear();
    Router.navigate('/admin/login', true);
  }
});
