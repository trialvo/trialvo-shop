/**
 * Trialvo Pay Admin SPA - Page Implementations
 * All admin pages: login, 2fa, dashboard, services, transactions, bills,
 * refunds, customers, config, ipn, audit, admins, profile
 */

const Pages = {

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH PAGES
  // ═══════════════════════════════════════════════════════════════════════════

  async login(container) {
    const isExpired = new URLSearchParams(location.search).get('expired') === 'true';
    // Clean up URL after reading
    if (isExpired) history.replaceState({}, '', '/admin/login');

    container.innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <div class="auth-logo">
            <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="12" fill="url(#lg)"/>
              <path d="M12 20h16M20 12v16" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <defs><linearGradient id="lg" x1="0" y1="0" x2="40" y2="40">
                <stop stop-color="#0d9488"/><stop offset="1" stop-color="#14b8a6"/>
              </linearGradient></defs>
            </svg>
            <div>
              <div class="auth-title">Trialvo Pay</div>
              <div class="auth-subtitle">Admin Console</div>
            </div>
          </div>
          ${isExpired ? `
            <div class="session-expired-banner">
              <i data-lucide="alert-triangle"></i>
              <span>Your session has expired. Please sign in again.</span>
            </div>
          ` : ''}
          <h2 class="auth-heading">Sign In</h2>
          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label class="form-label">Email</label>
              <div class="input-icon-wrap">
                <i data-lucide="mail" class="input-icon"></i>
                <input class="form-input" id="login-email" type="email" placeholder="admin@pay.trialvo.com" required autofocus>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="input-icon-wrap">
                <i data-lucide="lock" class="input-icon"></i>
                <input class="form-input" id="login-password" type="password" placeholder="••••••••" required>
                <button type="button" class="toggle-password" onclick="this.previousElementSibling.type = this.previousElementSibling.type === 'password' ? 'text' : 'password'">
                  <i data-lucide="eye"></i>
                </button>
              </div>
            </div>
            <div id="login-error" class="form-error hidden"></div>
            <button type="submit" class="btn btn-primary btn-full" id="login-btn">
              <i data-lucide="log-in"></i> Sign In
            </button>
          </form>
        </div>
        <div class="auth-bg-orbs">
          <div class="orb orb-1"></div>
          <div class="orb orb-2"></div>
          <div class="orb orb-3"></div>
        </div>
      </div>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-btn');
      const errEl = document.getElementById('login-error');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-sm"></span> Signing in...';
      errEl.classList.add('hidden');

      try {
        const res = await API.login(
          document.getElementById('login-email').value,
          document.getElementById('login-password').value
        );

        if (res.requires_2fa) {
          // Store temp token for 2FA step
          sessionStorage.setItem('pv_2fa_token', res.temp_token);
          Router.navigate('/admin/2fa', true);
        } else if (res.session_token) {
          Auth.setToken(res.session_token, { id: res.admin_id, role: res.role });
          Router.navigate('/admin/dashboard', true);
        }
      } catch (err) {
        errEl.textContent = err.message || 'Invalid credentials';
        errEl.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="log-in"></i> Sign In';
        if (window.lucide) lucide.createIcons({ nodes: [btn] });
      }
    });
  },

  async '2fa'(container) {
    container.innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <div class="auth-logo">
            <div class="auth-icon-2fa"><i data-lucide="shield-check"></i></div>
          </div>
          <h2 class="auth-heading">Two-Factor Auth</h2>
          <p class="auth-desc">Enter the 6-digit code from your authenticator app.</p>
          <form id="twofa-form" class="auth-form">
            <div class="form-group">
              <input class="form-input totp-input" id="totp-code" type="text" maxlength="6" 
                pattern="[0-9]{6}" placeholder="000 000" required autofocus autocomplete="one-time-code">
            </div>
            <div id="twofa-error" class="form-error hidden"></div>
            <button type="submit" class="btn btn-primary btn-full" id="twofa-btn">
              <i data-lucide="shield-check"></i> Verify
            </button>
            <button type="button" class="btn btn-ghost btn-full" id="backup-toggle">
              Use backup code instead
            </button>
          </form>
        </div>
        <div class="auth-bg-orbs">
          <div class="orb orb-1"></div><div class="orb orb-2"></div>
        </div>
      </div>
    `;

    let useBackup = false;
    document.getElementById('backup-toggle').addEventListener('click', () => {
      useBackup = !useBackup;
      const inp = document.getElementById('totp-code');
      inp.maxLength = 12;
      inp.pattern = '.+';
      inp.placeholder = useBackup ? 'XXXX-XXXX' : '000 000';
      document.getElementById('backup-toggle').textContent = useBackup ? 'Use TOTP instead' : 'Use backup code instead';
    });

    document.getElementById('twofa-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('twofa-btn');
      const errEl = document.getElementById('twofa-error');
      btn.disabled = true;
      errEl.classList.add('hidden');

      const tempToken = sessionStorage.getItem('pv_2fa_token');
      const code = document.getElementById('totp-code').value.replace(/\s/g, '');

      try {
        const res = await API.verify2FA(tempToken, code, useBackup);
        sessionStorage.removeItem('pv_2fa_token');
        Auth.setToken(res.session_token, { id: res.admin_id, role: res.role });
        Router.navigate('/admin/dashboard', true);
      } catch (err) {
        errEl.textContent = err.message || 'Invalid code';
        errEl.classList.remove('hidden');
        btn.disabled = false;
      }
    });
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  async dashboard(container) {
    container.innerHTML = `
      ${Components.renderPageHeader('Dashboard', 'Revenue overview and recent activity',
        `<button class="auto-refresh-toggle" id="dash-auto-refresh" title="Auto-refresh every 30s">
          <i data-lucide="refresh-cw"></i> Auto
        </button>`)}
      <div id="dash-content">
        ${Components.renderSkeleton(1)}
      </div>
    `;

    let stats;
    try {
      stats = await API.getDashboardStats();
    } catch (e) {
      document.getElementById('dash-content').innerHTML = Components.renderError(e.message);
      return;
    }

    const { revenue, success_rate, active_services, pending_refunds, ipn_failures_24h, recent_transactions, daily_revenue } = stats;

    document.getElementById('dash-content').innerHTML = `
      <!-- Stat Cards -->
      <div class="stats-grid">
        ${Components.renderStatCard('Today\'s Revenue', formatCurrency(revenue.today), 'trending-up', 'primary')}
        ${Components.renderStatCard('This Week', formatCurrency(revenue.this_week), 'calendar', 'violet')}
        ${Components.renderStatCard('This Month', formatCurrency(revenue.this_month), 'bar-chart-2', 'blue')}
        ${Components.renderStatCard('All Time', formatCurrency(revenue.all_time), 'database', 'emerald')}
      </div>

      <!-- Secondary stats -->
      <div class="stats-grid-sm">
        ${Components.renderStatCard('Success Rate', `${parseFloat(success_rate || 0).toFixed(1)}%`, 'check-circle', 'emerald')}
        ${Components.renderStatCard('Active Services', active_services, 'layers', 'blue')}
        ${Components.renderStatCard('Pending Refunds', pending_refunds, 'rotate-ccw', pending_refunds > 0 ? 'warning' : 'emerald')}
        ${Components.renderStatCard('IPN Failures (24h)', ipn_failures_24h, 'alert-triangle', ipn_failures_24h > 0 ? 'danger' : 'emerald')}
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="quick-action-btn" onclick="Router.navigate('/admin/services')">
          <i data-lucide="plus-circle"></i> Create Service
        </button>
        <button class="quick-action-btn" onclick="Router.navigate('/admin/refunds')">
          <i data-lucide="rotate-ccw"></i> Pending Refunds ${pending_refunds > 0 ? `<span class="badge badge-warning">${pending_refunds}</span>` : ''}
        </button>
        <button class="quick-action-btn" onclick="Router.navigate('/admin/transactions')">
          <i data-lucide="receipt"></i> All Transactions
        </button>
        <button class="quick-action-btn" onclick="Router.navigate('/admin/ipn')">
          <i data-lucide="webhook"></i> IPN Endpoints
        </button>
      </div>

      <!-- Chart + Recent Transactions -->
      <div class="dashboard-grid">
        <!-- Revenue Chart -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i data-lucide="bar-chart-3"></i> Revenue (Last 30 Days)</h3>
          </div>
          <div class="chart-container">
            <canvas id="revenue-chart"></canvas>
          </div>
        </div>

        <!-- Recent Transactions -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i data-lucide="activity"></i> Recent Transactions</h3>
            <button class="btn btn-ghost sm" onclick="Router.navigate('/admin/transactions')">View all</button>
          </div>
          <div class="recent-tx-list">
            ${recent_transactions.length === 0 ? '<div class="empty-state sm"><p>No transactions yet</p></div>' :
              recent_transactions.map(tx => `
                <div class="recent-tx-item">
                  <div class="tx-service">${tx.service || '—'}</div>
                  <div class="tx-info">
                    <span class="tx-entity">${tx.financial_entity || 'Unknown'}</span>
                    ${statusBadge(tx.status)}
                  </div>
                  <div class="tx-amount ${tx.status === 'success' ? 'amount-success' : ''}">${formatCurrency(tx.amount)}</div>
                </div>
              `).join('')}
          </div>
        </div>
      </div>

      <!-- Recent IPN Activity -->
      <div class="card" style="margin-top:20px">
        <div class="card-header">
          <h3 class="card-title"><i data-lucide="webhook"></i> Recent IPN Deliveries</h3>
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost sm" id="refresh-dash-ipn" title="Refresh"><i data-lucide="refresh-cw"></i></button>
            <button class="btn btn-ghost sm" onclick="Router.navigate('/admin/ipn')">View all</button>
          </div>
        </div>
        <div id="dash-ipn-feed" style="max-height:320px;overflow-y:auto">
          <div style="padding:24px;text-align:center;color:#94a3b8;font-size:12px"><span class="spinner-sm"></span> Loading...</div>
        </div>
      </div>
    `;

    // Render Chart.js
    if (window.Chart && daily_revenue?.length) {
      const ctx = document.getElementById('revenue-chart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: daily_revenue.map(d => d.date),
          datasets: [{
            label: 'Revenue (BDT)',
            data: daily_revenue.map(d => parseFloat(d.total || 0)),
            backgroundColor: 'rgba(13, 148, 136, 0.35)',
            borderColor: '#0d9488',
            borderWidth: 2,
            borderRadius: 6,
            fill: true,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: { label: ctx => `৳ ${ctx.raw.toLocaleString()}` }
            }
          },
          scales: {
            x: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8' } },
            y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', callback: v => `৳${(v/1000).toFixed(0)}k` } }
          }
        }
      });
    }

    if (window.lucide) lucide.createIcons();

    // Auto-refresh toggle
    let autoRefreshInterval = null;
    document.getElementById('dash-auto-refresh')?.addEventListener('click', function() {
      this.classList.toggle('active');
      if (this.classList.contains('active')) {
        autoRefreshInterval = setInterval(() => Pages.dashboard(container), 30000);
      } else {
        clearInterval(autoRefreshInterval);
      }
    });

    // Load Recent IPN Activity on dashboard
    Pages._loadDashboardIpnActivity();
    document.getElementById('refresh-dash-ipn')?.addEventListener('click', () => Pages._loadDashboardIpnActivity());
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVICES
  // ═══════════════════════════════════════════════════════════════════════════

  _svcAvatarColors: ['primary', 'violet', 'blue', 'amber', 'rose'],
  _getSvcColor(name) {
    const hash = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return this._svcAvatarColors[hash % this._svcAvatarColors.length];
  },

  async services(container) {
    let page = 1, limit = 20;
    const load = async () => {
      const offset = (page - 1) * limit;
      const data = await API.getServices({ limit, offset });
      const items = data.data || data.services || data;
      renderList(items, data.total || items.length);
    };

    const renderList = (services, total) => {
      container.innerHTML = `
        ${Components.renderPageHeader('Services', `${total} connected services`,
          `<button class="btn btn-primary" id="add-service-btn"><i data-lucide="plus"></i> Add Service</button>`)}
        <div class="card">
          ${Components.renderTable(
            [
              { label: 'Service', key: 'name' },
              { label: 'Mode', key: 'mode_badge' },
              { label: 'Created', key: 'created' },
              { label: 'Active', key: 'toggle' },
              { label: '', key: 'actions' },
            ],
            services.map(s => {
              const color = Pages._getSvcColor(s.display_name);
              const initial = (s.display_name || 'S').charAt(0).toUpperCase();
              return {
                name: `<div class="svc-name-cell">
                  <div class="svc-avatar svc-avatar-${color}">${initial}</div>
                  <div class="svc-name-text">
                    <span class="name">${s.display_name}</span>
                    <span class="slug">${s.slug}</span>
                  </div>
                </div>`,
                mode_badge: s.is_sandbox
                  ? '<span class="badge badge-warning">Sandbox</span>'
                  : '<span class="badge badge-success">Live</span>',
                created: formatDate(s.created_at),
                toggle: `<label class="toggle-switch">
                  <input type="checkbox" ${s.is_active ? 'checked' : ''}
                    onchange="Pages._toggleService('${s.id}', this.checked)">
                  <span class="toggle-slider"></span>
                </label>`,
                actions: `<div class="action-btns" style="display:flex;gap:4px">
                  <button class="btn btn-ghost sm" onclick="Pages._viewService('${s.id}')" title="View details">
                    <i data-lucide="eye"></i>
                  </button>
                  <button class="btn btn-ghost sm danger" onclick="event.stopPropagation();Pages._confirmDeleteService('${s.id}', '${(s.display_name || '').replace(/'/g, "\\'")}', '${s.slug}')" title="Delete service">
                    <i data-lucide="trash-2"></i>
                  </button>
                </div>`,
              };
            }),
            'No services found. Add your first service!'
          )}
          ${renderPagination(page, total, limit, `(p) => { page=p; Pages.services(container); }`)}
        </div>
      `;
      document.getElementById('add-service-btn')?.addEventListener('click', () => Pages._addServiceModal());
      if (window.lucide) lucide.createIcons();
    };

    try {
      container.innerHTML = Components.renderSkeleton();
      await load();
    } catch (e) {
      container.innerHTML = Components.renderError(e.message);
    }
  },

  _addServiceModal() {
    Modal.show('Add New Service', `
      <form id="add-service-form">
        ${Components.renderInput('svc-slug', 'Slug (unique identifier)', 'text', 'my-service', '', true)}
        ${Components.renderInput('svc-name', 'Display Name', 'text', 'My Service', '', true)}
        ${Components.renderTextarea('svc-desc', 'Description', 'Brief description...')}
        ${Components.renderInput('svc-email', 'Contact Email', 'email', 'dev@example.com')}
        ${Components.renderInput('svc-success-url', 'Success Redirect URL', 'url', 'https://...')}
        ${Components.renderInput('svc-fail-url', 'Fail Redirect URL', 'url', 'https://...')}
        ${Components.renderSelect('svc-mode', 'Mode', [
          { value: 'false', label: 'Live' },
          { value: 'true', label: 'Sandbox' }
        ])}
        <hr class="divider">
        <div style="margin-bottom:12px">
          <h4 style="font-size:14px;font-weight:600;color:var(--color-text);margin-bottom:4px">🔐 Merchant Account (Optional)</h4>
          <p style="font-size:12px;color:var(--color-text-3);margin:0">Create a merchant portal login along with the service. Leave blank to skip.</p>
        </div>
        ${Components.renderInput('svc-merchant-email', 'Merchant Email', 'email', 'merchant@example.com')}
        <div class="form-group">
          <label class="ui-label">Merchant Password</label>
          <div style="display:flex;gap:8px">
            <input class="ui-input" type="text" id="svc-merchant-password" placeholder="Min 8 chars or auto-generate" style="flex:1">
            <button type="button" class="btn btn-secondary sm" onclick="Pages._autoGenPassword()" style="white-space:nowrap">🎲 Generate</button>
          </div>
          <small style="color:var(--color-text-3);display:block;margin-top:4px">If left empty, a secure password will be auto-generated.</small>
        </div>
        <div id="add-svc-error" class="form-error hidden"></div>
      </form>
    `, [
      `<button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>`,
      `<button class="btn btn-primary" onclick="Pages._submitAddService()"><i data-lucide="plus"></i> Create</button>`
    ]);
  },

  _autoGenPassword() {
    const charset = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    document.getElementById('svc-merchant-password').value = password;
  },

  async _submitAddService() {
    const errEl = document.getElementById('add-svc-error');
    errEl.classList.add('hidden');

    const merchantEmail = document.getElementById('svc-merchant-email')?.value?.trim();
    const merchantPassword = document.getElementById('svc-merchant-password')?.value;

    if (merchantPassword && merchantPassword.length > 0 && merchantPassword.length < 8) {
      errEl.textContent = 'Merchant password must be at least 8 characters (or leave empty to auto-generate).';
      errEl.classList.remove('hidden');
      return;
    }

    try {
      const payload = {
        slug: document.getElementById('svc-slug').value,
        display_name: document.getElementById('svc-name').value,
        description: document.getElementById('svc-desc').value,
        contact_email: document.getElementById('svc-email').value,
        success_url: document.getElementById('svc-success-url').value,
        fail_url: document.getElementById('svc-fail-url').value,
        is_sandbox: document.getElementById('svc-mode').value === 'true',
      };

      if (merchantEmail) {
        payload.merchant_email = merchantEmail;
        if (merchantPassword) payload.merchant_password = merchantPassword;
      }

      const result = await API.createService(payload);

      if (result.merchant && result.merchant.email) {
        Modal.show('✅ Service & Merchant Created', `
          <div style="background:var(--color-surface-2);border-radius:12px;padding:20px;margin-bottom:16px">
            <h4 style="margin:0 0 12px;font-size:14px;color:var(--color-text-3)">Service</h4>
            <div style="font-size:15px;font-weight:600;color:var(--color-text)">${result.service?.display_name || 'Created'}</div>
          </div>
          <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:12px;padding:20px;margin-bottom:16px">
            <h4 style="margin:0 0 4px;font-size:14px;color:#92400e">⚠️ Merchant Credentials (save now!)</h4>
            <p style="font-size:12px;color:#78350f;margin:0 0 12px">This password will never be shown again.</p>
            <div style="display:grid;gap:8px">
              <div><span style="color:#92400e;font-size:12px">Email:</span><br><code style="font-size:14px;color:#78350f;font-weight:600">${result.merchant.email}</code></div>
              <div><span style="color:#92400e;font-size:12px">Password:</span><br><code style="font-size:14px;color:#78350f;font-weight:600;user-select:all">${result.merchant.password}</code></div>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary sm" onclick="navigator.clipboard.writeText('Email: ${result.merchant.email}\nPassword: ${result.merchant.password}');Toast.success('Copied!')">📋 Copy Credentials</button>
          </div>
        `, [
          `<button class="btn btn-primary" onclick="Modal.close();Pages.services(document.getElementById('page-content'))">Done</button>`
        ]);
      } else {
        Modal.close();
        Toast.success('Service created successfully!');
        Pages.services(document.getElementById('page-content'));
      }
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('hidden');
    }
  },

  async _viewService(id) {
    try {
      const [s, keysRes] = await Promise.all([
        API.getService(id),
        API.getServiceKeys(id),
      ]);
      const keys = keysRes.data || keysRes || [];
      const primaryKey = keys.find(k => k.is_primary) || keys[0];
      const color = Pages._getSvcColor(s.display_name);
      const initial = (s.display_name || 'S').charAt(0).toUpperCase();

      // ── Helper ─────────────────────────────────────────────────────────
      const dRow = (label, value, copyable = false) => {
        const copyBtn = copyable && value && value !== '—'
          ? `<button class="tx-copy-btn" onclick="event.stopPropagation();UI.copyToClipboard('${String(value).replace(/'/g, "\\'").replace(/"/g, '&quot;')}')"><i data-lucide="copy"></i></button>`
          : '';
        return `<div class="svc-detail-row"><span class="svc-d-label">${label}</span><span class="svc-d-value">${value ?? '—'}${copyBtn}</span></div>`;
      };

      // Remove any existing panel
      document.getElementById('svc-detail-backdrop')?.remove();
      document.getElementById('svc-detail-panel')?.remove();

      // ── Build Panel HTML ─────────────────────────────────────────────
      const panelHTML = `
        <div class="svc-panel-backdrop" id="svc-detail-backdrop"></div>
        <div class="svc-panel" id="svc-detail-panel">
          <!-- Header -->
          <div class="svc-panel-header">
            <div class="svc-panel-header-left">
              <div class="svc-detail-avatar svc-avatar-${color}" style="width:36px;height:36px;font-size:0.875rem;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700">${initial}</div>
              <div>
                <h3>${s.display_name}</h3>
                <div style="display:flex;gap:6px;align-items:center;margin-top:2px">
                  <code class="code-tag sm">${s.slug}</code>
                  ${statusBadge(s.is_active ? 'active' : 'inactive')}
                  ${s.is_sandbox ? '<span class="badge badge-warning">Sandbox</span>' : '<span class="badge badge-success">Live</span>'}
                </div>
              </div>
            </div>
            <div class="svc-panel-header-actions">
              <button class="tx-action-btn" id="svc-panel-edit" title="Edit Settings">
                <i data-lucide="edit-2"></i>
              </button>
              <button class="tx-action-btn danger" id="svc-panel-delete" title="Delete service">
                <i data-lucide="trash-2"></i>
              </button>
              <button class="tx-action-btn" id="svc-panel-close" title="Close">
                <i data-lucide="x"></i>
              </button>
            </div>
          </div>

          <!-- Tabs -->
          <div class="svc-tabs">
            <button class="svc-tab active" data-tab="svc-overview">Overview</button>
            <button class="svc-tab" data-tab="svc-keys">API & Keys</button>
            <button class="svc-tab" data-tab="svc-commission">Commission</button>
            <button class="svc-tab" data-tab="svc-danger">Danger Zone</button>
            <button class="svc-tab" data-tab="svc-settings">Edit Settings</button>
          </div>

          <!-- Tab Content -->
          <div class="svc-panel-body">
            <!-- Overview Tab -->
            <div class="svc-tab-content active" id="stab-svc-overview">
              <div class="svc-panel-section">
                <div class="svc-panel-section-title"><i data-lucide="info"></i> Service Info</div>
                <div class="svc-detail-grid">
                  ${dRow('Service ID', `<code>${s.id}</code>`, true)}
                  ${dRow('Display Name', s.display_name)}
                  ${dRow('Slug', `<code>${s.slug}</code>`, true)}
                  ${dRow('Description', s.description || '—')}
                  ${dRow('Contact Email', s.contact_email || '—')}
                  ${dRow('Contact Phone', s.contact_phone || '—')}
                  ${dRow('Logo URL', s.logo_url ? `<img src="${s.logo_url}" alt="" style="height:20px;border-radius:4px"> <a href="${s.logo_url}" target="_blank" style="font-size:0.75rem">View</a>` : '—')}
                  ${dRow('Created', formatDate(s.created_at))}
                  ${dRow('Updated', formatDate(s.updated_at))}
                </div>
              </div>

              <div class="svc-panel-section">
                <div class="svc-panel-section-title">
                  <i data-lucide="link"></i> Redirect URLs
                  <button class="tx-action-btn" id="svc-url-edit-toggle" title="Edit URLs" style="margin-left:auto">
                    <i data-lucide="edit-2"></i>
                  </button>
                </div>

                <!-- Display Mode -->
                <div id="svc-url-display">
                  <div class="svc-url-card">
                    <div class="svc-url-card-icon success"><i data-lucide="check-circle"></i></div>
                    <div class="svc-url-card-body">
                      <div class="svc-url-card-label">Success URL</div>
                      <div class="svc-url-card-value ${!s.success_url ? 'empty' : ''}">${s.success_url || 'Not configured'}</div>
                    </div>
                  </div>
                  <div class="svc-url-card">
                    <div class="svc-url-card-icon danger"><i data-lucide="x-circle"></i></div>
                    <div class="svc-url-card-body">
                      <div class="svc-url-card-label">Fail URL</div>
                      <div class="svc-url-card-value ${!s.fail_url ? 'empty' : ''}">${s.fail_url || 'Not configured'}</div>
                    </div>
                  </div>
                  <div class="svc-url-card">
                    <div class="svc-url-card-icon warning"><i data-lucide="ban"></i></div>
                    <div class="svc-url-card-body">
                      <div class="svc-url-card-label">Cancel URL</div>
                      <div class="svc-url-card-value ${!s.cancel_url ? 'empty' : ''}">${s.cancel_url || 'Not configured'}</div>
                    </div>
                  </div>
                </div>

                <!-- Edit Mode (hidden by default) -->
                <div id="svc-url-edit" class="hidden">
                  <div class="svc-url-edit-row">
                    <label>Success</label>
                    <input id="svc-edit-success-url" type="url" placeholder="https://yourapp.com/success" value="${s.success_url || ''}">
                  </div>
                  <div class="svc-url-edit-row">
                    <label>Fail</label>
                    <input id="svc-edit-fail-url" type="url" placeholder="https://yourapp.com/fail" value="${s.fail_url || ''}">
                  </div>
                  <div class="svc-url-edit-row">
                    <label>Cancel</label>
                    <input id="svc-edit-cancel-url" type="url" placeholder="https://yourapp.com/cancel" value="${s.cancel_url || ''}">
                  </div>
                  <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:var(--space-sm)">
                    <button class="btn btn-ghost sm" id="svc-url-cancel">Cancel</button>
                    <button class="btn btn-primary sm" id="svc-url-save"><i data-lucide="save"></i> Save URLs</button>
                  </div>
                </div>
              </div>

              <div class="svc-panel-section">
                <div class="svc-panel-section-title"><i data-lucide="settings"></i> Configuration</div>
                <div class="svc-detail-grid">
                  ${dRow('Sandbox Mode', `<label class="toggle-switch" style="pointer-events:none"><input type="checkbox" ${s.is_sandbox ? 'checked' : ''} disabled><span class="toggle-slider"></span></label>`)}
                  ${dRow('Skip Preview', `<label class="toggle-switch" style="pointer-events:none"><input type="checkbox" ${s.meta?.skip_preview ? 'checked' : ''} disabled><span class="toggle-slider"></span></label>`)}
                  ${dRow('Active', `<label class="toggle-switch"><input type="checkbox" ${s.is_active ? 'checked' : ''} onchange="Pages._toggleService('${s.id}', this.checked)"><span class="toggle-slider"></span></label>`)}
                </div>
              </div>
            </div>

            <!-- API & Keys Tab -->
            <div class="svc-tab-content" id="stab-svc-keys">
              <div class="svc-panel-section">
                <div class="svc-panel-section-title">
                  <i data-lucide="key-round"></i> API Key
                  ${primaryKey ? `<button class="tx-action-btn" onclick="Pages._generateServiceKey('${s.id}')" title="Regenerate" style="margin-left:auto">
                    <i data-lucide="refresh-cw"></i>
                  </button>` : ''}
                </div>
                ${!primaryKey
                  ? `<div style="text-align:center;padding:var(--space-lg);background:var(--color-surface-2);border-radius:var(--radius-sm);border:1px solid var(--color-border)">
                      <p style="color:var(--color-text-3);margin-bottom:12px;font-size:0.8125rem">No API key configured.</p>
                      <button class="btn btn-primary sm" onclick="Pages._generateServiceKey('${s.id}')">
                        <i data-lucide="plus"></i> Generate API Key
                      </button>
                    </div>`
                  : `<div class="svc-key-card">
                      <div class="svc-key-header">
                        <div style="display:flex;align-items:center;gap:8px">
                          <code class="code-tag">${primaryKey.key_prefix}••••••••</code>
                          ${primaryKey.is_primary ? '<span class="badge badge-success">Primary</span>' : ''}
                        </div>
                        <div style="display:flex;gap:4px">
                          <button class="tx-action-btn" onclick="Pages._revealServiceKey('${s.id}', '${primaryKey.id}')" title="Reveal">
                            <i data-lucide="eye"></i>
                          </button>
                          <button class="tx-action-btn danger" onclick="Pages._revokeServiceKey('${s.id}', '${primaryKey.id}')" title="Revoke">
                            <i data-lucide="trash-2"></i>
                          </button>
                        </div>
                      </div>
                      <div class="svc-key-meta">
                        <span>Created ${formatDate(primaryKey.created_at)}</span>
                        <span>Last used: ${primaryKey.last_used_at ? formatDate(primaryKey.last_used_at) : 'Never'}</span>
                      </div>
                      <div id="key-reveal-area" class="hidden"></div>
                    </div>`}
                <div id="new-key-reveal" class="hidden"></div>
              </div>
            </div>

            <!-- Commission Tab -->
            <div class="svc-tab-content" id="stab-svc-commission">
              <div class="svc-panel-section">
                <div class="svc-panel-section-title"><i data-lucide="percent"></i> Commission</div>
                <div class="svc-commission-display">
                  <div class="svc-commission-value">${parseFloat(s.commission_rate || 0).toFixed(2)}${(s.commission_type || 'percentage') === 'percentage' ? '%' : ' BDT'}</div>
                  <div class="svc-commission-type">${s.commission_type || 'percentage'}</div>
                </div>
              </div>
              <div class="svc-panel-section">
                <div class="svc-panel-section-title"><i data-lucide="edit-2"></i> Update Commission</div>
                <div class="svc-url-edit-row">
                  <label>Rate</label>
                  <input id="svc-commission-rate" type="number" min="0" max="100" step="0.01" value="${parseFloat(s.commission_rate || 0).toFixed(2)}" placeholder="0.00">
                </div>
                <div class="svc-url-edit-row">
                  <label>Type</label>
                  <select id="svc-commission-type" style="flex:1;padding:8px 12px;border:1px solid var(--color-border);border-radius:6px;font-size:0.8125rem;background:var(--color-surface);color:var(--color-text)">
                    <option value="percentage" ${(s.commission_type || 'percentage') === 'percentage' ? 'selected' : ''}>Percentage (%)</option>
                    <option value="flat" ${s.commission_type === 'flat' ? 'selected' : ''}>Flat (BDT)</option>
                  </select>
                </div>
                <div style="display:flex;justify-content:flex-end;margin-top:var(--space-md)">
                  <button class="btn btn-primary sm" id="svc-save-commission"><i data-lucide="save"></i> Save Commission</button>
                </div>
              </div>
            </div>

            <!-- Danger Zone Tab -->
            <div class="svc-tab-content" id="stab-svc-danger">
              <div class="svc-panel-section">
                <div class="svc-panel-section-title" style="color:var(--color-danger)"><i data-lucide="alert-triangle"></i> Danger Zone</div>
                <div style="background:var(--color-danger-bg);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm);padding:var(--space-lg)">
                  <h4 style="font-size:0.875rem;font-weight:600;color:var(--color-danger);margin:0 0 4px">Delete Service</h4>
                  <p style="font-size:0.8125rem;color:var(--color-text-3);margin:0 0 var(--space-md);line-height:1.5">
                    Permanently delete <strong>${s.display_name}</strong> and all associated data including bills, transactions, API keys, and webhook endpoints. This action is <strong>irreversible</strong>.
                  </p>
                  <button class="tx-delete-btn confirm enabled" id="svc-danger-delete" style="opacity:1;pointer-events:auto">
                    <i data-lucide="trash-2"></i> Delete This Service
                  </button>
                </div>
              </div>
            </div>

            <!-- Edit Settings Tab -->
            <div class="svc-tab-content" id="stab-svc-settings">
              <div class="svc-panel-section">
                <div class="svc-panel-section-title"><i data-lucide="settings"></i> Service Settings</div>
                <form id="svc-settings-form">
                  <div class="svc-url-edit-row"><label>Display Name</label><input id="es-display-name" type="text" value="${s.display_name || ''}"></div>
                  <div class="svc-url-edit-row"><label>Description</label><input id="es-description" type="text" value="${s.description || ''}"></div>
                  <div class="svc-url-edit-row"><label>Email</label><input id="es-contact-email" type="email" value="${s.contact_email || ''}" placeholder="dev@example.com"></div>
                  <div class="svc-url-edit-row"><label>Phone</label><input id="es-contact-phone" type="tel" value="${s.contact_phone || ''}" placeholder="+880..."></div>
                  <div class="svc-url-edit-row"><label>Logo URL</label><input id="es-logo-url" type="url" value="${s.logo_url || ''}" placeholder="https://..."></div>
                </form>
              </div>
              <div class="svc-panel-section">
                <div class="svc-panel-section-title"><i data-lucide="link"></i> Redirect URLs</div>
                <div class="svc-url-edit-row"><label>Success</label><input id="es-success-url" type="url" value="${s.success_url || ''}" placeholder="https://yourapp.com/success"></div>
                <div class="svc-url-edit-row"><label>Fail</label><input id="es-fail-url" type="url" value="${s.fail_url || ''}" placeholder="https://yourapp.com/fail"></div>
                <div class="svc-url-edit-row"><label>Cancel</label><input id="es-cancel-url" type="url" value="${s.cancel_url || ''}" placeholder="https://yourapp.com/cancel"></div>
              </div>
              <div class="svc-panel-section">
                <div class="svc-panel-section-title"><i data-lucide="toggle-left"></i> Toggles</div>
                <div style="display:flex;flex-direction:column;gap:16px">
                  <div style="display:flex;align-items:center;justify-content:space-between">
                    <div>
                      <div style="font-weight:500;font-size:0.875rem;color:var(--color-text)">Sandbox Mode</div>
                      <div style="font-size:0.75rem;color:var(--color-text-3)">Use test environment</div>
                    </div>
                    <label class="toggle-switch"><input type="checkbox" id="es-sandbox" ${s.is_sandbox ? 'checked' : ''}><span class="toggle-slider"></span></label>
                  </div>
                  <div style="display:flex;align-items:center;justify-content:space-between">
                    <div>
                      <div style="font-weight:500;font-size:0.875rem;color:var(--color-text)">Skip Payment Preview</div>
                      <div style="font-size:0.75rem;color:var(--color-text-3)">Redirect directly to gateway</div>
                    </div>
                    <label class="toggle-switch"><input type="checkbox" id="es-skip-preview" ${s.meta?.skip_preview ? 'checked' : ''}><span class="toggle-slider"></span></label>
                  </div>
                </div>
              </div>
              <div class="svc-panel-section">
                <div id="es-error" class="form-error hidden" style="margin-bottom:var(--space-md)"></div>
                <div style="display:flex;gap:8px;justify-content:flex-end">
                  <button class="btn btn-primary" id="svc-save-settings"><i data-lucide="save"></i> Save All Settings</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // ── Mount Panel ────────────────────────────────────────────────────
      document.body.insertAdjacentHTML('beforeend', panelHTML);
      if (window.lucide) lucide.createIcons();

      const backdrop = document.getElementById('svc-detail-backdrop');
      const panel = document.getElementById('svc-detail-panel');

      requestAnimationFrame(() => {
        backdrop.classList.add('visible');
        panel.classList.add('open');
      });

      // ── Close ──────────────────────────────────────────────────────────
      const closePanel = () => {
        panel.classList.remove('open');
        backdrop.classList.remove('visible');
        setTimeout(() => { backdrop.remove(); panel.remove(); }, 300);
      };

      document.getElementById('svc-panel-close')?.addEventListener('click', closePanel);
      backdrop.addEventListener('click', closePanel);
      document.addEventListener('keydown', function _esc(e) {
        if (e.key === 'Escape') { closePanel(); document.removeEventListener('keydown', _esc); }
      });

      // ── Tab switching ──────────────────────────────────────────────────
      panel.querySelectorAll('.svc-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          panel.querySelectorAll('.svc-tab').forEach(t => t.classList.remove('active'));
          panel.querySelectorAll('.svc-tab-content').forEach(c => c.classList.remove('active'));
          tab.classList.add('active');
          document.getElementById(`stab-${tab.dataset.tab}`)?.classList.add('active');
          if (window.lucide) lucide.createIcons();
        });
      });

      // ── Edit settings → switch to settings tab ─────────────────────────
      document.getElementById('svc-panel-edit')?.addEventListener('click', () => {
        const settingsTab = panel.querySelector('.svc-tab[data-tab="svc-settings"]');
        if (settingsTab) settingsTab.click();
      });

      // ── Save settings from settings tab ────────────────────────────────
      document.getElementById('svc-save-settings')?.addEventListener('click', async () => {
        const errEl = document.getElementById('es-error');
        errEl?.classList.add('hidden');
        const payload = {};
        const fields = [
          ['es-display-name', 'display_name'],
          ['es-description', 'description'],
          ['es-contact-email', 'contact_email'],
          ['es-contact-phone', 'contact_phone'],
          ['es-logo-url', 'logo_url'],
          ['es-success-url', 'success_url'],
          ['es-fail-url', 'fail_url'],
          ['es-cancel-url', 'cancel_url'],
        ];
        for (const [elId, key] of fields) {
          const val = document.getElementById(elId)?.value?.trim();
          if (val !== undefined && val !== '') payload[key] = val;
          else payload[key] = null;
        }
        payload.is_sandbox = document.getElementById('es-sandbox')?.checked ?? false;
        payload.skip_preview = document.getElementById('es-skip-preview')?.checked ?? false;
        try {
          await API.updateService(id, payload);
          Toast.success('Service settings updated!');
          closePanel();
          setTimeout(() => Pages._viewService(id), 350);
        } catch (e) {
          if (errEl) { errEl.textContent = e.message; errEl.classList.remove('hidden'); }
          else Toast.error(e.message);
        }
      });

      // ── Delete from panel or danger zone ───────────────────────────────
      const triggerDelete = () => {
        closePanel();
        setTimeout(() => Pages._confirmDeleteService(s.id, s.display_name, s.slug), 350);
      };
      document.getElementById('svc-panel-delete')?.addEventListener('click', triggerDelete);
      document.getElementById('svc-danger-delete')?.addEventListener('click', triggerDelete);

      // ── URL edit toggle ────────────────────────────────────────────────
      document.getElementById('svc-url-edit-toggle')?.addEventListener('click', () => {
        document.getElementById('svc-url-display')?.classList.add('hidden');
        document.getElementById('svc-url-edit')?.classList.remove('hidden');
      });
      document.getElementById('svc-url-cancel')?.addEventListener('click', () => {
        document.getElementById('svc-url-edit')?.classList.add('hidden');
        document.getElementById('svc-url-display')?.classList.remove('hidden');
      });
      document.getElementById('svc-url-save')?.addEventListener('click', async () => {
        const payload = {
          success_url: document.getElementById('svc-edit-success-url')?.value?.trim() || null,
          fail_url: document.getElementById('svc-edit-fail-url')?.value?.trim() || null,
          cancel_url: document.getElementById('svc-edit-cancel-url')?.value?.trim() || null,
        };
        try {
          await API.updateService(id, payload);
          Toast.success('Redirect URLs updated!');
          closePanel();
          setTimeout(() => Pages._viewService(id), 350);
        } catch (e) {
          Toast.error(e.message);
        }
      });

      // ── Save commission ────────────────────────────────────────────────
      document.getElementById('svc-save-commission')?.addEventListener('click', async () => {
        const rate = document.getElementById('svc-commission-rate')?.value;
        const type = document.getElementById('svc-commission-type')?.value;
        if (!rate) return Toast.error('Enter a commission rate');
        try {
          await API.updateServiceCommission(id, parseFloat(rate), type);
          Toast.success('Commission updated!');
          closePanel();
          setTimeout(() => Pages._viewService(id), 350);
        } catch (e) {
          Toast.error(e.message);
        }
      });

    } catch (e) {
      Toast.error(e.message);
    }
  },

  async _saveCommission(serviceId) {
    const rate = document.getElementById('commission-rate-input')?.value;
    const type = document.getElementById('commission-type-input')?.value;
    if (rate === '' || rate === undefined) return Toast.error('Enter a commission rate');
    try {
      await API.updateServiceCommission(serviceId, parseFloat(rate), type);
      Toast.success('Commission updated!');
      Pages._viewService(serviceId); // Refresh modal
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async _editServiceSettingsModal(serviceId) {
    try {
      const s = await API.getService(serviceId);
      Modal.show(`Edit Settings — ${s.display_name}`, `
        <form id="edit-svc-form">
          ${Components.renderInput('es-display-name', 'Display Name', 'text', '', s.display_name || '')}
          ${Components.renderInput('es-description', 'Description', 'text', '', s.description || '')}
          ${Components.renderInput('es-contact-email', 'Contact Email', 'email', '', s.contact_email || '')}
          ${Components.renderInput('es-contact-phone', 'Contact Phone', 'tel', '', s.contact_phone || '')}
          ${Components.renderInput('es-logo-url', 'Logo URL', 'url', 'https://...', s.logo_url || '')}
          <hr class="divider">
          ${Components.renderInput('es-success-url', 'Success URL', 'url', 'https://yourapp.com/success', s.success_url || '')}
          ${Components.renderInput('es-fail-url', 'Fail URL', 'url', 'https://yourapp.com/fail', s.fail_url || '')}
          ${Components.renderInput('es-cancel-url', 'Cancel URL', 'url', 'https://yourapp.com/cancel', s.cancel_url || '')}
          <hr class="divider">
          <div style="display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div>
                <div style="font-weight:500;font-size:0.875rem;color:var(--color-text)">Sandbox Mode</div>
                <div style="font-size:0.75rem;color:var(--color-text-3)">Use test environment</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="es-sandbox" ${s.is_sandbox ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div>
                <div style="font-weight:500;font-size:0.875rem;color:var(--color-text)">Skip Payment Preview</div>
                <div style="font-size:0.75rem;color:var(--color-text-3)">Redirect directly to payment gateway</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="es-skip-preview" ${s.meta?.skip_preview ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          <div id="es-error" class="form-error hidden"></div>
        </form>
      `, [
        `<button class="btn btn-ghost" onclick="Pages._viewService('${serviceId}')">← Back</button>`,
        `<button class="btn btn-primary" onclick="Pages._submitServiceSettings('${serviceId}')"><i data-lucide="save"></i> Save Settings</button>`
      ]);
      if (window.lucide) lucide.createIcons();
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async _submitServiceSettings(serviceId) {
    const errEl = document.getElementById('es-error');
    errEl.classList.add('hidden');
    const payload = {};
    const fields = [
      ['es-display-name', 'display_name'],
      ['es-description', 'description'],
      ['es-contact-email', 'contact_email'],
      ['es-contact-phone', 'contact_phone'],
      ['es-logo-url', 'logo_url'],
      ['es-success-url', 'success_url'],
      ['es-fail-url', 'fail_url'],
      ['es-cancel-url', 'cancel_url'],
    ];
    for (const [elId, key] of fields) {
      const val = document.getElementById(elId)?.value?.trim();
      if (val !== undefined && val !== '') payload[key] = val;
    }
    payload.is_sandbox = document.getElementById('es-sandbox')?.checked ?? false;
    payload.skip_preview = document.getElementById('es-skip-preview')?.checked ?? false;

    if (!Object.keys(payload).length) {
      errEl.textContent = 'No changes made';
      errEl.classList.remove('hidden');
      return;
    }

    try {
      await API.updateService(serviceId, payload);
      Toast.success('Service settings updated!');
      Pages._viewService(serviceId);
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('hidden');
    }
  },

  async _revealServiceKey(serviceId, keyId) {
    try {
      const res = await API.revealServiceKey(serviceId, keyId);
      const area = document.getElementById('key-reveal-area');
      if (area) {
        area.classList.remove('hidden');
        area.innerHTML = `
          <div class="key-reveal mt-8">
            <div class="key-display">
              <code>${res.raw_key}</code>
              <button class="btn btn-ghost sm" onclick="navigator.clipboard.writeText('${res.raw_key}').then(()=>Toast.success('Copied to clipboard!'))">
                <i data-lucide="copy"></i> Copy
              </button>
            </div>
          </div>
        `;
        if (window.lucide) lucide.createIcons({ nodes: [area] });
      }
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async _generateServiceKey(serviceId) {
    UI.confirm('Generate New API Key', 'The current key will be replaced. Existing integrations using the old key will break.', async () => {
      try {
        const res = await API.generateServiceKey(serviceId);
        const reveal = document.getElementById('new-key-reveal');
        if (reveal) {
          reveal.classList.remove('hidden');
          reveal.innerHTML = `
            <div class="commission-panel" style="margin-top:16px;border-color:#f59e0b">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;color:#d97706">
                <i data-lucide="alert-triangle"></i>
                <span style="font-weight:600;font-size:0.875rem">Copy this key now — it will never be shown again.</span>
              </div>
              <div class="key-display">
                <code id="new-key-value">${res.raw_key}</code>
                <button class="btn btn-ghost sm" onclick="navigator.clipboard.writeText('${res.raw_key}').then(()=>Toast.success('Copied!'))">
                  <i data-lucide="copy"></i> Copy
                </button>
              </div>
            </div>
          `;
          if (window.lucide) lucide.createIcons({ nodes: [reveal] });
        } else {
          // If not in view modal context, show in a new modal
          Modal.show('New API Key', `
            <div class="commission-panel" style="border-color:#f59e0b">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;color:#d97706">
                <i data-lucide="alert-triangle"></i>
                <span style="font-weight:600;font-size:0.875rem">Copy this key now — it will never be shown again.</span>
              </div>
              <div class="key-display">
                <code>${res.raw_key}</code>
                <button class="btn btn-ghost sm" onclick="navigator.clipboard.writeText('${res.raw_key}').then(()=>Toast.success('Copied!'))">
                  <i data-lucide="copy"></i> Copy
                </button>
              </div>
            </div>
          `);
        }
        Toast.success('New API key generated!');
      } catch (e) {
        Toast.error(e.message);
      }
    }, 'danger');
  },

  async _revokeServiceKey(serviceId, keyId) {
    UI.confirm('Revoke API Key', 'This action cannot be undone. Any integration using this key will stop working immediately.', async () => {
      try {
        await API.revokeServiceKey(serviceId, keyId, 'Admin revoked from panel');
        Toast.success('Key revoked');
        Pages._viewService(serviceId);
      } catch (e) {
        Toast.error(e.message);
      }
    }, 'danger');
  },

  async _rotateKey(serviceId) {
    UI.confirm('Rotate API Key', 'The old key will have a 24-hour grace period before it stops working.', async () => {
      try {
        const res = await API.rotateServiceKey(serviceId);
        Toast.success('Key rotated! Store your new key safely.');
        Modal.show('New API Key', `
          <div class="commission-panel" style="border-color:#f59e0b">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;color:#d97706">
              <i data-lucide="alert-triangle"></i>
              <span style="font-weight:600;font-size:0.875rem">Copy this key now — it will not be shown again.</span>
            </div>
            <div class="key-display">
              <code>${res.api_key}</code>
              <button class="btn btn-ghost sm" onclick="navigator.clipboard.writeText('${res.api_key}').then(()=>Toast.success('Copied!'))">
                <i data-lucide="copy"></i>
              </button>
            </div>
          </div>
        `);
      } catch (e) {
        Toast.error(e.message);
      }
    }, 'danger');
  },

  async _toggleService(id, isActive) {
    try {
      await API.toggleService(id, isActive);
      Toast.success(`Service ${isActive ? 'activated' : 'deactivated'}`);
    } catch (e) {
      Toast.error(e.message);
      // Revert toggle
      Pages.services(document.getElementById('page-content'));
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVICE DELETE CONFIRMATION
  // ═══════════════════════════════════════════════════════════════════════════

  _confirmDeleteService(id, displayName, slug) {
    Modal.show('Delete Service', `
      <div class="tx-delete-modal">
        <div class="tx-delete-icon"><i data-lucide="alert-triangle"></i></div>
        <div class="tx-delete-title">Permanently Delete Service?</div>
        <div class="tx-delete-desc">
          This action is <strong>irreversible</strong>. The service and <strong>all associated data</strong> will be permanently removed.
        </div>
        <div class="svc-delete-warning">
          <i data-lucide="alert-triangle"></i>
          <strong>The following will be deleted:</strong><br>
          • All bills created for this service<br>
          • All transactions and payment records<br>
          • All API keys and webhook endpoints<br>
          • All refund records
        </div>
        <div class="tx-delete-details">
          <div class="tx-delete-detail-row">
            <span>Service</span>
            <span>${displayName}</span>
          </div>
          <div class="tx-delete-detail-row">
            <span>Slug</span>
            <span><code style="font-family:monospace;font-size:0.8em;background:var(--color-surface-3);padding:2px 6px;border-radius:4px">${slug}</code></span>
          </div>
        </div>
        <div class="tx-delete-confirm-wrap">
          <div class="tx-delete-confirm-label">Type <strong>DELETE</strong> to confirm</div>
          <input class="tx-delete-confirm-input" id="svc-delete-confirm-input" type="text" placeholder="DELETE" autocomplete="off" spellcheck="false">
        </div>
        <div class="tx-delete-actions">
          <button class="tx-delete-btn cancel" onclick="Modal.close()">Cancel</button>
          <button class="tx-delete-btn confirm" id="svc-delete-confirm-btn" disabled>
            <i data-lucide="trash-2"></i> Delete Service
          </button>
        </div>
      </div>
    `);

    if (window.lucide) lucide.createIcons();

    const input = document.getElementById('svc-delete-confirm-input');
    const btn = document.getElementById('svc-delete-confirm-btn');

    input?.addEventListener('input', () => {
      const matched = input.value.trim() === 'DELETE';
      input.classList.toggle('matched', matched);
      btn.classList.toggle('enabled', matched);
      btn.disabled = !matched;
    });

    input?.focus();

    btn?.addEventListener('click', async () => {
      if (input.value.trim() !== 'DELETE') return;
      btn.classList.add('loading');
      btn.innerHTML = '<i data-lucide="loader" style="animation:spin 1s linear infinite"></i> Deleting…';
      if (window.lucide) lucide.createIcons();

      try {
        await API.deleteService(id);
        Modal.close();
        Toast.success('Service deleted successfully');
        const content = document.getElementById('page-content');
        if (content) Pages.services(content);
      } catch (e) {
        btn.classList.remove('loading');
        btn.innerHTML = '<i data-lucide="trash-2"></i> Delete Service';
        if (window.lucide) lucide.createIcons();
        Toast.error(e.message || 'Failed to delete service');
      }
    });
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  async transactions(container) {
    let page = 1, limit = 25, statusFilter = '', serviceFilter = '', searchQ = '', dateFrom = '', dateTo = '';
    let selectedIds = new Set();
    let currentTxs = [];

    // ── Helpers ──────────────────────────────────────────────────────────
    const _txDetailRow = (label, value, copyable = false) => {
      const copyBtn = copyable && value && value !== '—'
        ? `<button class="tx-copy-btn" onclick="event.stopPropagation();UI.copyToClipboard('${String(value).replace(/'/g, "\\'")}')"><i data-lucide="copy"></i></button>`
        : '';
      return `<div class="tx-detail-row"><span class="tx-detail-label">${label}</span><span class="tx-detail-value">${value ?? '—'}${copyBtn}</span></div>`;
    };

    const _syntaxHighlightJSON = (obj) => {
      if (!obj) return '<span class="json-null">null</span>';
      const json = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
      return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'json-key' : 'json-string';
        } else if (/true|false/.test(match)) {
          cls = 'json-bool';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      });
    };

    // ── Compute stats from current page data ─────────────────────────────
    const _computeStats = (txs, total) => {
      const totalAmount = txs.reduce((s, tx) => s + parseFloat(tx.amount || 0), 0);
      const successCount = txs.filter(t => t.status === 'success').length;
      const processingCount = txs.filter(t => t.status === 'processing').length;
      const failedCount = txs.filter(t => t.status === 'failed').length;
      const rate = txs.length > 0 ? Math.round((successCount / txs.length) * 100) : 0;
      return { totalAmount, successCount, processingCount, failedCount, rate, total };
    };

    // ── Load data ────────────────────────────────────────────────────────
    const load = async () => {
      const params = { limit, offset: (page - 1) * limit, status: statusFilter, service_id: serviceFilter };
      if (searchQ) params.search = searchQ;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const data = await API.getTransactions(params);
      const items = data.data || data.transactions || data;
      renderList(items, data.total || items.length || 0);
    };

    // ── Render ────────────────────────────────────────────────────────────
    const renderList = (txs, total) => {
      currentTxs = txs;
      const stats = _computeStats(txs, total);
      const allChecked = txs.length > 0 && txs.every(t => selectedIds.has(t.id));

      container.innerHTML = `
        ${Components.renderPageHeader('Transactions', `${total.toLocaleString()} total transactions`,
          `<button class="btn-export" id="export-tx-csv">
            <i data-lucide="download"></i> Export CSV
          </button>`)}

        <!-- Stats Summary Bar -->
        <div class="tx-stats-bar">
          <div class="tx-stat-mini">
            <div class="tx-stat-mini-icon brand"><i data-lucide="banknote"></i></div>
            <div class="tx-stat-mini-body">
              <div class="tx-stat-mini-value">${formatCurrency(stats.totalAmount)}</div>
              <div class="tx-stat-mini-label">Page Total</div>
            </div>
          </div>
          <div class="tx-stat-mini">
            <div class="tx-stat-mini-icon success"><i data-lucide="check-circle-2"></i></div>
            <div class="tx-stat-mini-body">
              <div class="tx-stat-mini-value">${stats.successCount} <small style="font-size:0.7em;color:var(--color-text-3)">(${stats.rate}%)</small></div>
              <div class="tx-stat-mini-label">Success</div>
            </div>
          </div>
          <div class="tx-stat-mini">
            <div class="tx-stat-mini-icon info"><i data-lucide="loader"></i></div>
            <div class="tx-stat-mini-body">
              <div class="tx-stat-mini-value">${stats.processingCount}</div>
              <div class="tx-stat-mini-label">Processing</div>
            </div>
          </div>
          <div class="tx-stat-mini">
            <div class="tx-stat-mini-icon danger"><i data-lucide="x-circle"></i></div>
            <div class="tx-stat-mini-body">
              <div class="tx-stat-mini-value">${stats.failedCount}</div>
              <div class="tx-stat-mini-label">Failed</div>
            </div>
          </div>
        </div>

        <!-- Filter & Controls Bar -->
        <div class="tx-table-controls">
          <div class="tx-table-controls-left">
            <div class="search-input-wrap" style="min-width:200px;flex:1;max-width:320px">
              <i data-lucide="search" class="search-icon"></i>
              <input class="form-input" id="filter-search" type="text" placeholder="Search transactions…" value="${searchQ}">
            </div>
            <select class="form-select sm" id="filter-status">
              <option value="">All Statuses</option>
              <option value="success" ${statusFilter === 'success' ? 'selected' : ''}>✓ Success</option>
              <option value="processing" ${statusFilter === 'processing' ? 'selected' : ''}>↻ Processing</option>
              <option value="failed" ${statusFilter === 'failed' ? 'selected' : ''}>✗ Failed</option>
              <option value="cancelled" ${statusFilter === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              <option value="initiated" ${statusFilter === 'initiated' ? 'selected' : ''}>Initiated</option>
              <option value="expired" ${statusFilter === 'expired' ? 'selected' : ''}>Expired</option>
            </select>
            <div class="date-range-group">
              <input class="form-input" id="filter-date-from" type="date" value="${dateFrom}" title="From date">
              <span class="date-range-sep">→</span>
              <input class="form-input" id="filter-date-to" type="date" value="${dateTo}" title="To date">
            </div>
          </div>
          <div class="tx-table-controls-right">
            <div class="tx-per-page">
              <span>Show</span>
              <select id="tx-limit-select">
                <option value="10" ${limit === 10 ? 'selected' : ''}>10</option>
                <option value="25" ${limit === 25 ? 'selected' : ''}>25</option>
                <option value="50" ${limit === 50 ? 'selected' : ''}>50</option>
                <option value="100" ${limit === 100 ? 'selected' : ''}>100</option>
              </select>
              <span>per page</span>
            </div>
          </div>
        </div>

        <!-- Data Table -->
        <div class="card">
          <div class="ui-table-wrapper">
            <table class="ui-table">
              <thead>
                <tr>
                  <th style="width:44px;text-align:center"><input type="checkbox" class="tx-checkbox" id="tx-select-all" ${allChecked ? 'checked' : ''}></th>
                  <th>Merchant TX ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Method</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th style="width:80px"></th>
                </tr>
              </thead>
              <tbody>
                ${txs.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:48px;color:var(--color-text-3)"><i data-lucide="inbox" style="width:32px;height:32px;margin:0 auto 8px;display:block;opacity:0.4"></i>No transactions found</td></tr>` :
                  txs.map(tx => `
                    <tr class="ui-table-row ${selectedIds.has(tx.id) ? 'selected' : ''}" data-tx-id="${tx.id}">
                      <td style="text-align:center" onclick="event.stopPropagation()">
                        <input type="checkbox" class="tx-checkbox tx-row-check" data-id="${tx.id}" ${selectedIds.has(tx.id) ? 'checked' : ''}>
                      </td>
                      <td><code class="code-tag sm">${tx.eps_merchant_tx_id || tx.id?.slice(0, 8)}</code></td>
                      <td><span class="tx-amount ${tx.status === 'success' ? 'success' : ''}">${formatCurrency(tx.amount)}</span></td>
                      <td>${statusBadge(tx.status)}</td>
                      <td>${tx.eps_financial_entity || '—'}</td>
                      <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${tx.customer_name || tx.customer_email || tx.eps_customer_id || '—'}</td>
                      <td>${formatDate(tx.created_at)}</td>
                      <td>
                        <div class="tx-row-actions">
                          <button class="tx-action-btn" onclick="event.stopPropagation();Pages._viewTransaction('${tx.id}')" title="View details">
                            <i data-lucide="eye"></i>
                          </button>
                          <button class="tx-action-btn danger" onclick="event.stopPropagation();Pages._confirmDeleteTransaction('${tx.id}', '${tx.eps_merchant_tx_id || ''}', '${tx.amount}', '${tx.status}')" title="Delete">
                            <i data-lucide="trash-2"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
          ${renderPagination(page, total, limit, `(p) => { page=p; Pages.transactions(document.getElementById('page-content')); }`)}
        </div>
      `;
      if (window.lucide) lucide.createIcons();

      // ── Wire up events ──────────────────────────────────────────────────
      // Search
      document.getElementById('filter-search')?.addEventListener('input', (e) => {
        searchQ = e.target.value; page = 1;
        clearTimeout(window._tx_t);
        window._tx_t = setTimeout(load, 400);
      });
      // Status filter
      document.getElementById('filter-status')?.addEventListener('change', (e) => {
        statusFilter = e.target.value; page = 1; load();
      });
      // Date filters
      document.getElementById('filter-date-from')?.addEventListener('change', (e) => {
        dateFrom = e.target.value; page = 1; load();
      });
      document.getElementById('filter-date-to')?.addEventListener('change', (e) => {
        dateTo = e.target.value; page = 1; load();
      });
      // Per-page limit
      document.getElementById('tx-limit-select')?.addEventListener('change', (e) => {
        limit = parseInt(e.target.value); page = 1; load();
      });
      // Select all checkbox
      document.getElementById('tx-select-all')?.addEventListener('change', (e) => {
        txs.forEach(tx => {
          if (e.target.checked) selectedIds.add(tx.id);
          else selectedIds.delete(tx.id);
        });
        renderList(txs, total);
      });
      // Individual checkboxes
      document.querySelectorAll('.tx-row-check').forEach(cb => {
        cb.addEventListener('change', (e) => {
          if (e.target.checked) selectedIds.add(e.target.dataset.id);
          else selectedIds.delete(e.target.dataset.id);
          const row = e.target.closest('.ui-table-row');
          row?.classList.toggle('selected', e.target.checked);
          const allCb = document.getElementById('tx-select-all');
          if (allCb) allCb.checked = txs.every(t => selectedIds.has(t.id));
        });
      });
      // Row click → open detail panel
      document.querySelectorAll('.ui-table-row[data-tx-id]').forEach(row => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', (e) => {
          if (e.target.closest('.tx-row-actions') || e.target.closest('.tx-checkbox')) return;
          Pages._viewTransaction(row.dataset.txId);
        });
      });
      // CSV Export
      document.getElementById('export-tx-csv')?.addEventListener('click', () => {
        UI.exportCSV('transactions.csv',
          [
            { label: 'Merchant TX ID', key: 'raw_merchant_id' },
            { label: 'Amount', key: 'raw_amount' },
            { label: 'Status', key: 'raw_status' },
            { label: 'Method', key: 'raw_method' },
            { label: 'Customer ID', key: 'raw_customer' },
            { label: 'Date', key: 'raw_date' },
          ],
          currentTxs.map(tx => ({
            raw_merchant_id: tx.eps_merchant_tx_id || tx.id?.slice(0, 8),
            raw_amount: tx.amount,
            raw_status: tx.status,
            raw_method: tx.eps_financial_entity || '',
            raw_customer: tx.eps_customer_id || '',
            raw_date: tx.created_at,
          }))
        );
      });
    };

    try {
      container.innerHTML = Components.renderSkeleton(8);
      await load();
    } catch (e) {
      container.innerHTML = Components.renderError(e.message);
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSACTION DETAIL — SLIDE-OUT PANEL
  // ═══════════════════════════════════════════════════════════════════════════

  async _viewTransaction(id) {
    try {
      const res = await API.getTransaction(id);
      const tx = res.transaction || res;
      const events = res.events || [];
      const bill = res.bill || null;

      // ── Helper for detail rows ──────────────────────────────────────────
      const dRow = (label, value, copyable = false) => {
        const copyBtn = copyable && value && value !== '—'
          ? `<button class="tx-copy-btn" onclick="event.stopPropagation();UI.copyToClipboard('${String(value).replace(/'/g, "\\'").replace(/"/g, '&quot;')}')"><i data-lucide="copy"></i></button>`
          : '';
        return `<div class="tx-detail-row"><span class="tx-detail-label">${label}</span><span class="tx-detail-value">${value ?? '—'}${copyBtn}</span></div>`;
      };

      // ── Syntax-highlighted JSON ──────────────────────────────────────────
      const syntaxJSON = (obj) => {
        if (!obj) return '<span class="json-null">null</span>';
        const json = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
          let cls = 'json-number';
          if (/^"/.test(match)) { cls = /:$/.test(match) ? 'json-key' : 'json-string'; }
          else if (/true|false/.test(match)) { cls = 'json-bool'; }
          else if (/null/.test(match)) { cls = 'json-null'; }
          return `<span class="${cls}">${match}</span>`;
        });
      };

      // Remove any existing panel
      document.getElementById('tx-detail-backdrop')?.remove();
      document.getElementById('tx-detail-panel')?.remove();

      // ── Build Panel HTML ────────────────────────────────────────────────
      const panelHTML = `
        <div class="tx-panel-backdrop" id="tx-detail-backdrop"></div>
        <div class="tx-panel" id="tx-detail-panel">
          <!-- Header -->
          <div class="tx-panel-header">
            <div class="tx-panel-header-left">
              <h3>Transaction Details</h3>
              <span class="tx-panel-status">${statusBadge(tx.status)}</span>
            </div>
            <div class="tx-panel-header-actions">
              <button class="tx-action-btn danger" id="tx-panel-delete" title="Delete transaction">
                <i data-lucide="trash-2"></i>
              </button>
              <button class="tx-action-btn" id="tx-panel-close" title="Close">
                <i data-lucide="x"></i>
              </button>
            </div>
          </div>

          <!-- Tabs -->
          <div class="tx-tabs">
            <button class="tx-tab active" data-tab="overview">Overview</button>
            <button class="tx-tab" data-tab="bill">Bill Info</button>
            <button class="tx-tab" data-tab="timeline">Timeline (${events.length})</button>
            <button class="tx-tab" data-tab="technical">Technical</button>
          </div>

          <!-- Tab Content -->
          <div class="tx-panel-body">
            <!-- Overview Tab -->
            <div class="tx-tab-content active" id="tab-overview">
              <div class="tx-panel-section">
                <div class="tx-panel-section-title"><i data-lucide="credit-card"></i> Transaction Info</div>
                <div class="tx-detail-grid">
                  ${dRow('Transaction ID', `<code>${tx.id}</code>`, true)}
                  ${dRow('EPS TX ID', tx.eps_transaction_id ? `<code>${tx.eps_transaction_id}</code>` : '—', !!tx.eps_transaction_id)}
                  ${dRow('Merchant TX ID', `<code>${tx.eps_merchant_tx_id}</code>`, true)}
                  ${dRow('Amount', `<span class="tx-amount ${tx.status === 'success' ? 'success' : ''}">${formatCurrency(tx.amount)}</span>`)}
                  ${dRow('Currency', tx.currency || 'BDT')}
                  ${dRow('Status', statusBadge(tx.status))}
                  ${dRow('Gateway Provider', tx.gateway_provider || '—')}
                  ${dRow('Payment Method', tx.eps_financial_entity || '—')}
                  ${dRow('Customer ID', tx.eps_customer_id || '—', !!tx.eps_customer_id)}
                  ${dRow('Customer', bill?.customer_name || bill?.customer_email || '—')}
                  ${dRow('Payment Ref', tx.eps_payment_ref || '—', !!tx.eps_payment_ref)}
                  ${dRow('Customer Order ID', tx.eps_customer_order_id || '—')}
                </div>
              </div>
              <div class="tx-panel-section">
                <div class="tx-panel-section-title"><i data-lucide="clock"></i> Timestamps</div>
                <div class="tx-detail-grid">
                  ${dRow('Created', formatDate(tx.created_at))}
                  ${dRow('Initiated', formatDate(tx.initiated_at))}
                  ${dRow('Redirected', formatDate(tx.redirected_at))}
                  ${dRow('Callback Received', formatDate(tx.callback_received_at))}
                  ${dRow('Verified', formatDate(tx.verified_at))}
                  ${dRow('Completed', formatDate(tx.completed_at))}
                  ${tx.failed_at ? dRow('Failed', formatDate(tx.failed_at)) : ''}
                </div>
              </div>
            </div>

            <!-- Bill Info Tab -->
            <div class="tx-tab-content" id="tab-bill">
              <div class="tx-panel-section">
                <div class="tx-panel-section-title"><i data-lucide="receipt"></i> Bill Details</div>
                ${bill ? `
                  <div class="tx-detail-grid">
                    ${dRow('Bill ID', `<code>${bill.id}</code>`, true)}
                    ${dRow('Bill Token', `<code>${bill.bill_token?.slice(0, 20)}…</code>`, true)}
                    ${dRow('Service ID', `<code>${bill.service_id}</code>`, true)}
                    ${dRow('Payment Type', bill.payment_type || '—')}
                    ${dRow('Status', statusBadge(bill.status))}
                  </div>
                ` : '<p style="color:var(--color-text-3);font-size:0.8125rem">No bill data available</p>'}
              </div>
              ${bill ? `
              <div class="tx-panel-section">
                <div class="tx-panel-section-title"><i data-lucide="user"></i> Customer</div>
                <div class="tx-detail-grid">
                  ${dRow('Name', bill.customer_name || '—')}
                  ${dRow('Email', bill.customer_email || '—')}
                  ${dRow('Phone', bill.customer_phone || '—')}
                  ${dRow('Address', bill.customer_address || '—')}
                  ${dRow('City', bill.customer_city || '—')}
                  ${dRow('Country', bill.customer_country || '—')}
                </div>
              </div>
              <div class="tx-panel-section">
                <div class="tx-panel-section-title"><i data-lucide="calculator"></i> Amount Breakdown</div>
                <div class="tx-detail-grid">
                  ${dRow('Subtotal', formatCurrency(bill.subtotal))}
                  ${dRow('Discount', formatCurrency(bill.total_discount))}
                  ${dRow('Tax', formatCurrency(bill.tax_amount))}
                  ${dRow('Shipping', formatCurrency(bill.shipping_amount))}
                  ${dRow('Final Amount', `<strong>${formatCurrency(bill.final_amount)}</strong>`)}
                </div>
              </div>
              ` : ''}
            </div>

            <!-- Timeline Tab -->
            <div class="tx-tab-content" id="tab-timeline">
              <div class="tx-panel-section">
                <div class="tx-panel-section-title"><i data-lucide="git-commit"></i> Event Timeline</div>
                ${events.length === 0
                  ? '<p style="color:var(--color-text-3);font-size:0.8125rem">No events recorded</p>'
                  : `<div class="tx-timeline">
                      ${events.map((ev, i) => {
                        const evClass = ev.new_status === 'success' ? 'success' : ev.new_status === 'failed' ? 'failed' : '';
                        return `
                          <div class="tx-timeline-item ${evClass}">
                            <div class="tx-timeline-dot"></div>
                            <div>
                              <div class="tx-timeline-event-type">${ev.event_type}</div>
                              <div class="tx-timeline-meta">
                                <span class="tx-timeline-time">${formatDate(ev.created_at)}</span>
                                ${ev.old_status || ev.new_status ? `
                                  <span class="tx-timeline-status-change">
                                    ${ev.old_status || '—'} <i data-lucide="arrow-right"></i> ${ev.new_status || '—'}
                                  </span>
                                ` : ''}
                                <span class="tx-timeline-source">${ev.source}</span>
                              </div>
                            </div>
                          </div>`;
                      }).join('')}
                    </div>`
                }
              </div>
            </div>

            <!-- Technical Tab -->
            <div class="tx-tab-content" id="tab-technical">
              <div class="tx-panel-section">
                <div class="tx-panel-section-title"><i data-lucide="globe"></i> Client Info</div>
                <div class="tx-detail-grid">
                  ${dRow('Client IP', tx.client_ip || '—', !!tx.client_ip)}
                  ${dRow('User Agent', tx.user_agent ? `<span style="font-size:0.7rem;max-width:280px;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${(tx.user_agent || '').replace(/"/g, '&quot;')}">${tx.user_agent}</span>` : '—')}
                  ${dRow('Transaction Type ID', tx.transaction_type_id)}
                  ${dRow('Redirect URL', tx.eps_redirect_url ? `<a href="${tx.eps_redirect_url}" target="_blank" style="font-size:0.75rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block">${tx.eps_redirect_url}</a>` : '—')}
                </div>
              </div>
              <div class="tx-panel-section">
                <div class="tx-panel-section-title"><i data-lucide="box"></i> Custom Values</div>
                <div class="tx-detail-grid">
                  ${dRow('Value A', tx.value_a || '—')}
                  ${dRow('Value B', tx.value_b || '—')}
                  ${dRow('Value C', tx.value_c || '—')}
                  ${dRow('Value D', tx.value_d || '—')}
                </div>
              </div>
              ${tx.gateway_error_code || tx.gateway_error_message ? `
              <div class="tx-panel-section">
                <div class="tx-panel-section-title"><i data-lucide="alert-triangle"></i> Error Info</div>
                <div class="tx-detail-grid">
                  ${dRow('Error Code', tx.gateway_error_code || '—')}
                  ${dRow('Error Message', tx.gateway_error_message || '—')}
                </div>
              </div>
              ` : ''}
              <div class="tx-panel-section">
                <div class="tx-panel-section-title"><i data-lucide="code-2"></i> Gateway Raw Response</div>
                ${tx.gateway_response_raw ? `
                  <div class="tx-json-viewer">
                    <button class="tx-json-copy" onclick="UI.copyToClipboard(JSON.stringify(${JSON.stringify(tx.gateway_response_raw).replace(/'/g, "\\'")}, null, 2))">
                      <i data-lucide="copy"></i> Copy
                    </button>
                    <pre>${syntaxJSON(tx.gateway_response_raw)}</pre>
                  </div>
                ` : '<p style="color:var(--color-text-3);font-size:0.8125rem">No gateway response data</p>'}
              </div>
            </div>
          </div>
        </div>
      `;

      // ── Mount Panel ──────────────────────────────────────────────────────
      document.body.insertAdjacentHTML('beforeend', panelHTML);
      if (window.lucide) lucide.createIcons();

      const backdrop = document.getElementById('tx-detail-backdrop');
      const panel = document.getElementById('tx-detail-panel');

      // Animate in
      requestAnimationFrame(() => {
        backdrop.classList.add('visible');
        panel.classList.add('open');
      });

      // ── Close panel ──────────────────────────────────────────────────────
      const closePanel = () => {
        panel.classList.remove('open');
        backdrop.classList.remove('visible');
        setTimeout(() => {
          backdrop.remove();
          panel.remove();
        }, 300);
      };

      document.getElementById('tx-panel-close')?.addEventListener('click', closePanel);
      backdrop.addEventListener('click', closePanel);
      document.addEventListener('keydown', function _esc(e) {
        if (e.key === 'Escape') { closePanel(); document.removeEventListener('keydown', _esc); }
      });

      // ── Tab switching ──────────────────────────────────────────────────
      panel.querySelectorAll('.tx-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          panel.querySelectorAll('.tx-tab').forEach(t => t.classList.remove('active'));
          panel.querySelectorAll('.tx-tab-content').forEach(c => c.classList.remove('active'));
          tab.classList.add('active');
          document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add('active');
          if (window.lucide) lucide.createIcons();
        });
      });

      // ── Delete from panel ──────────────────────────────────────────────
      document.getElementById('tx-panel-delete')?.addEventListener('click', () => {
        closePanel();
        setTimeout(() => {
          Pages._confirmDeleteTransaction(tx.id, tx.eps_merchant_tx_id, tx.amount, tx.status);
        }, 350);
      });

    } catch (e) {
      Toast.error(e.message);
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE CONFIRMATION MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  _confirmDeleteTransaction(id, merchantTxId, amount, status) {
    Modal.show('Delete Transaction', `
      <div class="tx-delete-modal">
        <div class="tx-delete-icon"><i data-lucide="alert-triangle"></i></div>
        <div class="tx-delete-title">Permanently Delete Transaction?</div>
        <div class="tx-delete-desc">
          This action is <strong>irreversible</strong>. The transaction and all its event history will be permanently removed from the database.
        </div>
        <div class="tx-delete-details">
          <div class="tx-delete-detail-row">
            <span>Merchant TX ID</span>
            <span><code style="font-family:monospace;font-size:0.8em;background:var(--color-surface-3);padding:2px 6px;border-radius:4px">${merchantTxId || id?.slice(0, 8)}</code></span>
          </div>
          <div class="tx-delete-detail-row">
            <span>Amount</span>
            <span>${formatCurrency(amount)}</span>
          </div>
          <div class="tx-delete-detail-row">
            <span>Status</span>
            <span>${statusBadge(status)}</span>
          </div>
        </div>
        <div class="tx-delete-confirm-wrap">
          <div class="tx-delete-confirm-label">Type <strong>DELETE</strong> to confirm</div>
          <input class="tx-delete-confirm-input" id="tx-delete-confirm-input" type="text" placeholder="DELETE" autocomplete="off" spellcheck="false">
        </div>
        <div class="tx-delete-actions">
          <button class="tx-delete-btn cancel" onclick="Modal.close()">Cancel</button>
          <button class="tx-delete-btn confirm" id="tx-delete-confirm-btn" disabled>
            <i data-lucide="trash-2"></i> Delete Permanently
          </button>
        </div>
      </div>
    `);

    if (window.lucide) lucide.createIcons();

    const input = document.getElementById('tx-delete-confirm-input');
    const btn = document.getElementById('tx-delete-confirm-btn');

    input?.addEventListener('input', () => {
      const matched = input.value.trim() === 'DELETE';
      input.classList.toggle('matched', matched);
      btn.classList.toggle('enabled', matched);
      btn.disabled = !matched;
    });

    input?.focus();

    btn?.addEventListener('click', async () => {
      if (input.value.trim() !== 'DELETE') return;
      btn.classList.add('loading');
      btn.innerHTML = '<i data-lucide="loader" style="animation:spin 1s linear infinite"></i> Deleting…';
      if (window.lucide) lucide.createIcons();

      try {
        await API.deleteTransaction(id);
        Modal.close();
        Toast.success('Transaction deleted successfully');
        // Refresh the table
        const content = document.getElementById('page-content');
        if (content) Pages.transactions(content);
      } catch (e) {
        btn.classList.remove('loading');
        btn.innerHTML = '<i data-lucide="trash-2"></i> Delete Permanently';
        if (window.lucide) lucide.createIcons();
        Toast.error(e.message || 'Failed to delete transaction');
      }
    });
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BILLS
  // ═══════════════════════════════════════════════════════════════════════════

  async bills(container) {
    let page = 1, limit = 25, statusFilter = '';
    const load = async () => {
      const offset = (page - 1) * limit;
      const params = { limit, offset };
      if (statusFilter) params.status = statusFilter;
      const data = await API.getBills(params);
      const items = data.data || data.bills || data;
      renderList(items, data.total || items.length);
    };

    const renderList = (bills, total) => {
      const paid = bills.filter(b => b.status === 'paid' || b.status === 'success');
      const pending = bills.filter(b => b.status === 'pending' || b.status === 'processing');
      const expired = bills.filter(b => b.status === 'expired');
      const totalPaid = paid.reduce((s, b) => s + (parseFloat(b.amount || b.final_amount) || 0), 0);

      container.innerHTML = `
        ${Components.renderPageHeader('Bills', `${total.toLocaleString()} total bills`,
          `<div style="display:flex;gap:8px">
            <button class="btn btn-ghost sm" onclick="Pages.bills(document.getElementById('page-content'))" title="Refresh">
              <i data-lucide="refresh-cw"></i>
            </button>
            <button class="btn btn-ghost sm" id="export-bills-csv">
              <i data-lucide="download"></i> Export
            </button>
          </div>`)}
        <div class="tx-stats-bar">
          <div class="tx-stat-mini">
            <div class="tx-stat-mini-icon brand"><i data-lucide="receipt"></i></div>
            <div class="tx-stat-mini-body">
              <div class="tx-stat-mini-value">${total.toLocaleString()}</div>
              <div class="tx-stat-mini-label">Total Bills</div>
            </div>
          </div>
          <div class="tx-stat-mini">
            <div class="tx-stat-mini-icon success"><i data-lucide="check-circle"></i></div>
            <div class="tx-stat-mini-body">
              <div class="tx-stat-mini-value">${formatCurrency(totalPaid)}</div>
              <div class="tx-stat-mini-label">Paid</div>
            </div>
          </div>
          <div class="tx-stat-mini">
            <div class="tx-stat-mini-icon warning"><i data-lucide="clock"></i></div>
            <div class="tx-stat-mini-body">
              <div class="tx-stat-mini-value">${pending.length}</div>
              <div class="tx-stat-mini-label">Pending</div>
            </div>
          </div>
          <div class="tx-stat-mini">
            <div class="tx-stat-mini-icon danger"><i data-lucide="x-circle"></i></div>
            <div class="tx-stat-mini-body">
              <div class="tx-stat-mini-value">${expired.length}</div>
              <div class="tx-stat-mini-label">Expired</div>
            </div>
          </div>
        </div>
        ${Components.renderFilterBar([
          { id: 'bill-status', type: 'select', value: statusFilter,
            onChange: `statusFilter=this.value;page=1;Pages.bills(document.getElementById('page-content'))`,
            options: [
              { value: '', label: 'All Statuses' },
              { value: 'pending', label: '⏳ Pending' },
              { value: 'paid', label: '✓ Paid' },
              { value: 'expired', label: '✗ Expired' },
              { value: 'cancelled', label: 'Cancelled' },
            ]
          },
        ])}
        <div class="card">
          ${Components.renderTable(
            [
              { label: 'Bill Token', key: 'token' },
              { label: 'Customer', key: 'customer' },
              { label: 'Amount', key: 'amount' },
              { label: 'Status', key: 'status' },
              { label: 'Created', key: 'created' },
              { label: '', key: 'actions' },
            ],
            bills.map(b => ({
              token: `<code class="code-tag sm">${(b.bill_token || b.id || '').slice(0, 12)}…</code>`,
              customer: b.customer_name || b.customer_email || b.customer_id?.slice(0,8) || '—',
              amount: `<span class="tx-amount">${formatCurrency(b.amount || b.final_amount)}</span>`,
              status: statusBadge(b.status),
              created: formatDate(b.created_at),
              actions: `<button class="btn btn-ghost sm" onclick="Pages._viewBill('${b.id}')" title="View details"><i data-lucide="eye"></i></button>`,
            })),
            'No bills found'
          )}
          ${renderPagination(page, total, limit, `(p) => { page=p; Pages.bills(document.getElementById('page-content')); }`)}
        </div>
      `;

      document.getElementById('export-bills-csv')?.addEventListener('click', () => {
        UI.exportCSV('bills.csv',
          [
            { label: 'Token', key: 'token' },
            { label: 'Customer', key: 'customer' },
            { label: 'Amount', key: 'amount' },
            { label: 'Status', key: 'status' },
            { label: 'Created', key: 'created' },
          ],
          bills.map(b => ({
            token: b.bill_token || b.id || '',
            customer: b.customer_name || b.customer_email || '',
            amount: b.amount || b.final_amount,
            status: b.status,
            created: b.created_at,
          }))
        );
      });

      if (window.lucide) lucide.createIcons();
    };

    try { container.innerHTML = Components.renderSkeleton(); await load(); }
    catch (e) { container.innerHTML = Components.renderError(e.message); }
  },

  async _viewBill(id) {
    try {
      const bill = await API.getBill(id);
      const b = bill.bill || bill;
      Modal.show('Bill Details', `
        <div class="svc-detail-header">
          <div class="svc-detail-avatar svc-avatar-blue"><i data-lucide="receipt" style="width:24px;height:24px;color:white"></i></div>
          <div class="svc-detail-info">
            <div class="svc-detail-name">${formatCurrency(b.amount || b.final_amount)}</div>
            <div class="svc-detail-meta">
              ${statusBadge(b.status)}
              <code class="code-tag sm">${(b.bill_token || b.id || '').slice(0, 16)}</code>
            </div>
          </div>
        </div>
        <div class="detail-grid">
          ${Components.renderDetailRow('Bill ID', `<code>${b.id}</code>`)}
          ${Components.renderDetailRow('Token', `<code class="code-tag">${b.bill_token || '—'}</code>`)}
          ${Components.renderDetailRow('Amount', `<strong>${formatCurrency(b.amount || b.final_amount)}</strong>`)}
          ${Components.renderDetailRow('Currency', b.currency || 'BDT')}
          ${Components.renderDetailRow('Status', statusBadge(b.status))}
          ${Components.renderDetailRow('Customer', b.customer_name || b.customer_email || b.customer_id || '—')}
          ${Components.renderDetailRow('Service', b.service_name || b.service_id?.slice(0,8) || '—')}
          ${Components.renderDetailRow('Description', b.description || '—')}
          ${Components.renderDetailRow('Payment Type', b.payment_type || '—')}
          ${Components.renderDetailRow('Created', formatDate(b.created_at))}
          ${Components.renderDetailRow('Expires', formatDate(b.expires_at))}
          ${b.paid_at ? Components.renderDetailRow('Paid At', formatDate(b.paid_at)) : ''}
        </div>
        ${b.items && b.items.length ? `
          <div class="section-header" style="margin-top:20px">
            <div class="section-title"><i data-lucide="list"></i> Line Items</div>
          </div>
          ${Components.renderTable(
            [{ label: 'Item', key: 'name' }, { label: 'Qty', key: 'qty' }, { label: 'Price', key: 'price' }],
            b.items.map(item => ({
              name: item.name || item.product_name || item.description || '—',
              qty: item.quantity || 1,
              price: formatCurrency(item.price || item.unit_final_price || item.amount || 0),
            })),
            'No items'
          )}` : ''}
        ${b.success_url ? `
          <div class="section-header" style="margin-top:20px">
            <div class="section-title"><i data-lucide="link"></i> Redirect URLs</div>
          </div>
          ${b.success_url ? `<div class="url-display" style="margin-bottom:8px"><i data-lucide="check-circle"></i> ${b.success_url}</div>` : ''}
          ${b.fail_url ? `<div class="url-display" style="margin-bottom:8px"><i data-lucide="x-circle"></i> ${b.fail_url}</div>` : ''}
          ${b.cancel_url ? `<div class="url-display"><i data-lucide="ban"></i> ${b.cancel_url}</div>` : ''}
        ` : ''}
      `);
      if (window.lucide) lucide.createIcons();
    } catch (e) { Toast.error(e.message); }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REFUNDS
  // ═══════════════════════════════════════════════════════════════════════════

  async refunds(container) {
    let page = 1, limit = 25, statusFilter = 'requested';
    const load = async () => {
      const data = await API.getRefunds({ limit, offset: (page-1)*limit, status: statusFilter });
      const items = data.data || data.refunds || data;
      renderList(items, data.total || items.length || 0);
    };

    const renderList = (refunds, total) => {
      container.innerHTML = `
        ${Components.renderPageHeader('Refunds', 'Manual approval required for all refunds',
          `<div style="display:flex;gap:8px;align-items:center">
            <span class="badge badge-warning"><i data-lucide="alert-triangle"></i> Manual Approval Only</span>
            <button class="btn btn-ghost sm" onclick="Pages.refunds(document.getElementById('page-content'))" title="Refresh">
              <i data-lucide="refresh-cw"></i>
            </button>
          </div>`)}
        ${Components.renderFilterBar([
          { id: 'status', type: 'select',
            onChange: `statusFilter=this.value;page=1;Pages.refunds(document.getElementById('page-content'))`,
            options: [
              { value: 'requested', label: '⏳ Pending' },
              { value: 'approved', label: '✓ Approved' },
              { value: 'rejected', label: '✗ Rejected' },
              { value: '', label: 'All' },
            ]
          }
        ])}
        <div class="card">
          ${Components.renderTable(
            [
              { label: 'Amount', key: 'amount' },
              { label: 'Reason', key: 'reason' },
              { label: 'Requested By', key: 'req_by' },
              { label: 'Status', key: 'status' },
              { label: 'Date', key: 'date' },
              { label: 'Actions', key: 'actions' },
            ],
            refunds.map(r => ({
              amount: `<a href="#" onclick="event.preventDefault();Pages._viewRefund('${r.id}')" style="text-decoration:none"><span class="amount" style="cursor:pointer;color:var(--color-primary)">${formatCurrency(r.refund_amount)}</span></a>`,
              reason: r.refund_reason?.slice(0, 40) || '—',
              req_by: r.requested_by,
              status: statusBadge(r.status),
              date: formatDate(r.requested_at),
              actions: r.status === 'requested' ? `
                <div class="action-btns">
                  <button class="btn btn-success sm" onclick="Pages._approveRefund('${r.id}')">
                    <i data-lucide="check"></i> Approve
                  </button>
                  <button class="btn btn-danger sm" onclick="Pages._rejectRefund('${r.id}')">
                    <i data-lucide="x"></i> Reject
                  </button>
                </div>
              ` : statusBadge(r.status),
            })),
            'No refunds in this status'
          )}
          ${renderPagination(page, total, limit, `(p) => { page=p; Pages.refunds(document.getElementById('page-content')); }`)}
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    };

    try { container.innerHTML = Components.renderSkeleton(); await load(); }
    catch (e) { container.innerHTML = Components.renderError(e.message); }
  },

  async _approveRefund(id) {
    UI.promptModal('Approve Refund', 'This refund will be queued for processing via EPS.', {
      label: 'Admin Notes (optional)',
      placeholder: 'Add notes about this approval…',
      required: false,
    }, async (notes) => {
      try {
        await API.approveRefund(id, notes);
        Toast.success('Refund approved and queued for processing');
        Pages.refunds(document.getElementById('page-content'));
      } catch (e) { Toast.error(e.message); }
    });
  },

  async _rejectRefund(id) {
    UI.promptModal('Reject Refund', 'Please provide a reason for rejecting this refund request.', {
      label: 'Rejection Reason',
      placeholder: 'Enter rejection reason…',
      required: true,
    }, async (reason) => {
      try {
        await API.rejectRefund(id, reason);
        Toast.success('Refund rejected');
        Pages.refunds(document.getElementById('page-content'));
      } catch (e) { Toast.error(e.message); }
    });
  },

  async _viewRefund(id) {
    try {
      const data = await API.getRefund(id);
      const r = data.refund || data;
      Modal.show('Refund Details', `
        <div class="svc-detail-header">
          <div class="svc-detail-avatar svc-avatar-rose"><i data-lucide="rotate-ccw" style="width:24px;height:24px;color:white"></i></div>
          <div class="svc-detail-info">
            <div class="svc-detail-name">${formatCurrency(r.refund_amount)}</div>
            <div class="svc-detail-meta">
              ${statusBadge(r.status)}
            </div>
          </div>
        </div>
        <div class="detail-grid">
          ${Components.renderDetailRow('Refund ID', `<code>${r.id}</code>`)}
          ${Components.renderDetailRow('Amount', `<strong>${formatCurrency(r.refund_amount)}</strong>`)}
          ${Components.renderDetailRow('Reason', r.refund_reason || '—')}
          ${Components.renderDetailRow('Requested By', r.requested_by || '—')}
          ${Components.renderDetailRow('Status', statusBadge(r.status))}
          ${Components.renderDetailRow('Requested', formatDate(r.requested_at || r.created_at))}
          ${r.approved_at ? Components.renderDetailRow('Approved', formatDate(r.approved_at)) : ''}
          ${r.rejected_at ? Components.renderDetailRow('Rejected', formatDate(r.rejected_at)) : ''}
          ${r.admin_notes ? Components.renderDetailRow('Admin Notes', r.admin_notes) : ''}
          ${r.rejection_reason ? Components.renderDetailRow('Rejection Reason', `<span style="color:var(--color-danger)">${r.rejection_reason}</span>`) : ''}
          ${Components.renderDetailRow('Transaction', r.transaction_id ? `<code class="code-tag sm">${r.transaction_id.slice(0,12)}…</code>` : '—')}
        </div>
      `);
      if (window.lucide) lucide.createIcons();
    } catch (e) { Toast.error(e.message); }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CUSTOMERS
  // ═══════════════════════════════════════════════════════════════════════════

  async customers(container) {
    let page = 1, limit = 25, searchQ = '';
    const load = async () => {
      const data = searchQ
        ? await API.searchCustomers(searchQ, limit, (page-1)*limit)
        : await API.getCustomers({ limit, offset: (page-1)*limit });
      const items = data.data || data.customers || data;
      renderList(items, data.total || items.length || 0);
    };

    const renderList = (customers, total) => {
      container.innerHTML = `
        ${Components.renderPageHeader('Customers', `${total.toLocaleString()} customers`,
          `<button class="btn btn-ghost sm" onclick="Pages.customers(document.getElementById('page-content'))" title="Refresh">
            <i data-lucide="refresh-cw"></i>
          </button>`)}
        ${Components.renderFilterBar([
          { id: 'q', type: 'search', placeholder: 'Search by name, email, phone…',
            onChange: `searchQ=this.value;page=1;clearTimeout(window._cust_t);window._cust_t=setTimeout(()=>Pages.customers(document.getElementById('page-content')),400)` }
        ])}
        <div class="card">
          ${Components.renderTable(
            [
              { label: 'Name', key: 'name' },
              { label: 'Total Spent', key: 'spent' },
              { label: 'Transactions', key: 'tx_count' },
              { label: 'Status', key: 'status' },
              { label: 'Last Seen', key: 'last_seen' },
              { label: '', key: 'actions' },
            ],
            customers.map(c => ({
              name: `<div style="cursor:pointer;color:var(--color-brand);font-weight:500" onclick="event.stopPropagation();Pages._viewCustomer('${c.id}')">${c.display_name || c.canonical_name || 'Unknown'}</div>`,
              spent: formatCurrency(c.total_spent),
              tx_count: c.transaction_count,
              status: c.is_blocked ? '<span class="badge badge-danger">Blocked</span>' : '<span class="badge badge-success">Active</span>',
              last_seen: formatDate(c.last_seen_at),
              actions: `
                <div class="action-btns">
                  ${c.is_blocked
                    ? `<button class="btn btn-ghost sm" onclick="Pages._unblockCustomer('${c.id}')"><i data-lucide="user-check"></i></button>`
                    : `<button class="btn btn-ghost sm danger" onclick="Pages._blockCustomer('${c.id}')"><i data-lucide="user-x"></i></button>`
                  }
                </div>
              `,
            })),
            'No customers found'
          )}
          ${renderPagination(page, total, limit, `(p) => { page=p; Pages.customers(document.getElementById('page-content')); }`)}
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    };

    try { container.innerHTML = Components.renderSkeleton(); await load(); }
    catch (e) { container.innerHTML = Components.renderError(e.message); }
  },

  async _blockCustomer(id) {
    UI.promptModal('Block Customer', 'This customer will be blocked from making payments.', {
      label: 'Block Reason',
      placeholder: 'Enter reason for blocking…',
      required: true,
    }, async (reason) => {
      try {
        await API.blockCustomer(id, reason);
        Toast.success('Customer blocked');
        Pages.customers(document.getElementById('page-content'));
      } catch (e) { Toast.error(e.message); }
    });
  },

  async _unblockCustomer(id) {
    try {
      await API.unblockCustomer(id);
      Toast.success('Customer unblocked');
      Pages.customers(document.getElementById('page-content'));
    } catch (e) { Toast.error(e.message); }
  },

  async _viewCustomer(id) {
    try {
      const data = await API.getCustomer(id);
      const c = data.customer || data;
      Modal.show('Customer Details', `
        <div class="customer-detail-stats">
          <div class="customer-mini-stat">
            <div class="customer-mini-stat-value">${formatCurrency(c.total_spent || 0)}</div>
            <div class="customer-mini-stat-label">Total Spent</div>
          </div>
          <div class="customer-mini-stat">
            <div class="customer-mini-stat-value">${c.transaction_count || 0}</div>
            <div class="customer-mini-stat-label">Transactions</div>
          </div>
          <div class="customer-mini-stat">
            <div class="customer-mini-stat-value">${c.is_blocked ? '<span style="color:var(--color-danger)">Blocked</span>' : '<span style="color:var(--color-success)">Active</span>'}</div>
            <div class="customer-mini-stat-label">Status</div>
          </div>
        </div>
        <div class="detail-grid">
          ${Components.renderDetailRow('Customer ID', `<code>${c.id}</code>`)}
          ${Components.renderDetailRow('Display Name', c.display_name || c.canonical_name || '—')}
          ${Components.renderDetailRow('EPS Customer ID', c.eps_customer_id || '—')}
          ${Components.renderDetailRow('First Seen', formatDate(c.first_seen_at || c.created_at))}
          ${Components.renderDetailRow('Last Seen', formatDate(c.last_seen_at))}
          ${c.blocked_reason ? Components.renderDetailRow('Block Reason', c.blocked_reason) : ''}
        </div>
      `);
    } catch (e) { Toast.error(e.message); }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  _configCategoryMeta: {
    eps: {
      icon: 'icon-eps',
      lucide: 'credit-card',
      title: 'EPS Gateway',
      desc: 'Electronic Payment Service credentials and gateway configuration',
    },
    system: {
      icon: 'icon-system',
      lucide: 'settings',
      title: 'System Settings',
      desc: 'Core platform configuration and operational parameters',
    },
    email: {
      icon: 'icon-email',
      lucide: 'mail',
      title: 'Email Configuration',
      desc: 'SMTP settings and email notification preferences',
    },
    payment: {
      icon: 'icon-payment',
      lucide: 'banknote',
      title: 'Payment Settings',
      desc: 'Payment processing defaults and fee configuration',
    },
    security: {
      icon: 'icon-security',
      lucide: 'shield',
      title: 'Security',
      desc: 'Authentication, encryption, and access control settings',
    },
  },

  _getConfigMeta(category) {
    return this._configCategoryMeta[category] || {
      icon: 'icon-default',
      lucide: 'sliders-horizontal',
      title: category.charAt(0).toUpperCase() + category.slice(1),
      desc: `${category} configuration settings`,
    };
  },

  async config(container) {
    try {
      container.innerHTML = Components.renderSkeleton();
      const configs = await API.getConfig();
      const entries = configs.data || configs.entries || configs;

      // Group by category
      const grouped = {};
      entries.forEach(e => {
        if (!grouped[e.category]) grouped[e.category] = [];
        grouped[e.category].push(e);
      });

      container.innerHTML = `
        ${Components.renderPageHeader('Configuration', 'System settings and credentials',
          `<div style="display:flex;gap:8px">
            <button class="btn btn-ghost sm" onclick="Pages.config(document.getElementById('page-content'))" title="Refresh">
              <i data-lucide="refresh-cw"></i>
            </button>
            <button class="btn btn-primary" id="cfg-save-all-btn" disabled>
              <i data-lucide="save"></i> Save Changes
            </button>
          </div>`)}
        <div class="config-sections">
          ${Object.entries(grouped).map(([cat, items]) => {
            const meta = Pages._getConfigMeta(cat);
            return `
              <div class="config-card">
                <div class="config-card-header">
                  <div class="config-card-icon ${meta.icon}">
                    <i data-lucide="${meta.lucide}"></i>
                  </div>
                  <div class="config-card-title">
                    <h3>${meta.title}</h3>
                    <p>${meta.desc}</p>
                  </div>
                  <span class="config-card-count">${items.length} setting${items.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="config-card-body">
                  ${items.map(item => {
                    if (cat === 'eps' && item.key_name === 'mode') {
                      return ''; // Mode is now per-service (driven by service.is_sandbox)
                    }
                    return `
                    <div class="config-row">
                      <div class="config-row-info">
                        <div class="config-row-label">
                          ${item.key_name}
                          ${item.is_secret ? '<i data-lucide="lock" class="lock-icon"></i>' : ''}
                        </div>
                        ${item.description ? `<div class="config-row-desc">${item.description}</div>` : ''}
                      </div>
                      <div class="config-row-input">
                        <input class="form-input cfg-input"
                          type="${item.is_secret ? 'password' : 'text'}"
                          id="cfg-${cat}-${item.key_name}"
                          data-category="${cat}"
                          data-key="${item.key_name}"
                          data-original="${item.is_secret ? '' : (item.value || '').replace(/"/g, '&quot;')}"
                          value="${item.is_secret ? '' : (item.value || '')}"
                          placeholder="${item.is_secret ? '(encrypted — leave blank to keep)' : 'Not set'}">
                        ${item.is_secret ? `<button type="button" class="toggle-password" onclick="Pages._toggleConfigPassword(this)" title="Show/hide">
                          <i data-lucide="eye" style="width:16px;height:16px"></i>
                        </button>` : ''}
                      </div>
                    </div>`;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      // Track changes
      document.querySelectorAll('.cfg-input').forEach(inp => {
        inp.addEventListener('input', () => {
          const isModified = inp.value !== (inp.dataset.original || '');
          inp.classList.toggle('config-input-modified', isModified);
          Pages._updateConfigSaveBtn();
        });
      });

      // Save all button
      document.getElementById('cfg-save-all-btn')?.addEventListener('click', () => Pages._saveAllConfig());

      if (window.lucide) lucide.createIcons();
    } catch (e) { container.innerHTML = Components.renderError(e.message); }
  },

  _toggleConfigPassword(btn) {
    const input = btn.previousElementSibling;
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    const icon = btn.querySelector('i');
    if (icon) {
      icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
      if (window.lucide) lucide.createIcons({ nodes: [btn] });
    }
  },

  _updateConfigSaveBtn() {
    const modified = document.querySelectorAll('.config-input-modified');
    const btn = document.getElementById('cfg-save-all-btn');
    if (btn) {
      btn.disabled = modified.length === 0;
      btn.innerHTML = modified.length > 0
        ? `<i data-lucide="save"></i> Save ${modified.length} Change${modified.length !== 1 ? 's' : ''}`
        : `<i data-lucide="save"></i> Save Changes`;
      if (window.lucide) lucide.createIcons({ nodes: [btn] });
    }
  },

  async _saveAllConfig() {
    const inputs = document.querySelectorAll('.cfg-input');
    const updates = [];
    inputs.forEach(inp => {
      if (inp.value && inp.value !== (inp.dataset.original || '')) {
        updates.push({ category: inp.dataset.category, key: inp.dataset.key, value: inp.value });
      }
    });

    if (!updates.length) { Toast.info('No changes to save'); return; }

    UI.confirm('Save Configuration', `You are about to update <strong>${updates.length}</strong> configuration value${updates.length !== 1 ? 's' : ''}. This will take effect immediately.`, async () => {
      try {
        for (const u of updates) await API.updateConfig(u.category, u.key, u.value);
        Toast.success(`${updates.length} configuration value${updates.length !== 1 ? 's' : ''} saved successfully`);
        Pages.config(document.getElementById('page-content'));
      } catch (e) { Toast.error(e.message); }
    }, 'success');
  },




  // ═══════════════════════════════════════════════════════════════════════════
  // IPN ENDPOINTS — Advanced Card-Based UI
  // ═══════════════════════════════════════════════════════════════════════════

  _IPN_EVENTS: [
    'payment.success', 'payment.failed', 'payment.expired', 'payment.cancelled',
    'refund.requested', 'refund.approved', 'refund.rejected',
    'bill.created', 'bill.cancelled'
  ],

  // Store endpoint data in memory to avoid inline JSON in HTML attributes
  _ipnEndpointData: new Map(),

  async _loadRecentIpnActivity() {
    const feed = document.getElementById('recent-ipn-feed');
    if (!feed) return;
    try {
      const res = await API.getRecentDeliveries();
      const items = res.data || [];
      if (items.length === 0) {
        feed.innerHTML = '<div style="padding:24px;text-align:center;color:#94a3b8;font-size:13px"><i data-lucide="inbox" style="width:32px;height:32px;margin:0 auto 8px;display:block;opacity:.4"></i>No recent activity</div>';
        if (window.lucide) lucide.createIcons();
        return;
      }
      feed.innerHTML = items.map(d => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:12px">
          <span style="width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${d.status === 'delivered' ? '#10b981' : '#ef4444'}"></span>
          <code style="background:#f1f5f9;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;color:#334155">${d.event_type}</code>
          <span style="color:#94a3b8;font-size:10px;margin-left:auto">${formatDate(d.created_at)}</span>
          <span style="font-size:9px;padding:2px 6px;border-radius:4px;font-weight:600;background:${d.status === 'delivered' ? '#dcfce7' : '#fee2e2'};color:${d.status === 'delivered' ? '#16a34a' : '#dc2626'}">${d.status}</span>
        </div>
      `).join('');
    } catch (e) {
      feed.innerHTML = '<div style="padding:24px;text-align:center;color:#ef4444;font-size:13px">Error loading activity</div>';
    }
  },

  async _loadDashboardIpnActivity() {
    const feed = document.getElementById('dash-ipn-feed');
    if (!feed) return;
    try {
      const res = await API.getRecentDeliveries();
      const items = res.data || [];
      if (items.length === 0) {
        feed.innerHTML = '<div style="padding:24px;text-align:center;color:#94a3b8;font-size:13px"><i data-lucide="inbox" style="width:32px;height:32px;margin:0 auto 8px;display:block;opacity:.4"></i>No recent IPN deliveries</div>';
        if (window.lucide) lucide.createIcons();
        return;
      }
      feed.innerHTML = items.map(d => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:12px">
          <span style="width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${d.status === 'delivered' ? '#10b981' : '#ef4444'}"></span>
          <code style="background:#f1f5f9;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;color:#334155">${d.event_type}</code>
          <span style="color:#94a3b8;font-size:10px;margin-left:auto">${formatDate(d.created_at)}</span>
          <span style="font-size:9px;padding:2px 6px;border-radius:4px;font-weight:600;background:${d.status === 'delivered' ? '#dcfce7' : '#fee2e2'};color:${d.status === 'delivered' ? '#16a34a' : '#dc2626'}">${d.status}</span>
        </div>
      `).join('');
    } catch (e) {
      feed.innerHTML = '<div style="padding:24px;text-align:center;color:#ef4444;font-size:13px">Error loading IPN activity</div>';
    }
  },

  async ipn(container) {
    try {
      container.innerHTML = Components.renderSkeleton();
      const [endpointsResp, servicesResp] = await Promise.all([
        API.getAllIpnEndpoints(),
        API.getServices({ limit: 100, offset: 0 }),
      ]);
      const endpoints = endpointsResp.data || [];
      const services = servicesResp.data || [];
      const serviceMap = Object.fromEntries(services.map(s => [s.id, s]));
      Pages._renderIpnPage(container, endpoints, services, serviceMap);
    } catch (e) { container.innerHTML = Components.renderError(e.message); }
  },

  _renderIpnPage(container, endpoints, services, serviceMap) {
    // Store endpoint data for later use (avoids inline JSON in HTML)
    Pages._ipnEndpointData.clear();
    endpoints.forEach(ep => Pages._ipnEndpointData.set(ep.id, ep));

    const totalEp = endpoints.length;
    const activeEp = endpoints.filter(e => e.is_active).length;
    const unhealthyEp = endpoints.filter(e => e.failure_count > 0).length;
    const healthyEp = activeEp - unhealthyEp;

    const epCards = endpoints.length === 0
      ? `<div style="padding:48px 24px;text-align:center;color:#94a3b8">
           <i data-lucide="webhook" style="width:48px;height:48px;margin:0 auto 16px;display:block;opacity:.3"></i>
           <div style="font-size:15px;font-weight:600;margin-bottom:4px;color:#64748b">No IPN Endpoints</div>
           <div style="font-size:13px">Create your first webhook endpoint to start receiving payment notifications.</div>
         </div>`
      : endpoints.map(ep => {
        const svc = serviceMap[ep.service_id];
        const isHealthy = ep.failure_count === 0;
        const sColor = !ep.is_active ? '#94a3b8' : isHealthy ? '#10b981' : '#f59e0b';
        const sLabel = !ep.is_active ? 'Inactive' : isHealthy ? 'Healthy' : 'Degraded';
        const secPrev = ep.secret ? ep.secret.slice(0,8) + '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';

        return `
        <div class="ipn-endpoint-card" data-ipn-id="${ep.id}" style="border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;background:white;transition:box-shadow .2s"
             onmouseover="this.style.boxShadow='0 4px 24px rgba(0,0,0,.06)'" onmouseout="this.style.boxShadow='none'">
          <!-- Header -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #f1f5f9;background:#fafbfc;flex-wrap:wrap;gap:8px">
            <div style="display:flex;align-items:center;gap:12px;min-width:0">
              <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,${sColor}15,${sColor}08);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <i data-lucide="webhook" style="width:18px;height:18px;color:${sColor}"></i>
              </div>
              <div style="min-width:0">
                <div style="font-weight:700;font-size:14px;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${svc?.display_name || 'Unknown Service'}</div>
                <code style="font-size:10px;color:#64748b;background:#f1f5f9;padding:1px 6px;border-radius:4px">${svc?.slug || ep.service_id.slice(0,8)}</code>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
              <span style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;background:${sColor}12;color:${sColor}">
                <span style="width:6px;height:6px;border-radius:50%;background:${sColor}"></span>
                ${sLabel}
              </span>
              ${ep.failure_count > 0 ? '<span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;background:#fee2e2;color:#dc2626">' + ep.failure_count + ' fail' + (ep.failure_count > 1 ? 's' : '') + '</span>' : ''}
            </div>
          </div>

          <!-- Body -->
          <div style="padding:16px 20px">
            <!-- URL -->
            <div style="margin-bottom:14px">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;margin-bottom:6px">Webhook URL</div>
              <div style="display:flex;align-items:center;gap:8px">
                <code style="flex:1;font-size:12px;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#334155;min-width:0">${ep.url}</code>
                <button class="btn btn-ghost sm ipn-action-btn" data-action="edit" data-ipn-id="${ep.id}" title="Edit endpoint" style="padding:6px;border-radius:8px;flex-shrink:0">
                  <i data-lucide="edit-3" style="width:14px;height:14px"></i>
                </button>
                <button class="btn btn-ghost sm ipn-action-btn" data-action="copy-url" data-ipn-id="${ep.id}" title="Copy URL" style="padding:6px;border-radius:8px;flex-shrink:0">
                  <i data-lucide="copy" style="width:14px;height:14px"></i>
                </button>
              </div>
            </div>

            <!-- Secret -->
            <div style="margin-bottom:14px">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;margin-bottom:6px">Webhook Secret</div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <div style="flex:1;display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;min-width:0">
                  <i data-lucide="key" style="width:14px;height:14px;color:#94a3b8;flex-shrink:0"></i>
                  <code id="secret-${ep.id}" style="font-size:11px;color:#334155;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${secPrev}</code>
                </div>
                <div style="display:flex;gap:4px;flex-shrink:0">
                  <button class="btn btn-ghost sm ipn-action-btn" data-action="toggle-secret" data-ipn-id="${ep.id}" title="Reveal / Hide" style="padding:6px;border-radius:8px">
                    <i data-lucide="eye" style="width:14px;height:14px"></i>
                  </button>
                  <button class="btn btn-ghost sm ipn-action-btn" data-action="copy-secret" data-ipn-id="${ep.id}" title="Copy secret" style="padding:6px;border-radius:8px">
                    <i data-lucide="copy" style="width:14px;height:14px"></i>
                  </button>
                  <button class="btn btn-ghost sm ipn-action-btn" data-action="regenerate-secret" data-ipn-id="${ep.id}" title="Regenerate secret" style="padding:6px;border-radius:8px;color:#f59e0b">
                    <i data-lucide="refresh-cw" style="width:14px;height:14px"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Events -->
            <div style="margin-bottom:14px">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;margin-bottom:6px">Subscribed Events</div>
              <div style="display:flex;flex-wrap:wrap;gap:5px">
                ${(ep.events||[]).map(e => {
                  const cat = e.split('.')[0];
                  const cc = { payment: '#3b82f6', refund: '#8b5cf6', bill: '#f59e0b' }[cat] || '#64748b';
                  return '<span style="font-size:10px;font-weight:600;padding:3px 8px;border-radius:6px;background:' + cc + '10;color:' + cc + ';border:1px solid ' + cc + '20">' + e + '</span>';
                }).join('')}
              </div>
            </div>

            <!-- Health info -->
            ${ep.last_success_at || ep.last_failure_at ? `
            <div style="display:flex;gap:16px;padding:10px 14px;background:#f8fafc;border-radius:8px;margin-bottom:14px;flex-wrap:wrap">
              ${ep.last_success_at ? '<div style="font-size:11px;color:#64748b"><span style="color:#10b981;font-weight:600">Last success:</span> ' + formatDate(ep.last_success_at) + '</div>' : ''}
              ${ep.last_failure_at ? '<div style="font-size:11px;color:#64748b"><span style="color:#ef4444;font-weight:600">Last failure:</span> ' + formatDate(ep.last_failure_at) + '</div>' : ''}
            </div>` : ''}

            <!-- Endpoint ID -->
            <div style="display:flex;align-items:center;gap:8px;font-size:10px;color:#94a3b8;flex-wrap:wrap">
              <span>ID:</span>
              <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:9px">${ep.id}</code>
              <span style="margin-left:auto">Created ${formatDate(ep.created_at)}</span>
            </div>
          </div>

          <!-- Footer Actions -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid #f1f5f9;background:#fafbfc;flex-wrap:wrap;gap:8px">
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="ipn-action-btn" data-action="edit" data-ipn-id="${ep.id}"
                style="font-size:11px;font-weight:600;padding:6px 12px;border-radius:8px;border:1px solid #e2e8f0;background:white;cursor:pointer;display:flex;align-items:center;gap:4px;color:#334155;transition:all .15s"
                onmouseover="this.style.borderColor='#0d9488';this.style.color='#0d9488'" onmouseout="this.style.borderColor='#e2e8f0';this.style.color='#334155'">
                <i data-lucide="settings" style="width:12px;height:12px"></i> Configure
              </button>
              <button class="ipn-action-btn" data-action="test" data-ipn-id="${ep.id}"
                style="font-size:11px;font-weight:600;padding:6px 12px;border-radius:8px;border:1px solid #e2e8f0;background:white;cursor:pointer;display:flex;align-items:center;gap:4px;color:#334155;transition:all .15s"
                onmouseover="this.style.borderColor='#eab308';this.style.color='#eab308'" onmouseout="this.style.borderColor='#e2e8f0';this.style.color='#334155'">
                <i data-lucide="zap" style="width:12px;height:12px"></i> Test Ping
              </button>
              <button class="ipn-action-btn" data-action="deliveries" data-ipn-id="${ep.id}"
                style="font-size:11px;font-weight:600;padding:6px 12px;border-radius:8px;border:1px solid #e2e8f0;background:white;cursor:pointer;display:flex;align-items:center;gap:4px;color:#334155;transition:all .15s"
                onmouseover="this.style.borderColor='#3b82f6';this.style.color='#3b82f6'" onmouseout="this.style.borderColor='#e2e8f0';this.style.color='#334155'">
                <i data-lucide="bar-chart-2" style="width:12px;height:12px"></i> Deliveries
              </button>
            </div>
            <button class="ipn-action-btn" data-action="delete" data-ipn-id="${ep.id}"
              style="font-size:11px;font-weight:600;padding:6px 12px;border-radius:8px;border:1px solid #fee2e2;background:white;cursor:pointer;display:flex;align-items:center;gap:4px;color:#ef4444;transition:all .15s"
              onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='white'">
              <i data-lucide="trash-2" style="width:12px;height:12px"></i> Delete
            </button>
          </div>
        </div>`;
      }).join('');

    container.innerHTML = `
      ${Components.renderPageHeader('IPN Endpoints', 'Webhook notification endpoints \u2014 manage URLs, secrets, events & delivery health',
        '<button class="btn btn-primary" id="add-ipn-btn"><i data-lucide="plus"></i> Add Endpoint</button>')}

      <!-- Stats -->
      <div class="ipn-stats-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px">
        ${Components.renderStatCard('Total Endpoints', totalEp, 'server', 'primary')}
        ${Components.renderStatCard('Active', activeEp, 'check-circle', 'emerald')}
        ${Components.renderStatCard('Healthy', healthyEp, 'heart-pulse', 'emerald')}
        ${Components.renderStatCard('Unhealthy', unhealthyEp, 'alert-triangle', unhealthyEp > 0 ? 'danger' : 'emerald')}
      </div>

      <!-- Endpoint Cards (full width) -->
      <div id="ipn-cards-container" style="display:flex;flex-direction:column;gap:16px">${epCards}</div>
    `;

    // Attach event delegation for all IPN action buttons
    const cardsContainer = document.getElementById('ipn-cards-container');
    if (cardsContainer) {
      cardsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.ipn-action-btn');
        if (!btn) return;
        const action = btn.dataset.action;
        const id = btn.dataset.ipnId;
        const ep = Pages._ipnEndpointData.get(id);
        if (!ep) return;

        switch (action) {
          case 'edit':
            Pages._editIpnModal(id, ep.url, ep.events, ep.is_active);
            break;
          case 'copy-url':
            navigator.clipboard.writeText(ep.url).then(() => Toast.success('URL copied!'));
            break;
          case 'toggle-secret':
            Pages._toggleIpnSecret(id, ep.secret);
            break;
          case 'copy-secret':
            navigator.clipboard.writeText(ep.secret).then(() => Toast.success('Secret copied!'));
            break;
          case 'regenerate-secret':
            Pages._regenerateIpnSecret(id);
            break;
          case 'test':
            Pages._testIpnEndpoint(id);
            break;
          case 'deliveries':
            Pages._viewIpnDeliveries(id, ep.url);
            break;
          case 'delete':
            Pages._deleteIpnEndpoint(id);
            break;
        }
      });
    }

    container.__ipnServices = services;
    document.getElementById('add-ipn-btn')?.addEventListener('click', () => Pages._addIpnModal(services));
    if (window.lucide) lucide.createIcons();
  },

  _addIpnModal(services) {
    Modal.show('Add IPN Endpoint', `
      <form id="add-ipn-form">
        <div class="form-group">
          <label class="form-label">Service</label>
          <select id="ipn-svc" class="form-input">
            ${services.map(s => '<option value="' + s.id + '">' + s.display_name + ' (' + s.slug + ')</option>').join('')}
          </select>
        </div>
        ${Components.renderInput('ipn-url', 'Webhook URL', 'url', 'https://yourapp.com/api/webhook', '', true)}
        <div class="form-group">
          <label class="form-label">Events</label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            ${Pages._IPN_EVENTS.map(ev => {
              const cat = ev.split('.')[0];
              const cc = { payment: '#3b82f6', refund: '#8b5cf6', bill: '#f59e0b' }[cat] || '#64748b';
              return '<label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;transition:all .15s;font-size:12px;font-weight:500"><input type="checkbox" name="ipn-events" value="' + ev + '" checked style="accent-color:' + cc + '"><span style="color:' + cc + ';font-weight:600">' + ev + '</span></label>';
            }).join('')}
          </div>
        </div>
        <div id="add-ipn-error" class="form-error hidden"></div>
      </form>
    `, [
      '<button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>',
      '<button class="btn btn-primary" onclick="Pages._submitAddIpn()"><i data-lucide="plus"></i> Create Endpoint</button>'
    ]);
  },

  async _submitAddIpn() {
    const errEl = document.getElementById('add-ipn-error');
    errEl.classList.add('hidden');
    const events = [...document.querySelectorAll('input[name="ipn-events"]:checked')].map(e => e.value);
    if (!events.length) { errEl.textContent = 'Select at least one event'; errEl.classList.remove('hidden'); return; }
    try {
      const res = await API.createIpnEndpoint({
        service_id: document.getElementById('ipn-svc').value,
        url: document.getElementById('ipn-url').value,
        events,
      });
      Modal.close();
      Modal.show('\uD83D\uDD11 Webhook Secret Created', `
        <div style="background:linear-gradient(135deg,#fef3c7,#fffbeb);border:1px solid #fde68a;border-radius:10px;padding:16px;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <i data-lucide="alert-triangle" style="width:16px;height:16px;color:#d97706"></i>
            <strong style="color:#92400e;font-size:13px">Save this secret now \u2014 it can be viewed later from the dashboard.</strong>
          </div>
          <div style="font-size:12px;color:#78350f">Use this to verify the <code style="background:#fde68a;padding:1px 4px;border-radius:3px">X-Trialvo-Pay-Signature</code> header on your server.</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;background:#f1f5f9;padding:14px 16px;border-radius:10px;border:1px solid #e2e8f0">
          <i data-lucide="key" style="width:16px;height:16px;color:#0d9488;flex-shrink:0"></i>
          <code style="font-size:13px;word-break:break-all;flex:1;font-weight:600;color:#0f172a">${res.secret}</code>
          <button class="btn btn-ghost sm" id="copy-new-secret-btn">
            <i data-lucide="copy"></i> Copy
          </button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px;font-size:12px">
          <div style="padding:10px 14px;background:#f8fafc;border-radius:8px"><span style="color:#94a3b8">Endpoint ID</span><br><code style="font-size:10px">${res.id}</code></div>
          <div style="padding:10px 14px;background:#f8fafc;border-radius:8px"><span style="color:#94a3b8">URL</span><br><code style="font-size:10px;word-break:break-all">${res.url}</code></div>
        </div>
      `, [
        '<button class="btn btn-primary" id="done-secret-btn">Done \u2014 I saved my secret</button>'
      ]);
      if (window.lucide) lucide.createIcons();
      document.getElementById('copy-new-secret-btn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(res.secret).then(() => Toast.success('Copied!'));
      });
      document.getElementById('done-secret-btn')?.addEventListener('click', () => {
        Modal.close();
        Pages.ipn(document.getElementById('page-content'));
      });
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('hidden');
    }
  },

  _editIpnModal(id, url, events, isActive) {
    if (typeof events === 'string') { try { events = JSON.parse(events); } catch(_) { events = []; } }
    Modal.show('Configure Endpoint', `
      <form id="edit-ipn-form">
        <div style="margin-bottom:16px">
          <label style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-bottom:6px;display:block">Webhook URL</label>
          <input id="edit-ipn-url" type="url" value="${url}" required
            style="width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:13px;font-family:inherit;outline:none;transition:border-color .15s;box-sizing:border-box"
            onfocus="this.style.borderColor='#0d9488'" onblur="this.style.borderColor='#e2e8f0'" />
        </div>
        <div style="margin-bottom:16px">
          <label style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-bottom:6px;display:block">Subscribed Events</label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            ${Pages._IPN_EVENTS.map(ev => {
              const cat = ev.split('.')[0];
              const cc = { payment: '#3b82f6', refund: '#8b5cf6', bill: '#f59e0b' }[cat] || '#64748b';
              const chk = events.includes(ev);
              return '<label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid ' + (chk ? cc + '40' : '#e2e8f0') + ';border-radius:8px;cursor:pointer;transition:all .15s;font-size:12px;background:' + (chk ? cc + '08' : 'transparent') + '"><input type="checkbox" name="edit-ipn-events" value="' + ev + '" ' + (chk ? 'checked' : '') + ' style="accent-color:' + cc + '"><span style="color:' + cc + ';font-weight:600">' + ev + '</span></label>';
            }).join('')}
          </div>
        </div>
        <div style="margin-bottom:16px">
          <label style="display:flex;align-items:center;gap:10px;padding:12px 16px;border:1px solid ${isActive ? '#10b98140' : '#e2e8f0'};border-radius:10px;cursor:pointer;background:${isActive ? '#10b98108' : '#f8fafc'};transition:all .15s">
            <input type="checkbox" id="edit-ipn-active" ${isActive ? 'checked' : ''} style="accent-color:#10b981;width:16px;height:16px">
            <div>
              <div style="font-weight:600;font-size:13px;color:#0f172a">Active</div>
              <div style="font-size:11px;color:#64748b">Uncheck to pause webhook deliveries</div>
            </div>
          </label>
        </div>
        <div id="edit-ipn-error" class="form-error hidden"></div>
      </form>
    `, [
      '<div style="display:flex;justify-content:space-between;width:100%;gap:12px;flex-wrap:wrap"><button class="btn btn-ghost danger" id="rotate-secret-btn"><i data-lucide="refresh-cw"></i> Rotate Secret</button><div style="display:flex;gap:8px"><button class="btn btn-ghost" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" id="save-edit-ipn-btn"><i data-lucide="save"></i> Save Changes</button></div></div>'
    ]);
    if (window.lucide) lucide.createIcons();
    // Attach event listeners via JS instead of inline
    document.getElementById('save-edit-ipn-btn')?.addEventListener('click', () => Pages._submitEditIpn(id));
    document.getElementById('rotate-secret-btn')?.addEventListener('click', () => Pages._rotateIpnSecret(id));
  },

  async _submitEditIpn(id) {
    const errEl = document.getElementById('edit-ipn-error');
    errEl.classList.add('hidden');
    const events = [...document.querySelectorAll('input[name="edit-ipn-events"]:checked')].map(e => e.value);
    if (!events.length) { errEl.textContent = 'Select at least one event'; errEl.classList.remove('hidden'); return; }
    try {
      await API.updateIpnEndpoint(id, {
        url: document.getElementById('edit-ipn-url').value,
        events,
        is_active: document.getElementById('edit-ipn-active').checked,
      });
      Modal.close();
      Toast.success('Endpoint updated successfully');
      Pages.ipn(document.getElementById('page-content'));
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('hidden');
    }
  },

  async _testIpnEndpoint(id) {
    Toast.info('Sending test ping\u2026');
    try {
      const res = await API.testIpnEndpoint(id);
      
      const statusClass = res.success ? 'badge-success' : 'badge-danger';
      const statusIcon = res.success ? 'check-circle' : 'x-circle';
      const statusTitle = res.success ? 'Ping Successful' : 'Ping Failed';

      // Try to parse response body if it's JSON
      let parsedBody = null;
      let jsonRows = '';
      if (res.response_body) {
        try {
          parsedBody = JSON.parse(res.response_body);
          if (parsedBody && typeof parsedBody === 'object') {
            jsonRows = Object.entries(parsedBody).map(([k, v]) => {
              const val = typeof v === 'object' ? JSON.stringify(v) : v;
              return Components.renderDetailRow(
                k.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), 
                `<span style="font-weight:600; color:var(--color-primary)">${val}</span>`
              );
            }).join('');
          }
        } catch (e) { /* Not JSON */ }
      }

      Modal.show('Test Ping Result', `
        <div class="svc-detail-header">
          <div class="svc-detail-avatar ${res.success ? 'svc-avatar-primary' : 'svc-avatar-rose'}">
            <i data-lucide="${statusIcon}" style="width:24px;height:24px;color:white"></i>
          </div>
          <div class="svc-detail-info">
            <div class="svc-detail-name">${statusTitle}</div>
            <div class="svc-detail-meta">
              <span class="badge ${statusClass}">HTTP ${res.http_status || 'Error'}</span>
            </div>
          </div>
        </div>
        
        <div class="detail-grid">
          ${Components.renderDetailRow('Target URL', `<code style="word-break:break-all; font-size:11px">${res.endpoint_url || '—'}</code>`)}
          ${res.error ? Components.renderDetailRow('Connection Error', `<span style="color:var(--color-danger); font-weight:600">${res.error}</span>`) : ''}
          ${Components.renderDetailRow('Success Status', res.success ? '<span class="text-success font-bold">✅ Yes</span>' : '<span class="text-danger font-bold">❌ No</span>')}
        </div>

        ${jsonRows ? `
          <div class="section-header" style="margin-top:20px">
            <div class="section-title"><i data-lucide="info"></i> Response Summary</div>
          </div>
          <div class="detail-grid" style="background:var(--color-surface-2); padding:12px; border-radius:12px; border:1px solid var(--color-border)">
            ${jsonRows}
          </div>
        ` : ''}

        <div class="section-header" style="margin-top:20px">
          <div class="section-title"><i data-lucide="code"></i> Raw Response Body</div>
        </div>
        <div class="tx-json-viewer" style="background:var(--color-surface-3); padding: 12px; border: 1px solid var(--color-border); border-radius: 8px; max-height:200px; overflow-y:auto">
          <pre style="color:var(--color-text); white-space: pre-wrap; font-size: 12px; font-family:var(--font-mono)">${res.response_body || 'No response body'}</pre>
        </div>
      `);
      
      if (window.lucide) lucide.createIcons();
      Pages.ipn(document.getElementById('page-content'));
    } catch (e) { Toast.error(e.message); }
  },

  async _rotateIpnSecret(id) {
    UI.confirm('Rotate Webhook Secret', 'Old secret will stop working immediately. Make sure to update your application with the new secret.', async () => {
      try {
        const res = await API.rotateIpnSecret(id);
        Modal.show('\uD83D\uDD11 New Webhook Secret', `
          <div style="background:linear-gradient(135deg,#fef3c7,#fffbeb);border:1px solid #fde68a;border-radius:10px;padding:16px;margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:8px">
              <i data-lucide="alert-triangle" style="width:16px;height:16px;color:#d97706"></i>
              <strong style="color:#92400e;font-size:13px">Save this now! The old secret has been invalidated.</strong>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;background:#f1f5f9;padding:14px 16px;border-radius:10px;border:1px solid #e2e8f0">
            <i data-lucide="key" style="width:16px;height:16px;color:#0d9488;flex-shrink:0"></i>
            <code style="font-size:13px;word-break:break-all;flex:1;font-weight:600;color:#0f172a">${res.new_secret}</code>
            <button class="btn btn-ghost sm" id="copy-rotated-secret-btn">
              <i data-lucide="copy"></i>
            </button>
          </div>
        `, ['<button class="btn btn-primary" id="done-rotated-secret-btn">Done \u2014 I saved my secret</button>']);
        if (window.lucide) lucide.createIcons();
        document.getElementById('copy-rotated-secret-btn')?.addEventListener('click', () => {
          navigator.clipboard.writeText(res.new_secret).then(() => Toast.success('Copied!'));
        });
        document.getElementById('done-rotated-secret-btn')?.addEventListener('click', () => {
          Modal.close();
          Pages.ipn(document.getElementById('page-content'));
        });
      } catch (e) { Toast.error(e.message); }
    }, 'danger');
  },

  _toggleIpnSecret(id, secret) {
    const el = document.getElementById('secret-' + id);
    if (!el) return;
    if (el.dataset.revealed === 'true') {
      el.textContent = secret.slice(0,8) + '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';
      el.dataset.revealed = 'false';
    } else {
      el.textContent = secret;
      el.dataset.revealed = 'true';
    }
  },

  async _regenerateIpnSecret(id) {
    UI.confirm('Regenerate Webhook Secret', 'The old secret will stop working immediately. Update your application with the new secret.', async () => {
      try {
        const res = await API.rotateIpnSecret(id);
        Modal.show('\uD83D\uDD11 New Webhook Secret', `
          <div style="background:linear-gradient(135deg,#fef3c7,#fffbeb);border:1px solid #fde68a;border-radius:10px;padding:16px;margin-bottom:16px">
            <strong style="color:#92400e;font-size:13px">Update your application with this new secret.</strong>
          </div>
          <div style="display:flex;align-items:center;gap:8px;background:#f1f5f9;padding:14px 16px;border-radius:10px;border:1px solid #e2e8f0">
            <i data-lucide="key" style="width:16px;height:16px;color:#0d9488;flex-shrink:0"></i>
            <code style="font-size:13px;word-break:break-all;flex:1;font-weight:600">${res.new_secret}</code>
            <button class="btn btn-ghost sm" id="copy-regen-secret-btn">
              <i data-lucide="copy"></i>
            </button>
          </div>
        `, ['<button class="btn btn-primary" id="done-regen-secret-btn">Done</button>']);
        if (window.lucide) lucide.createIcons();
        document.getElementById('copy-regen-secret-btn')?.addEventListener('click', () => {
          navigator.clipboard.writeText(res.new_secret).then(() => Toast.success('Copied!'));
        });
        document.getElementById('done-regen-secret-btn')?.addEventListener('click', () => {
          Modal.close();
          Pages.ipn(document.getElementById('page-content'));
        });
      } catch (e) { Toast.error(e.message); }
    }, 'danger');
  },

  async _deleteIpnEndpoint(id) {
    UI.confirm('Delete IPN Endpoint', 'This action cannot be undone. All delivery history for this endpoint will be lost.', async () => {
      try {
        await API.deleteIpnEndpoint(id);
        Toast.success('Endpoint deleted');
        Pages.ipn(document.getElementById('page-content'));
      } catch (e) { Toast.error(e.message); }
    }, 'danger');
  },

  async _viewIpnDeliveries(endpointId, url) {
    try {
      const res = await API.getIpnDeliveries(endpointId);
      const deliveries = res.data || [];

      const dCards = deliveries.length === 0
        ? '<div style="padding:32px;text-align:center;color:#94a3b8;font-size:13px"><i data-lucide="inbox" style="width:32px;height:32px;display:block;margin:0 auto 8px;opacity:.3"></i>No deliveries recorded yet.</div>'
        : deliveries.map(d => {
          const isOk = d.status === 'delivered';
          const sc = isOk ? '#10b981' : d.status === 'exhausted' ? '#ef4444' : '#f59e0b';
          return `
          <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:8px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="width:8px;height:8px;border-radius:50%;background:${sc}"></span>
                <code style="font-size:11px;font-weight:600;background:#f1f5f9;padding:2px 8px;border-radius:5px">${d.event_type}</code>
                <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px;background:${sc}15;color:${sc}">${d.status}</span>
              </div>
              <span style="font-size:10px;color:#94a3b8">${formatDate(d.created_at)}</span>
            </div>
            <div style="display:flex;gap:12px;font-size:11px;color:#64748b;flex-wrap:wrap">
              <span>Attempts: <strong>${d.attempt_count}/${d.max_attempts}</strong></span>
              ${d.http_status ? '<span>HTTP: <strong>' + d.http_status + '</strong></span>' : ''}
              ${d.error_message ? '<span style="color:#ef4444">Error: ' + d.error_message.slice(0,60) + '</span>' : ''}
            </div>
            ${!isOk ? '<div style="margin-top:8px"><button class="btn btn-ghost sm ipn-retry-btn" data-delivery-id="' + d.id + '" data-ep-id="' + endpointId + '" style="font-size:10px;padding:4px 10px;border-radius:6px;border:1px solid #e2e8f0"><i data-lucide="refresh-cw" style="width:10px;height:10px"></i> Retry</button></div>' : ''}
          </div>`;
        }).join('');

      Modal.show('Delivery Logs', `
        <div style="margin-bottom:12px;padding:10px 14px;background:#f8fafc;border-radius:8px;font-size:11px;color:#64748b">
          <strong style="color:#0f172a">Endpoint:</strong> <code style="font-size:10px;word-break:break-all">${url}</code>
          <span style="margin-left:12px"><strong>${deliveries.length}</strong> deliveries</span>
        </div>
        <div id="delivery-list" style="max-height:460px;overflow-y:auto">${dCards}</div>
      `, ['<button class="btn btn-ghost" onclick="Modal.close()">Close</button>']);
      if (window.lucide) lucide.createIcons();
      // Attach retry event listeners
      document.getElementById('delivery-list')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.ipn-retry-btn');
        if (!btn) return;
        Pages._retryIpnDelivery(btn.dataset.deliveryId, btn.dataset.epId, url);
      });
    } catch (e) { Toast.error(e.message); }
  },

  async _retryIpnDelivery(deliveryId, endpointId, url) {
    try {
      Toast.info('Retrying delivery\u2026');
      await API.retryIpnDelivery(deliveryId);
      Toast.success('Retry attempt initiated');
      Pages._viewIpnDeliveries(endpointId, url);
    } catch (e) { Toast.error(e.message); }
  },

  async audit(container) {
    let page = 1, limit = 50, actionFilter = '', actorFilter = '';
    const load = async () => {
      const offset = (page - 1) * limit;
      const data = await API.getAuditLogs({ limit, offset });
      const items = data.data || data.logs || data;
      renderList(items, data.total || items.length);
    };

    const actionColors = {
      create: 'success', created: 'success',
      update: 'info', updated: 'info',
      delete: 'danger', deleted: 'danger',
      login: 'brand', logout: 'warning',
      approve: 'success', reject: 'danger',
      block: 'danger', unblock: 'success',
      generate: 'info', revoke: 'danger', rotate: 'warning',
    };

    const getActionColor = (action) => {
      const lower = (action || '').toLowerCase();
      for (const [key, color] of Object.entries(actionColors)) {
        if (lower.includes(key)) return color;
      }
      return 'default';
    };

    const renderList = (logs, total) => {
      // Filter locally if filters are set
      let filtered = logs;
      if (actionFilter) filtered = filtered.filter(l => (l.action || '').toLowerCase().includes(actionFilter.toLowerCase()));
      if (actorFilter) filtered = filtered.filter(l => (l.actor_email || l.actor || '').toLowerCase().includes(actorFilter.toLowerCase()));

      const uniqueActors = [...new Set(logs.map(l => l.actor_email || l.actor || l.actor_id || 'System'))].length;
      const today = new Date().toDateString();
      const todayCount = logs.filter(l => new Date(l.created_at).toDateString() === today).length;

      container.innerHTML = `
        ${Components.renderPageHeader('Audit Logs', `${total.toLocaleString()} log entries`,
          `<div style="display:flex;gap:8px">
            <button class="btn btn-ghost sm" onclick="Pages.audit(document.getElementById('page-content'))" title="Refresh">
              <i data-lucide="refresh-cw"></i>
            </button>
            <button class="btn btn-ghost sm" id="export-audit-csv">
              <i data-lucide="download"></i> Export
            </button>
          </div>`)}
        <div class="tx-stats-bar">
          <div class="tx-stat-mini">
            <div class="tx-stat-mini-icon brand"><i data-lucide="scroll-text"></i></div>
            <div class="tx-stat-mini-body">
              <div class="tx-stat-mini-value">${total.toLocaleString()}</div>
              <div class="tx-stat-mini-label">Total Logs</div>
            </div>
          </div>
          <div class="tx-stat-mini">
            <div class="tx-stat-mini-icon success"><i data-lucide="calendar-check"></i></div>
            <div class="tx-stat-mini-body">
              <div class="tx-stat-mini-value">${todayCount}</div>
              <div class="tx-stat-mini-label">Today</div>
            </div>
          </div>
          <div class="tx-stat-mini">
            <div class="tx-stat-mini-icon info"><i data-lucide="users"></i></div>
            <div class="tx-stat-mini-body">
              <div class="tx-stat-mini-value">${uniqueActors}</div>
              <div class="tx-stat-mini-label">Unique Actors</div>
            </div>
          </div>
        </div>
        ${Components.renderFilterBar([
          { id: 'audit-action', type: 'search', placeholder: 'Filter by action...',
            onChange: `actionFilter=this.value;load()` },
          { id: 'audit-actor', type: 'search', placeholder: 'Filter by actor...',
            onChange: `actorFilter=this.value;load()` },
        ])}
        <div class="card">
          ${Components.renderTable(
            [
              { label: 'Action', key: 'action' },
              { label: 'Actor', key: 'actor' },
              { label: 'Resource', key: 'resource' },
              { label: 'IP Address', key: 'ip' },
              { label: 'Time', key: 'time' },
              { label: '', key: 'detail_btn' },
            ],
            filtered.map(l => {
              const color = getActionColor(l.action);
              return {
                action: `<span class="badge badge-${color}">${l.action || '—'}</span>`,
                actor: `<div style="display:flex;flex-direction:column"><span style="font-weight:500;color:var(--color-text)">${l.actor_email || l.actor || l.actor_id?.slice(0,8) || 'System'}</span>${l.actor_role || l.actor_type ? `<span style="font-size:0.6875rem;color:var(--color-text-3)">${l.actor_role || l.actor_type}</span>` : ''}</div>`,
                resource: `<code class="code-tag sm">${l.resource_type || ''}${l.resource_id ? ':' + l.resource_id.slice(0,8) : ''}</code>`,
                ip: `<span style="font-family:var(--font-mono);font-size:0.75rem;color:var(--color-text-3)">${l.ip_address || '—'}</span>`,
                time: formatDate(l.created_at),
                detail_btn: l.details || l.changes ? `<button class="btn btn-ghost sm" onclick="Pages._viewAuditDetail(${JSON.stringify(l).replace(/"/g, '&quot;')})" title="View details"><i data-lucide="eye"></i></button>` : '',
              };
            }),
            'No audit logs found'
          )}
          ${renderPagination(page, total, limit, `(p) => { page=p; Pages.audit(document.getElementById('page-content')); }`)}
        </div>
      `;

      // CSV export
      document.getElementById('export-audit-csv')?.addEventListener('click', () => {
        UI.exportCSV('audit_logs.csv',
          [
            { label: 'Action', key: 'action' },
            { label: 'Actor', key: 'actor' },
            { label: 'Resource', key: 'resource' },
            { label: 'IP', key: 'ip' },
            { label: 'Time', key: 'time' },
          ],
          filtered.map(l => ({
            action: l.action || '',
            actor: l.actor_email || l.actor || l.actor_id || 'System',
            resource: `${l.resource_type || ''}:${l.resource_id || ''}`,
            ip: l.ip_address || '',
            time: l.created_at || '',
          }))
        );
      });

      if (window.lucide) lucide.createIcons();
    };

    try { container.innerHTML = Components.renderSkeleton(); await load(); }
    catch (e) { container.innerHTML = Components.renderError(e.message); }
  },

  _viewAuditDetail(log) {
    const detailJson = log.details || log.changes || log;
    Modal.show('Audit Log Detail', `
      <div class="detail-grid">
        ${Components.renderDetailRow('Action', `<span class="badge">${log.action || '—'}</span>`)}
        ${Components.renderDetailRow('Actor', log.actor_email || log.actor || log.actor_id || 'System')}
        ${Components.renderDetailRow('Resource', `<code>${log.resource_type || ''}:${log.resource_id || ''}</code>`)}
        ${Components.renderDetailRow('IP Address', log.ip_address || '—')}
        ${Components.renderDetailRow('User Agent', `<span style="font-size:0.75rem;word-break:break-all">${log.user_agent || '—'}</span>`)}
        ${Components.renderDetailRow('Time', formatDate(log.created_at))}
      </div>
      ${detailJson && typeof detailJson === 'object' ? `
        <div class="section-header" style="margin-top:20px">
          <div class="section-title"><i data-lucide="code"></i> Details</div>
        </div>
        <div class="tx-json-viewer">
          <pre>${JSON.stringify(detailJson, null, 2)}</pre>
        </div>
      ` : ''}
    `);
    if (window.lucide) lucide.createIcons();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMINISTRATORS
  // ═══════════════════════════════════════════════════════════════════════════

  async admins(container) {
    try {
      container.innerHTML = Components.renderSkeleton();
      const data = await API.getAdmins();
      const admins = data.data || data.admins || data;

      const _getAdminColor = (name) => {
        const colors = ['primary', 'violet', 'blue', 'amber', 'rose'];
        const hash = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        return colors[hash % colors.length];
      };

      const _getInitials = (name, email) => {
        if (name && name !== '—') {
          return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        }
        return (email || '?').slice(0, 2).toUpperCase();
      };

      const roleColors = { super_admin: 'danger', admin: 'info', viewer: 'default' };

      const activeCount = admins.filter(a => a.is_active).length;
      const twofaCount = admins.filter(a => a.is_2fa_enabled).length;

      container.innerHTML = `
        ${Components.renderPageHeader('Administrators', `${admins.length} admin accounts`,
          `<button class="btn btn-primary" id="add-admin-btn"><i data-lucide="user-plus"></i> Add Admin</button>`)}
        <div class="tx-stats-bar">
          <div class="tx-stat-mini">
            <div class="tx-stat-mini-icon brand"><i data-lucide="users"></i></div>
            <div class="tx-stat-mini-body">
              <div class="tx-stat-mini-value">${admins.length}</div>
              <div class="tx-stat-mini-label">Total Admins</div>
            </div>
          </div>
          <div class="tx-stat-mini">
            <div class="tx-stat-mini-icon success"><i data-lucide="user-check"></i></div>
            <div class="tx-stat-mini-body">
              <div class="tx-stat-mini-value">${activeCount}</div>
              <div class="tx-stat-mini-label">Active</div>
            </div>
          </div>
          <div class="tx-stat-mini">
            <div class="tx-stat-mini-icon info"><i data-lucide="shield-check"></i></div>
            <div class="tx-stat-mini-body">
              <div class="tx-stat-mini-value">${twofaCount}</div>
              <div class="tx-stat-mini-label">2FA Enabled</div>
            </div>
          </div>
        </div>
        <div class="card">
          ${Components.renderTable(
            [
              { label: 'Admin', key: 'admin' },
              { label: 'Role', key: 'role' },
              { label: '2FA', key: 'twofa' },
              { label: 'Status', key: 'status' },
              { label: 'Last Login', key: 'last_login' },
            ],
            admins.map(a => {
              const color = _getAdminColor(a.display_name || a.email);
              const initials = _getInitials(a.display_name, a.email);
              const roleColor = roleColors[a.role] || 'default';
              return {
                admin: `<div style="display:flex;align-items:center;gap:12px">
                  <div class="svc-avatar svc-avatar-${color}" style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:white">${initials}</div>
                  <div style="display:flex;flex-direction:column">
                    <span style="font-weight:600;color:var(--color-text)">${a.display_name || '—'}</span>
                    <span style="font-size:0.6875rem;color:var(--color-text-3)">${a.email}</span>
                  </div>
                </div>`,
                role: `<span class="badge badge-${roleColor}">${(a.role || '').replace(/_/g, ' ')}</span>`,
                twofa: a.is_2fa_enabled
                  ? `<div style="display:flex;align-items:center;gap:6px"><div style="width:32px;height:18px;border-radius:9px;background:var(--color-success);position:relative"><div style="width:14px;height:14px;border-radius:50%;background:white;position:absolute;top:2px;right:2px"></div></div><span style="font-size:0.75rem;color:var(--color-success)">On</span></div>`
                  : `<div style="display:flex;align-items:center;gap:6px"><div style="width:32px;height:18px;border-radius:9px;background:var(--color-border);position:relative"><div style="width:14px;height:14px;border-radius:50%;background:white;position:absolute;top:2px;left:2px"></div></div><span style="font-size:0.75rem;color:var(--color-text-3)">Off</span></div>`,
                status: statusBadge(a.is_active ? 'active' : 'inactive'),
                last_login: formatDate(a.last_login_at),
              };
            }),
            'No administrators'
          )}
        </div>
      `;
      document.getElementById('add-admin-btn')?.addEventListener('click', () => Pages._addAdminModal());
      if (window.lucide) lucide.createIcons();
    } catch (e) { container.innerHTML = Components.renderError(e.message); }
  },

  _addAdminModal() {
    Modal.show('Add Administrator', `
      <form id="add-admin-form">
        ${Components.renderInput('adm-email', 'Email', 'email', 'admin@pay.trialvo.com', '', true)}
        ${Components.renderInput('adm-name', 'Display Name', 'text', 'Admin User')}
        ${Components.renderInput('adm-pass', 'Password', 'password', '••••••••', '', true)}
        ${Components.renderSelect('adm-role', 'Role', [
          { value: 'super_admin', label: 'Super Admin' },
          { value: 'admin', label: 'Admin' },
          { value: 'viewer', label: 'Viewer' },
        ])}
        <div id="add-adm-error" class="form-error hidden"></div>
      </form>
    `, [
      `<button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>`,
      `<button class="btn btn-primary" onclick="Pages._submitAddAdmin()"><i data-lucide="user-plus"></i> Create</button>`
    ]);
  },

  async _submitAddAdmin() {
    const errEl = document.getElementById('add-adm-error');
    errEl.classList.add('hidden');
    try {
      await API.createAdmin({
        email: document.getElementById('adm-email').value,
        display_name: document.getElementById('adm-name').value,
        password: document.getElementById('adm-pass').value,
        role: document.getElementById('adm-role').value,
      });
      Modal.close();
      Toast.success('Administrator created');
      Pages.admins(document.getElementById('page-content'));
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('hidden');
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE
  // ═══════════════════════════════════════════════════════════════════════════

  async profile(container) {
    const admin = Auth.admin;
    container.innerHTML = `
      ${Components.renderPageHeader('My Profile', 'Account settings and security')}
      <div class="profile-grid">
        <div class="card">
          <div class="card-header"><h3 class="card-title"><i data-lucide="user"></i> Account Info</h3></div>
          <div class="profile-info">
            <div class="profile-avatar"><i data-lucide="user-circle-2" style="width:64px;height:64px;color:var(--color-primary)"></i></div>
            <div class="detail-grid">
              ${Components.renderDetailRow('Email', admin?.email || '—')}
              ${Components.renderDetailRow('Name', admin?.display_name || '—')}
              ${Components.renderDetailRow('Role', admin?.role ? `<span class="badge badge-info">${admin.role}</span>` : '—')}
              ${Components.renderDetailRow('2FA', admin?.is_2fa_enabled ? '<span class="badge badge-success">Enabled</span>' : '<span class="badge badge-warning">Not configured</span>')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3 class="card-title"><i data-lucide="shield"></i> Security</h3></div>
          <div class="security-actions">
            <button class="btn btn-outline" onclick="Pages._changePassword()">
              <i data-lucide="key"></i> Change Password
            </button>
            ${!admin?.is_2fa_enabled ? `
              <button class="btn btn-outline" onclick="Pages._setup2FA()">
                <i data-lucide="smartphone"></i> Enable 2FA
              </button>
            ` : `
              <div class="info-box success">
                <i data-lucide="shield-check"></i>
                Two-factor authentication is active. Your account is protected.
              </div>
            `}
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  _changePassword() {
    Modal.show('Change Password', `
      ${Components.renderInput('pw-current', 'Current Password', 'password', '')}
      ${Components.renderInput('pw-new', 'New Password', 'password', 'min 8 characters')}
      ${Components.renderInput('pw-confirm', 'Confirm New Password', 'password', '')}
      <div id="pw-error" class="form-error hidden"></div>
    `, [
      `<button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>`,
      `<button class="btn btn-primary" onclick="Pages._submitChangePassword()">Change Password</button>`
    ]);
  },

  async _submitChangePassword() {
    const newPw = document.getElementById('pw-new').value;
    const confirm = document.getElementById('pw-confirm').value;
    const errEl = document.getElementById('pw-error');
    if (newPw !== confirm) { errEl.textContent = 'Passwords do not match'; errEl.classList.remove('hidden'); return; }
    if (newPw.length < 8) { errEl.textContent = 'Password must be at least 8 characters'; errEl.classList.remove('hidden'); return; }
    try {
      await API.changePassword(document.getElementById('pw-current').value, newPw);
      Modal.close();
      Toast.success('Password changed successfully');
    } catch (e) { errEl.textContent = e.message; errEl.classList.remove('hidden'); }
  },

  async _setup2FA() {
    try {
      const res = await API.setup2FA();
      Modal.show('Enable Two-Factor Auth', `
        <p class="mb-16">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
        <div class="qr-container">${res.qr_svg || ''}</div>
        <p class="mt-16 mb-8">Or enter manually: <code class="code-tag">${res.secret_base32 || ''}</code></p>
        <hr class="divider">
        <p class="mb-8">Enter the 6-digit code to confirm:</p>
        ${Components.renderInput('verify-totp', 'TOTP Code', 'text', '000000')}
        <div id="2fa-setup-error" class="form-error hidden"></div>
      `, [
        `<button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>`,
        `<button class="btn btn-primary" onclick="Pages._confirm2FASetup()">Activate 2FA</button>`
      ]);
    } catch (e) { Toast.error(e.message); }
  },

  async _confirm2FASetup() {
    const code = document.getElementById('verify-totp')?.value;
    const errEl = document.getElementById('2fa-setup-error');
    try {
      await API.confirm2FASetup(code);
      Modal.close();
      Toast.success('2FA enabled! Your account is now more secure.');
    } catch (e) { errEl.textContent = e.message; errEl.classList.remove('hidden'); }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MERCHANTS PAGE
  // ═══════════════════════════════════════════════════════════════════════════

  async merchants(container) {
    container.innerHTML = Components.renderSkeleton();
    try {
      const [merchantsResp, servicesResp] = await Promise.all([
        API.getMerchants(),
        API.getServices(),
      ]);
      const merchants = merchantsResp.data || [];
      const services = servicesResp.data || [];

      const _getMerchantColor = (name) => {
        const colors = ['primary', 'violet', 'blue', 'amber', 'rose'];
        const hash = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        return colors[hash % colors.length];
      };

      const _getInitials = (name, email) => {
        if (name && name !== '—') {
          return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        }
        return (email || '?').slice(0, 2).toUpperCase();
      };

      const activeCount = merchants.filter(m => m.is_active).length;
      const inactiveCount = merchants.length - activeCount;

      container.innerHTML = `
        ${Components.renderPageHeader('Merchants', `${merchants.length} developer accounts`,
          `<button class="btn btn-primary" onclick="Pages._showCreateMerchant()"><i data-lucide="plus"></i> Create Merchant</button>`)}
        <div class="tx-stats-bar">
          <div class="tx-stat-mini">
            <div class="tx-stat-mini-icon brand"><i data-lucide="store"></i></div>
            <div class="tx-stat-mini-body">
              <div class="tx-stat-mini-value">${merchants.length}</div>
              <div class="tx-stat-mini-label">Total Merchants</div>
            </div>
          </div>
          <div class="tx-stat-mini">
            <div class="tx-stat-mini-icon success"><i data-lucide="check-circle"></i></div>
            <div class="tx-stat-mini-body">
              <div class="tx-stat-mini-value">${activeCount}</div>
              <div class="tx-stat-mini-label">Active</div>
            </div>
          </div>
          <div class="tx-stat-mini">
            <div class="tx-stat-mini-icon danger"><i data-lucide="x-circle"></i></div>
            <div class="tx-stat-mini-body">
              <div class="tx-stat-mini-value">${inactiveCount}</div>
              <div class="tx-stat-mini-label">Inactive</div>
            </div>
          </div>
        </div>
        <div class="card">
          ${Components.renderTable(
            [
              { label: 'Merchant', key: 'merchant' },
              { label: 'Service', key: 'service' },
              { label: 'Role', key: 'role' },
              { label: 'Status', key: 'status' },
              { label: 'Last Login', key: 'last_login' },
              { label: 'Actions', key: 'actions' },
            ],
            merchants.map(m => {
              const svc = services.find(s => s.id === m.service_id);
              const color = _getMerchantColor(m.display_name || m.email);
              const initials = _getInitials(m.display_name, m.email);
              return {
                merchant: `<div style="display:flex;align-items:center;gap:12px">
                  <div class="svc-avatar svc-avatar-${color}" style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:white">${initials}</div>
                  <div style="display:flex;flex-direction:column">
                    <span style="font-weight:600;color:var(--color-text)">${m.display_name || '—'}</span>
                    <span style="font-size:0.6875rem;color:var(--color-text-3)">${m.email}</span>
                  </div>
                </div>`,
                service: svc ? `<span class="badge badge-info">${svc.display_name}</span>` : `<code class="code-tag sm">${(m.service_id || '').substring(0,8)}</code>`,
                role: `<span class="badge badge-default">${m.role || '—'}</span>`,
                status: `<div style="display:flex;align-items:center;gap:6px;cursor:pointer" onclick="Pages._toggleMerchant('${m.id}', ${!m.is_active})" title="Click to ${m.is_active ? 'deactivate' : 'activate'}">
                  <div style="width:32px;height:18px;border-radius:9px;background:${m.is_active ? 'var(--color-success)' : 'var(--color-border)'};position:relative;transition:background 0.2s">
                    <div style="width:14px;height:14px;border-radius:50%;background:white;position:absolute;top:2px;${m.is_active ? 'right:2px' : 'left:2px'};transition:all 0.2s"></div>
                  </div>
                  <span style="font-size:0.75rem;color:${m.is_active ? 'var(--color-success)' : 'var(--color-text-3)'}">${m.is_active ? 'Active' : 'Inactive'}</span>
                </div>`,
                last_login: m.last_login_at ? formatDate(m.last_login_at) : '<span style="color:var(--color-text-3)">Never</span>',
                actions: `<button class="btn btn-ghost sm" onclick="Pages._resetMerchantPassword('${m.id}')" title="Reset Password"><i data-lucide="key"></i></button>`,
              };
            }),
            'No merchant accounts yet'
          )}
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    } catch (e) {
      container.innerHTML = Components.renderError(e.message);
    }
  },

  async _showCreateMerchant() {
    // Fetch services to pick from
    try {
      const resp = await API.getServices();
      const services = resp.data || [];
      const options = services.map(s => `<option value="${s.id}">${s.display_name} (${s.slug})</option>`).join('');

      Modal.show('Create Merchant Account', `
        <div class="form-group">
          <label>Service</label>
          <select id="m-service" class="input">${options}</select>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="m-email" class="input" placeholder="developer@company.com" required>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="m-password" class="input" placeholder="At least 8 characters" required>
        </div>
        <div class="form-group">
          <label>Display Name (optional)</label>
          <input id="m-name" class="input" placeholder="John Doe">
        </div>
      `, [
        `<button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>`,
        `<button class="btn btn-primary" onclick="Pages._createMerchant()">Create</button>`
      ]);
    } catch (e) { Toast.error(e.message); }
  },

  async _createMerchant() {
    try {
      const resp = await API.createMerchant({
        service_id: document.getElementById('m-service').value,
        email: document.getElementById('m-email').value,
        password: document.getElementById('m-password').value,
        display_name: document.getElementById('m-name').value || null,
      });
      Modal.close();
      Toast.success('Merchant account created! Share the credentials with the developer.');
      Router.navigate('/admin/merchants');
    } catch (e) { Toast.error(e.message); }
  },

  async _toggleMerchant(id, active) {
    const action = active ? 'activate' : 'deactivate';
    UI.confirm(`${active ? 'Activate' : 'Deactivate'} Merchant`, `Are you sure you want to ${action} this merchant? This will ${active ? 'restore' : 'suspend'} their access.`, async () => {
      try {
        await API.toggleMerchant(id, active);
        Toast.success(`Merchant ${action}d`);
        Router.navigate('/admin/merchants');
      } catch (e) { Toast.error(e.message); }
    }, 'danger');
  },

  async _resetMerchantPassword(id) {
    Modal.show('Reset Merchant Password', `
      <div style="margin-bottom:16px">
        <p style="font-size:0.8125rem;color:var(--color-text-3);margin:0 0 12px">Enter a new password for this merchant. All active sessions will be revoked.</p>
        <div class="form-group" style="margin:0">
          <label class="ui-label">New Password</label>
          <input class="ui-input" type="text" id="reset-pw-input" placeholder="Min 8 characters" minlength="8">
        </div>
        <div id="reset-pw-error" class="form-error hidden"></div>
      </div>
    `, [
      `<button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>`,
      `<button class="btn btn-primary" id="reset-pw-submit"><i data-lucide="key"></i> Reset Password</button>`
    ]);
    if (window.lucide) lucide.createIcons();
    document.getElementById('reset-pw-submit')?.addEventListener('click', async () => {
      const password = document.getElementById('reset-pw-input')?.value;
      const errEl = document.getElementById('reset-pw-error');
      if (!password || password.length < 8) {
        errEl.textContent = 'Password must be at least 8 characters';
        errEl.classList.remove('hidden');
        return;
      }
      try {
        await API.resetMerchantPassword(id, password);
        Modal.close();
        Toast.success('Password reset. All sessions revoked.');
      } catch (e) {
        errEl.textContent = e.message;
        errEl.classList.remove('hidden');
      }
    });
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESS FLOW PAGE
  // ═══════════════════════════════════════════════════════════════════════════

  async flow(container) {
    const SVG = {
      setup: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
      mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
      security: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      key: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-4.5-4.5-3 3z"/></svg>`,
      code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
      layout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>`,
      gateway: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" x2="6" y1="6" y2="6"/><line x1="6" x2="6" y1="18" y2="18"/></svg>`,
      database: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
      refund: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
      decision: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>`,
      webhook: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M8.6 12.5h6.8"/><path d="m15.4 12.5-2.5-2.5"/><path d="m15.4 12.5-2.5 2.5"/></svg>`,
      lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
      retry: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="m7 12 5 5 5-5"/></svg>`,
      alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`,
      globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
      payment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
      user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
      clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    };

    const step = (opts) => `
      <div class="af-step">
        <div class="af-step-dot ${opts.pulse ? 'pulse' : ''}"></div>
        <div class="af-step-content">
          <div class="af-step-icon af-icon-${opts.color || 'brand'}">
            ${SVG[opts.icon] || SVG.alert}
          </div>
          <div class="af-step-card">
            <div class="af-step-header">
              <div class="af-step-title">${opts.title}</div>
              <div class="af-step-tag af-tag-${opts.color || 'brand'}">${opts.tag || 'SYSTEM'}</div>
            </div>
            <p class="af-step-desc">${opts.desc}</p>
            ${opts.pills ? `
              <div class="af-step-meta">
                ${opts.pills.map(p => `<div class="af-pill">${SVG[p.icon] || ''} ${p.text}</div>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      </div>`;

    const phase = (num, title, subtitle, stepsHtml, extraHtml = '', phaseIcon = 'setup') => `
      <div class="af-phase">
        <div class="af-phase-header">
          <div class="af-phase-icon-wrap">
            ${SVG[phaseIcon]}
          </div>
          <div class="af-phase-title">
            <h2>${title}</h2>
            <p>${subtitle}</p>
          </div>
        </div>
        <div class="af-timeline">
          ${stepsHtml}
        </div>
        ${extraHtml}
      </div>`;

    container.innerHTML = `
      <div class="page-content">
        <div class="page-header">
          <div class="page-title-wrap">
            <h1 class="page-title">System Process Architecture</h1>
            <p class="page-subtitle">Visualizing the end-to-end lifecycle of Trialvo Pay system and operations</p>
          </div>
        </div>

        <div class="af-container">
          <!-- Phase 1: Onboarding -->
          ${phase(1, 'Onboarding & Setup', 'Preparing merchants for integration', `
            ${step({
              icon: 'setup', title: 'Admin Creates Service', tag: 'ADMIN', color: 'brand', pulse: true,
              desc: 'Admin defines the service parameters including slug, commission, and environment mode.',
              pills: [{icon: 'setup', text: 'Service ID'}, {icon: 'globe', text: 'Slug'}]
            })}
            ${step({
              icon: 'mail', title: 'Merchant Credentialing', tag: 'ADMIN', color: 'warning',
              desc: 'Admin generates merchant account and shares temporary credentials via secure channel.',
              pills: [{icon: 'key', text: 'One-time Pass'}]
            })}
            ${step({
              icon: 'security', title: 'Merchant Security Setup', tag: 'MERCHANT', color: 'success',
              desc: 'Merchant logs in, resets password, and enables security features.',
              pills: [{icon: 'lock', text: 'Password Reset'}]
            })}
            ${step({
              icon: 'key', title: 'API Authentication', tag: 'MERCHANT', color: 'success',
              desc: 'Merchant generates Master API Key and configures IPN endpoints for webhooks.',
              pills: [{icon: 'webhook', text: 'IPN Secret'}, {icon: 'code', text: 'API Key'}]
            })}
          `, '', 'user')}

          <!-- Phase 2: Payment Lifecycle -->
          ${phase(2, 'Payment Lifecycle', 'From bill creation to successful capture', `
            ${step({
              icon: 'code', title: 'Bill Initialization', tag: 'API', color: 'brand', pulse: true,
              desc: 'Merchant backend sends POST request to /api/v1/bills with order details.',
              pills: [{icon: 'layout', text: 'JSON Payload'}, {icon: 'security', text: 'X-Signature'}]
            })}
            ${step({
              icon: 'layout', title: 'Gateway Redirection', tag: 'UX', color: 'info',
              desc: 'Customer is redirected to Trialvo Pay hosted page to select payment method.',
              pills: [{icon: 'payment', text: 'bKash/Nagad'}, {icon: 'payment', text: 'SSL Commerz'}]
            })}
            ${step({
              icon: 'gateway', title: 'External Processing', tag: 'GATEWAY', color: 'warning',
              desc: 'Payment is processed by EPS/Gateway. Trialvo Pay listens for synchronous callbacks.',
              pills: [{icon: 'webhook', text: 'EPS Callback'}]
            })}
            ${step({
              icon: 'database', title: 'Integrity Verification', tag: 'CORE', color: 'brand',
              desc: 'Trialvo Pay verifies payment status directly with the gateway API to prevent spoofing.',
              pills: [{icon: 'security', text: 'check_status'}]
            })}
          `, `
            <div class="docs-callout warn" style="margin:20px 0 0 48px">
              <div class="docs-callout-title"><i data-lucide="alert-triangle"></i> Critical: IPN Authoritative</div>
              <p>The customer redirect is for UX only. The IPN webhook is the authoritative payment confirmation. Never fulfill orders based on the redirect alone.</p>
            </div>
          `, 'payment')}

          <!-- Phase 3: Refunds & Decisions -->
          ${phase(3, 'Refunds & Disputes', 'Handling post-payment adjustments', `
            ${step({
              icon: 'refund', title: 'Refund Request', tag: 'MERCHANT', color: 'warning', pulse: true,
              desc: 'Merchant requests a refund via API or Portal. Requires original transaction reference.',
              pills: [{icon: 'code', text: 'Tx Reference'}]
            })}
            ${step({
              icon: 'decision', title: 'Admin Review', tag: 'ADMIN', color: 'brand',
              desc: 'Admin reviews the refund request in the dashboard and makes a decision.',
              pills: [{icon: 'security', text: 'Approve'}, {icon: 'alert', text: 'Reject'}]
            })}
            ${step({
              icon: 'webhook', title: 'Refund Notification', tag: 'WEBHOOK', color: 'success',
              desc: 'System sends refund.approved or refund.rejected IPN to merchant.',
              pills: [{icon: 'send', text: 'IPN Event'}]
            })}
          `, '', 'refund')}

          <!-- Phase 4: IPN Webhook Architecture -->
          ${phase(4, 'IPN Webhook Architecture', 'Authoritative push notification system', `
            ${step({
              icon: 'lock', title: 'Payload Signing', tag: 'SECURITY', color: 'brand', pulse: true,
              desc: 'Every IPN includes X-Trialvo-Pay-Signature header using HMAC-SHA256.',
              pills: [{icon: 'security', text: 'HMAC-SHA256'}]
            })}
            ${step({
              icon: 'retry', title: 'Retry Strategy', tag: 'RELIABILITY', color: 'warning',
              desc: 'If merchant responds with non-2xx, system retries: 30s → 2m → 8m → 30m → 2h.',
              pills: [{icon: 'clock', text: '5 Max Retries'}]
            })}
          `, `
            <div style="margin:24px 0 0 48px">
              <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-3);margin-bottom:12px">Standard IPN Events</div>
              <table class="docs-perm-table" style="margin-bottom:24px">
                <thead><tr><th>Event</th><th>Description</th><th>Status</th></tr></thead>
                <tbody>
                  <tr><td><code>payment.success</code></td><td>EPS confirms payment received</td><td><code>paid</code></td></tr>
                  <tr><td><code>payment.failed</code></td><td>EPS reports failure</td><td><code>failed</code></td></tr>
                  <tr><td><code>payment.cancelled</code></td><td>Customer cancelled payment</td><td><code>cancelled</code></td></tr>
                  <tr><td><code>refund.approved</code></td><td>Admin approved refund</td><td><code>refunded</code></td></tr>
                </tbody>
              </table>

              <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-3);margin-bottom:12px">Signature Verification Flow</div>
              <div class="flow-list">
                <div class="flow-list-item" style="border:none;padding:8px 0"><div class="flow-list-num">1</div><div class="flow-list-content"><p>Get raw request body bytes (do not parse JSON yet).</p></div></div>
                <div class="flow-list-item" style="border:none;padding:8px 0"><div class="flow-list-num">2</div><div class="flow-list-content"><p>Compute HMAC-SHA256(raw_body, webhook_secret).</p></div></div>
                <div class="flow-list-item" style="border:none;padding:8px 0"><div class="flow-list-num">3</div><div class="flow-list-content"><p>Compare hex digest with X-Trialvo-Pay-Signature header using timing-safe equal.</p></div></div>
              </div>
            </div>
          `, 'webhook')}
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN DOCUMENTATION PAGE
  // ═══════════════════════════════════════════════════════════════════════════

  async docs(container) {
    // ── Section renderer ────────────────────────────────────────────────
    const section = (id, icon, title, body) => `
      <div class="adoc-section" id="doc-${id}">
        <div class="adoc-section-header">
          <div class="adoc-section-icon"><i data-lucide="${icon}"></i></div>
          <h2 class="adoc-section-title">${title}</h2>
        </div>
        <div class="adoc-section-body">${body}</div>
      </div>`;

    const callout = (type, icon, title, text) => `
      <div class="docs-callout ${type}">
        <div class="docs-callout-title"><i data-lucide="${icon}"></i> ${title}</div>
        <p>${text}</p>
      </div>`;

    const stepCard = (num, title, body) => `
      <div class="adoc-step">
        <div class="adoc-step-num">${num}</div>
        <div class="adoc-step-body">
          <div class="adoc-step-title">${title}</div>
          <div class="adoc-step-desc">${body}</div>
        </div>
      </div>`;

    // ── Tab definitions ─────────────────────────────────────────────────
    const tabs = [
      { id: 'onboarding', icon: 'user-plus',    label: 'Onboarding' },
      { id: 'operations', icon: 'settings',     label: 'Operations' },
      { id: 'webhooks',   icon: 'webhook',      label: 'Webhooks & IPN' },
      { id: 'security',   icon: 'shield-check', label: 'Security' },
      { id: 'perms',      icon: 'lock',         label: 'Permissions' },
    ];

    container.innerHTML = `
      <div class="page-content">
        <div class="page-header">
          <div class="page-title-wrap">
            <h1 class="page-title">Admin Knowledge Base</h1>
            <p class="page-subtitle">Comprehensive operations reference for Trialvo Pay platform administration</p>
          </div>
          <a href="/docs" target="_blank" class="btn btn-outline btn-sm">
            <i data-lucide="code-2"></i> API Docs
          </a>
        </div>

        <!-- Tab Navigation -->
        <div class="adoc-tabs">
          ${tabs.map((t, i) => `
            <button class="adoc-tab ${i === 0 ? 'active' : ''}" data-tab="${t.id}">
              <i data-lucide="${t.icon}"></i>
              <span>${t.label}</span>
            </button>
          `).join('')}
        </div>

        <!-- ═══ TAB: Onboarding ═══ -->
        <div class="adoc-panel active" id="tab-onboarding">
          ${section('onboard-overview', 'info', 'Onboarding Overview',
            `<p>Merchant registration is <strong>admin-only</strong>. There is no self-registration. The admin creates a service, then creates a merchant account, and shares the credentials securely.</p>`
          )}

          ${section('create-service', 'layers', 'Step 1 — Create a Service', `
            <p>Navigate to <strong>Services → New Service</strong> and configure:</p>
            <div class="adoc-grid-2">
              ${stepCard(1, 'Display Name', 'Merchant\'s project name (e.g. "GameStore")')}
              ${stepCard(2, 'Slug', 'URL-safe identifier (e.g. <code>gamestore</code>)')}
              ${stepCard(3, 'Mode', '<code>sandbox</code> for testing, <code>live</code> for production')}
              ${stepCard(4, 'Commission', 'Percentage rate (e.g. <code>2.5</code>) or <code>0</code> for free')}
              ${stepCard(5, 'Commission Type', '<code>percentage</code> or <code>fixed</code>')}
              ${stepCard(6, 'Redirect URLs', 'Default success / fail / cancel URLs')}
            </div>
          `)}

          ${section('create-merchant', 'store', 'Step 2 — Create Merchant Account', `
            <p>Navigate to <strong>Merchants → New Merchant</strong>. Select the service, then provide:</p>
            <div class="adoc-grid-2">
              ${stepCard(1, 'Email', 'Developer\'s login email address')}
              ${stepCard(2, 'Temporary Password', 'Share securely; merchant must change on first login')}
              ${stepCard(3, 'Display Name', 'Optional — shown in merchant panel header')}
            </div>
            ${callout('info', 'info', 'One merchant per service', 'Each service has exactly one merchant account. If a team has multiple developers, they share the same login credentials.')}
          `)}

          ${section('share-creds', 'send', 'Step 3 — Share Credentials', `
            <p>Share the following with the merchant:</p>
            <div class="adoc-code-block">
              <div class="adoc-code-label">Merchant Portal</div>
              <code>https://pay.trialvo.com/merchant</code>
            </div>
            <p style="margin-top:12px">The merchant logs in, changes their password, then generates their own API key and webhook secrets — <strong>you don't need to touch those</strong>.</p>
          `)}
        </div>

        <!-- ═══ TAB: Operations ═══ -->
        <div class="adoc-panel" id="tab-operations">
          ${section('commission', 'percent', 'Commission Management', `
            <p>Go to <strong>Services → [Service] → Edit Settings → Commission tab</strong> to change rates.</p>
            <table class="docs-perm-table">
              <thead><tr><th>Type</th><th>How it Works</th><th>Example</th></tr></thead>
              <tbody>
                <tr><td><strong>Percentage</strong></td><td>Applied as % of transaction amount</td><td>2.5% on ৳1000 = ৳25</td></tr>
                <tr><td><strong>Fixed</strong></td><td>Fixed fee per transaction</td><td>৳15 flat per payment</td></tr>
                <tr><td><strong>Zero / Special</strong></td><td>Set rate to 0 for no commission</td><td>Partner deal, free tier</td></tr>
              </tbody>
            </table>
            ${callout('warn', 'alert-triangle', 'Not retroactive', 'Commission changes only affect new bills. Existing bills retain the rate from when they were created.')}
          `)}

          ${section('refunds', 'rotate-ccw', 'Refund Workflow', `
            <p>Merchants request refunds via API. Admin must approve or reject — there is <strong>no automatic refund processing</strong>.</p>
            <div class="adoc-grid-2">
              ${stepCard(1, 'Merchant requests', 'Calls <code>POST /api/v1/refunds</code> with bill_token, amount, and reason')}
              ${stepCard(2, 'Request appears', 'Shows in <strong>Refunds</strong> page with status <code>requested</code>')}
              ${stepCard(3, 'Admin reviews', 'Check bill details, amount, and merchant\'s stated reason')}
              ${stepCard(4, 'Decision', 'Click <strong>Approve</strong> or <strong>Reject</strong> (with reason)')}
              ${stepCard(5, 'IPN sent', 'System dispatches <code>refund.approved</code> or <code>refund.rejected</code>')}
            </div>
            ${callout('info', 'info', 'EPS refund processing', 'Trialvo Pay marks the refund as approved, but the actual EPS refund depends on your gateway settings. Confirm whether refunds are processed automatically or require manual action.')}
          `)}

          ${section('service-mgmt', 'toggle-left', 'Service & Merchant Management', `
            <h3 style="margin-top:0">Disable a Service</h3>
            <p>Go to <strong>Services → [Service] → Edit Settings → Danger Zone → Deactivate</strong>. This blocks all new bills. In-flight bills are unaffected.</p>

            <h3>Delete a Service</h3>
            <p>Go to <strong>Services → [Service] → Preview → Delete</strong>. Requires typing the service slug for confirmation. This permanently removes the service and all associated data.</p>
            ${callout('warn', 'alert-triangle', 'Irreversible action', 'Deleting a service permanently removes all associated bills, transactions, IPN endpoints, and the merchant account. This cannot be undone.')}

            <h3>Lock / Unlock a Merchant</h3>
            <p>Go to <strong>Merchants → [Merchant] → Deactivate</strong>. This immediately blocks merchant login and API access. Use when credentials are compromised or to offboard a merchant.</p>

            <h3>Reset Merchant Password</h3>
            <p>Go to <strong>Merchants → [Merchant] → Reset Password</strong>. All existing sessions are revoked.</p>
          `)}

          ${section('transactions', 'credit-card', 'Transaction Management', `
            <p>The <strong>Transactions</strong> page provides a comprehensive view of all payment transactions across services.</p>

            <h3>Transaction Preview</h3>
            <p>Click any transaction row to open the <strong>detail panel</strong> which displays:</p>
            <ul>
              <li>Full transaction ID, bill token, and gateway reference</li>
              <li>Payment method, amount, and commission breakdown</li>
              <li>Customer information and metadata</li>
              <li>Status timeline with all state changes</li>
              <li>Raw gateway response data (JSON viewer)</li>
            </ul>

            <h3>Transaction Deletion</h3>
            <p>Transactions can be deleted from the detail panel. A <strong>confirmation modal</strong> requires typing the transaction ID to prevent accidental deletions.</p>
            ${callout('warn', 'alert-triangle', 'Audit trail', 'Deleted transactions are logged in the audit system. The deletion is permanent and removes all associated payment records.')}
          `)}

          ${section('sandbox-live', 'layers', 'Sandbox vs Live Mode', `
            <p>Each service is independently configured as sandbox or live:</p>
            <table class="docs-perm-table">
              <thead><tr><th>Mode</th><th>EPS Environment</th><th>Real Payments</th><th>Use For</th></tr></thead>
              <tbody>
                <tr><td><code>sandbox</code></td><td>EPS test environment</td><td class="no">No</td><td>Development, testing</td></tr>
                <tr><td><code>live</code></td><td>EPS production</td><td class="yes">Yes</td><td>Production transactions</td></tr>
              </tbody>
            </table>
            <p>Switch mode in <strong>Services → [Service] → Edit Settings → API & Keys</strong>. Ensure EPS production credentials are configured in <strong>Configuration</strong> first.</p>
          `)}

          ${section('config', 'settings', 'System Configuration', `
            <p>The <strong>Configuration</strong> page manages system-wide settings:</p>
            <div class="adoc-grid-2">
              ${stepCard('⚡', 'EPS Credentials', 'API keys, store ID, merchant ID, hash key for sandbox and live environments')}
              ${stepCard('🔄', 'IPN Retry Settings', 'Max retries (default 5) and retry interval multiplier')}
              ${stepCard('🚦', 'Rate Limits', 'API requests per minute per service')}
              ${stepCard('🔐', 'Argon2 Parameters', 'Password hashing memory/iterations (advanced tuning)')}
            </div>
            ${callout('warn', 'alert-triangle', 'Immediate effect', 'Configuration changes take effect immediately for all active services. Test in sandbox before modifying live credentials.')}
          `)}
        </div>

        <!-- ═══ TAB: Webhooks & IPN ═══ -->
        <div class="adoc-panel" id="tab-webhooks">
          ${section('ipn-overview', 'send', 'What is IPN?', `
            <p>IPN (Instant Payment Notification) is Trialvo Pay's <strong>push-notification system</strong>. When a bill changes status, the system signs a JSON payload with the merchant's webhook secret and POSTs it to all subscribed endpoints.</p>
            <p>IPN is the <strong>only authoritative source of truth</strong> for payment status — never rely on browser redirects alone.</p>
          `)}

          ${section('ipn-events', 'zap', 'IPN Events', `
            <table class="docs-perm-table">
              <thead><tr><th>Event</th><th>Trigger</th><th>Subscriber</th></tr></thead>
              <tbody>
                <tr><td><code>payment.success</code></td><td>EPS confirms payment received</td><td>Merchant webhook</td></tr>
                <tr><td><code>payment.failed</code></td><td>EPS reports payment failure</td><td>Merchant webhook</td></tr>
                <tr><td><code>payment.cancelled</code></td><td>Customer cancels at EPS page</td><td>Merchant webhook</td></tr>
                <tr><td><code>refund.approved</code></td><td>Admin approves refund request</td><td>Merchant webhook</td></tr>
                <tr><td><code>refund.rejected</code></td><td>Admin rejects refund request</td><td>Merchant webhook</td></tr>
              </tbody>
            </table>
          `)}

          ${section('ipn-delivery', 'truck', 'Delivery Mechanism', `
            <div class="adoc-grid-2">
              ${stepCard(1, 'Event triggers', 'EPS callback or admin refund decision fires an event')}
              ${stepCard(2, 'Find endpoints', 'System locates all active webhooks subscribed to the event')}
              ${stepCard(3, 'Sign payload', 'JSON is signed with <code>HMAC-SHA256(raw_body, webhook_secret)</code>')}
              ${stepCard(4, 'POST to URL', 'Payload sent with <code>X-Trialvo-Pay-Signature</code> header')}
              ${stepCard(5, 'Verify response', 'Endpoint must return HTTP 2xx within 10 seconds')}
              ${stepCard(6, 'Retry on failure', 'Schedule: <strong>30s → 2m → 8m → 30m → 2h</strong> (max 5 retries)')}
            </div>
          `)}

          ${section('ipn-payload', 'file-json', 'Payload Structure', `
            <table class="docs-perm-table">
              <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
              <tbody>
                <tr><td><code>event</code></td><td>string</td><td>Event type (e.g. <code>payment.success</code>)</td></tr>
                <tr><td><code>bill_token</code></td><td>string</td><td>Merchant's bill reference</td></tr>
                <tr><td><code>amount</code></td><td>string</td><td>Transaction amount in BDT</td></tr>
                <tr><td><code>currency</code></td><td>string</td><td>Always <code>BDT</code></td></tr>
                <tr><td><code>status</code></td><td>string</td><td>Bill status after event</td></tr>
                <tr><td><code>gateway_provider</code></td><td>string</td><td>bkash, nagad, card, etc.</td></tr>
                <tr><td><code>eps_merchant_tx_id</code></td><td>string</td><td>EPS transaction reference</td></tr>
                <tr><td><code>timestamp</code></td><td>ISO 8601</td><td>Event time in UTC</td></tr>
                <tr><td><code>metadata</code></td><td>object / null</td><td>Custom data from bill creation</td></tr>
                <tr><td><code>refund_amount</code></td><td>string / null</td><td>Refund amount (refund events only)</td></tr>
                <tr><td><code>refund_reason</code></td><td>string / null</td><td>Reason (refund events only)</td></tr>
              </tbody>
            </table>
          `)}

          ${section('ipn-monitoring', 'activity', 'Admin Monitoring', `
            <p>Navigate to <strong>IPN Endpoints</strong> in the sidebar for a system-wide view of all merchant webhook endpoints.</p>
            <ul>
              <li>See which endpoints are <strong>active or inactive</strong></li>
              <li>See which <strong>events each endpoint subscribes to</strong></li>
              <li>See <strong>delivery statistics</strong> (last delivery, failure count)</li>
              <li>View per-delivery logs — HTTP status codes, response bodies, timestamps, and retry attempts</li>
            </ul>
            ${callout('info', 'info', 'Merchants manage their own webhooks', 'Admins can <strong>view</strong> all IPN endpoints and delivery logs, but <strong>cannot create, edit, or delete</strong> merchant webhook endpoints. Merchants self-manage from the Merchant Portal.')}
          `)}

          ${section('ipn-troubleshoot', 'wrench', 'Troubleshooting Failed Deliveries', `
            <div class="adoc-grid-2">
              ${stepCard(1, 'View delivery history', 'IPN Endpoints → click endpoint → Delivery History')}
              ${stepCard(2, 'Check HTTP status', 'Common: timeout (10s), TLS error, DNS failure, non-2xx')}
              ${stepCard(3, 'Review error details', 'Each delivery log includes full response body and headers')}
              ${stepCard(4, 'Inform merchant', 'After 5 retries exhausted, ask merchant to fix their endpoint')}
            </div>
            ${callout('warn', 'alert-triangle', 'Exhausted deliveries', 'Once marked <code>exhausted</code>, deliveries are NOT re-triggered. Merchant must fix their endpoint and wait for the next event, or use the <strong>Test Webhook</strong> feature.')}
          `)}
        </div>

        <!-- ═══ TAB: Security ═══ -->
        <div class="adoc-panel" id="tab-security">
          ${section('audit-logs', 'file-check', 'Audit Logs', `
            <p>Every admin action is logged in <strong>Audit Logs</strong> including:</p>
            <ul>
              <li>Admin email and IP address</li>
              <li>Action type (login, service edit, refund decision, password reset, etc.)</li>
              <li>Timestamp in UTC</li>
              <li>Affected resource IDs</li>
            </ul>
            <p>Logs are <strong>read-only and cannot be deleted</strong>. They serve as an immutable record of all administrative actions.</p>
          `)}

          ${section('2fa', 'smartphone', 'Two-Factor Authentication', `
            <p>Admin accounts support 2FA via <strong>TOTP</strong> (Google Authenticator, Authy, etc.).</p>
            <p>Enable 2FA in <strong>Profile → Enable 2FA</strong>. Once enabled, login requires both password and a 6-digit code from the authenticator app.</p>
            ${callout('tip', 'check-circle', 'Recommended for production', 'All admins should enable 2FA before going live. This protects against credential theft and unauthorized access.')}
          `)}

          ${section('admin-roles', 'user-cog', 'Admin Roles', `
            <table class="docs-perm-table">
              <thead><tr><th>Role</th><th>Capabilities</th><th>Management</th></tr></thead>
              <tbody>
                <tr><td><code>superadmin</code></td><td>Full system access, can manage other admins</td><td>Can create/delete admin accounts</td></tr>
                <tr><td><code>admin</code></td><td>Full operational access</td><td>Cannot manage other admin accounts</td></tr>
              </tbody>
            </table>
            <p>Role management is done from <strong>Administrators</strong> in the sidebar. Only superadmins can create or delete other admin accounts.</p>
          `)}

          ${section('sig-verify', 'shield', 'Signature Verification', `
            <p>Every IPN POST includes the <code>X-Trialvo-Pay-Signature</code> header. Merchants must verify this before trusting the payload:</p>
            <div class="adoc-grid-2">
              ${stepCard(1, 'Get raw body', 'Read raw request bytes — do NOT parse JSON first')}
              ${stepCard(2, 'Compute HMAC', '<code>HMAC-SHA256(raw_body, webhook_secret)</code>')}
              ${stepCard(3, 'Compare', 'Hex-encode digest, compare with header using timing-safe equality')}
              ${stepCard(4, 'Respond', 'Return HTTP 2xx within 10 seconds')}
            </div>
            ${callout('warn', 'alert-triangle', 'Never skip verification', 'Any public URL accepting IPN without verifying signatures can be spoofed. Always verify before fulfilling orders or crediting accounts.')}
          `)}
        </div>

        <!-- ═══ TAB: Permissions ═══ -->
        <div class="adoc-panel" id="tab-perms">
          ${section('perms-matrix', 'lock', 'Admin vs Merchant Permissions', `
            <p>Clear separation of responsibilities between admin and merchant roles:</p>
            <table class="docs-perm-table">
              <thead><tr><th>Action</th><th>Admin</th><th>Merchant</th></tr></thead>
              <tbody>
                <tr><td>Create / delete service</td><td class="yes">✓ Yes</td><td class="no">No</td></tr>
                <tr><td>Create / delete merchant account</td><td class="yes">✓ Yes</td><td class="no">No</td></tr>
                <tr><td>Set / change commission rate</td><td class="yes">✓ Yes</td><td class="no">No</td></tr>
                <tr><td>Enable / disable service</td><td class="yes">✓ Yes</td><td class="no">No</td></tr>
                <tr><td>Approve / reject refunds</td><td class="yes">✓ Yes</td><td class="no">No (request only)</td></tr>
                <tr><td>View all services' transactions</td><td class="yes">✓ Yes</td><td class="no">Own service only</td></tr>
                <tr><td>View audit logs</td><td class="yes">✓ Yes</td><td class="no">No</td></tr>
                <tr><td>Manage EPS configuration</td><td class="yes">✓ Yes</td><td class="no">No</td></tr>
                <tr><td>View all IPN endpoints</td><td class="yes">✓ Yes</td><td class="no">Own service only</td></tr>
                <tr><td>View all delivery logs</td><td class="yes">✓ Yes</td><td class="no">Own service only</td></tr>
                <tr><td>Create / edit / delete webhooks</td><td class="no">No</td><td class="yes">✓ Yes (own service)</td></tr>
                <tr><td>Generate API keys</td><td class="yes">✓ Yes (via service)</td><td class="yes">✓ Yes (own service)</td></tr>
                <tr><td>Update service URLs</td><td class="yes">✓ Yes</td><td class="yes">✓ Yes (own service)</td></tr>
                <tr><td>View transactions</td><td class="yes">✓ Yes</td><td class="yes">✓ Yes (own service)</td></tr>
                <tr><td>Request refunds</td><td class="yes">✓ Yes</td><td class="yes">✓ Yes (own bills)</td></tr>
              </tbody>
            </table>
          `)}

          ${section('api-auth', 'key', 'API Authentication Methods', `
            <table class="docs-perm-table">
              <thead><tr><th>API Scope</th><th>Auth Method</th><th>Header</th></tr></thead>
              <tbody>
                <tr><td>Service API (<code>/api/v1/*</code>)</td><td>HMAC-SHA256 signature</td><td><code>X-Signature</code>, <code>X-Api-Key</code>, <code>X-Timestamp</code>, <code>X-Nonce</code></td></tr>
                <tr><td>Admin API (<code>/api/admin/*</code>)</td><td>Bearer token (session)</td><td><code>Authorization: Bearer {token}</code></td></tr>
                <tr><td>Merchant API (<code>/api/merchant/*</code>)</td><td>Bearer token (session)</td><td><code>Authorization: Bearer {token}</code></td></tr>
              </tbody>
            </table>
            ${callout('info', 'info', 'Service API uses HMAC', 'The Service API uses stateless HMAC authentication with request signing. This is more secure than API key-only auth as each request is signed with a timestamp and nonce to prevent replay attacks.')}
          `)}
        </div>

      </div>
    `;

    if (window.lucide) lucide.createIcons();

    // ── Tab switching logic ─────────────────────────────────────────────
    container.querySelectorAll('.adoc-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.adoc-tab').forEach(t => t.classList.remove('active'));
        container.querySelectorAll('.adoc-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = container.querySelector(`#tab-${tab.dataset.tab}`);
        if (panel) panel.classList.add('active');
      });
    });
  },

};
