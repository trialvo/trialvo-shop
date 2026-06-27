// PayVault Merchant Portal — App Router
window.MerchantApp = {
    currentPage: null,

    async init() {
        window.addEventListener('hashchange', () => this.navigate(window.location.hash));

        if (!MerchantAPI.isAuthenticated()) {
            window.location.hash = '#/login';
        } else if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#') {
            window.location.hash = '#/dashboard';
        }
        this.navigate(window.location.hash);
    },

    async navigate(hash) {
        const app = document.getElementById('app');
        const path = hash.replace('#', '') || '/login';

        // Unauthenticated routes
        if (path === '/login') {
            if (MerchantAPI.isAuthenticated()) { window.location.hash = '#/dashboard'; return; }
            app.innerHTML = MerchantPages.login();
            MerchantPages.initLogin();
            if (window.lucide) lucide.createIcons();
            return;
        }

        // Auth guard
        if (!MerchantAPI.isAuthenticated()) {
            window.location.hash = '#/login';
            return;
        }

        // Render shell + page
        app.innerHTML = this.shell(path) + '<div class="main-content" id="page-content"><div class="loading"><div class="spinner"></div></div></div>';
        this.updateActiveLink(path);
        if (window.lucide) lucide.createIcons();

        try {
            let html;
            if (path === '/dashboard') html = await MerchantPages.dashboard();
            else if (path === '/settings') html = await MerchantPages.settings();
            else if (path === '/keys') html = await MerchantPages.keys();
            else if (path === '/webhooks') html = await MerchantPages.webhooks();
            else if (path === '/transactions') html = await MerchantPages.transactions();
            else if (path === '/refunds') html = await MerchantPages.refunds();
            else if (path === '/integration') html = await MerchantPages.integration();
            else if (path.startsWith('/webhooks/') && path.endsWith('/deliveries')) {
                const whId = path.split('/')[2];
                html = await MerchantPages.deliveries(whId);
            }
            else html = MUI.emptyState('search', 'Page not found', 'The page you are looking for does not exist.');

            document.getElementById('page-content').innerHTML = html;
            if (window.lucide) lucide.createIcons();
        } catch(e) {
            document.getElementById('page-content').innerHTML = `<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">Error loading page: ${e.message}</p></div>`;
        }
    },

    shell(activePath) {
        const merchant = MerchantAPI.merchant || {};
        const initials = (merchant.display_name || merchant.email || '?').charAt(0).toUpperCase();
        const name = merchant.display_name || merchant.email || 'Merchant';
        const email = merchant.email || '';
        const serviceMode = merchant.service_id ? '' : '';

        const navItem = (href, path, icon, label, badge = '') => `
            <a href="${href}" data-path="${path}" class="nav-link">
                <i data-lucide="${icon}" class="nav-icon"></i>
                <span class="nav-label">${label}</span>
                ${badge ? `<span class="nav-badge">${badge}</span>` : ''}
            </a>`;

        return `<div class="shell"><aside class="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo">
                    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                        <rect width="40" height="40" rx="10" fill="url(#mg)"/>
                        <path d="M12 20h16M20 12v16" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                        <defs><linearGradient id="mg" x1="0" y1="0" x2="40" y2="40">
                            <stop stop-color="#0d9488"/><stop offset="1" stop-color="#14b8a6"/>
                        </linearGradient></defs>
                    </svg>
                    <div>
                        <div class="logo-name">PayVault</div>
                        <div class="logo-sub">Merchant Portal</div>
                    </div>
                </div>
            </div>
            <nav class="sidebar-nav">
                <div class="nav-section-label">Overview</div>
                ${navItem('#/dashboard', '/dashboard', 'layout-dashboard', 'Dashboard')}
                <div class="nav-section-label">Integration</div>
                ${navItem('#/keys', '/keys', 'key-round', 'API Keys')}
                ${navItem('#/webhooks', '/webhooks', 'webhook', 'Webhooks')}
                ${navItem('#/settings', '/settings', 'settings', 'Settings')}
                ${navItem('#/integration', '/integration', 'code-2', 'Integration Guide')}
                <div class="nav-section-label">Activity</div>
                ${navItem('#/transactions', '/transactions', 'credit-card', 'Transactions')}
                ${navItem('#/refunds', '/refunds', 'rotate-ccw', 'Refunds')}
                <div class="nav-section-label">Resources</div>
                <a href="/docs" target="_blank" class="nav-link">
                    <i data-lucide="book-open" class="nav-icon"></i>
                    <span class="nav-label">API Documentation</span>
                    <i data-lucide="external-link" class="nav-external"></i>
                </a>
            </nav>
            <div class="sidebar-footer">
                <div class="user-card">
                    <div class="user-avatar">${initials}</div>
                    <div class="user-info-text">
                        <div class="user-name">${name}</div>
                        <div class="user-email">${email}</div>
                    </div>
                </div>
                <button class="btn-logout" onclick="MerchantApp.logout()">
                    <i data-lucide="log-out"></i>
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>`;
    },

    updateActiveLink(path) {
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(a => {
            const linkPath = a.dataset.path;
            if (linkPath && path.startsWith(linkPath)) a.classList.add('active');
            else a.classList.remove('active');
        });
    },

    async logout() {
        await MerchantAPI.logout();
        window.location.hash = '#/login';
    }
};

// Boot
document.addEventListener('DOMContentLoaded', () => MerchantApp.init());
