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
      ${Components.renderPageHeader('Dashboard', 'Revenue overview and recent activity')}
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
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVICES
  // ═══════════════════════════════════════════════════════════════════════════

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
        ${Components.renderPageHeader('Services', 'Manage connected services and API keys',
          `<button class="btn btn-primary" id="add-service-btn"><i data-lucide="plus"></i> Add Service</button>`)}
        <div class="card">
          ${Components.renderTable(
            [
              { label: 'Service', key: 'name' },
              { label: 'Slug', key: 'slug_badge' },
              { label: 'Status', key: 'status_badge' },
              { label: 'Mode', key: 'mode_badge' },
              { label: 'Created', key: 'created' },
              { label: 'Actions', key: 'actions' },
            ],
            services.map(s => ({
              name: `<div class="service-name">${s.display_name}</div><div class="service-desc">${s.description || ''}</div>`,
              slug_badge: `<code class="code-tag">${s.slug}</code>`,
              status_badge: statusBadge(s.is_active ? 'active' : 'inactive'),
              mode_badge: s.is_sandbox ? '<span class="badge badge-warning">Sandbox</span>' : '<span class="badge badge-success">Live</span>',
              created: formatDate(s.created_at),
              actions: `
                <div class="action-btns">
                  <button class="btn btn-ghost sm" onclick="Pages._viewService('${s.id}')"><i data-lucide="eye"></i></button>
                  <button class="btn btn-ghost sm" onclick="Pages._rotateKey('${s.id}')"><i data-lucide="key"></i></button>
                  <button class="btn btn-ghost sm ${s.is_active ? 'danger' : 'success'}" onclick="Pages._toggleService('${s.id}', ${!s.is_active})">
                    <i data-lucide="${s.is_active ? 'pause-circle' : 'play-circle'}"></i>
                  </button>
                </div>
              `,
            })),
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
          <h4 style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px">🔐 Merchant Account (Optional)</h4>
          <p style="font-size:12px;color:var(--text-muted);margin:0">Create a merchant portal login along with the service. Leave blank to skip.</p>
        </div>
        ${Components.renderInput('svc-merchant-email', 'Merchant Email', 'email', 'merchant@example.com')}
        <div class="form-group">
          <label>Merchant Password</label>
          <div style="display:flex;gap:8px">
            <input type="text" id="svc-merchant-password" placeholder="Min 8 chars or auto-generate" style="flex:1">
            <button type="button" class="btn btn-secondary btn-sm" onclick="Pages._autoGenPassword()" style="white-space:nowrap">🎲 Auto Generate</button>
          </div>
          <small style="color:var(--text-muted);display:block;margin-top:4px">If left empty, a secure password will be auto-generated.</small>
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

    // Validate: if password provided, must be >= 8 chars
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

      // Add merchant fields if email provided
      if (merchantEmail) {
        payload.merchant_email = merchantEmail;
        if (merchantPassword) {
          payload.merchant_password = merchantPassword;
        }
      }

      const result = await API.createService(payload);

      // If merchant was created, show credentials in a modal
      if (result.merchant && result.merchant.email) {
        Modal.show('✅ Service & Merchant Created', `
          <div style="background:var(--bg-secondary);border-radius:12px;padding:20px;margin-bottom:16px">
            <h4 style="margin:0 0 12px;font-size:14px;color:var(--text-muted)">Service</h4>
            <div style="font-size:15px;font-weight:600;color:var(--text)">${result.service?.display_name || 'Created'}</div>
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
            <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText('Email: ${result.merchant.email}\nPassword: ${result.merchant.password}');Toast.success('Copied!')">📋 Copy Credentials</button>
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

      const keyCardHtml = !primaryKey
        ? `<div class="key-card empty">
            <p>No API key configured.</p>
            <button class="btn btn-primary sm" onclick="Pages._generateServiceKey('${id}')">
              <i data-lucide="plus"></i> Generate API Key
            </button>
          </div>`
        : `<div class="key-card">
            <div class="key-card-row">
              <div class="key-card-info">
                <code class="code-tag">${primaryKey.key_prefix}••••••••</code>
                ${primaryKey.is_primary ? '<span class="badge badge-success">Primary</span>' : ''}
              </div>
              <div class="key-card-actions">
                <button class="btn btn-ghost sm" onclick="Pages._revealServiceKey('${id}', '${primaryKey.id}')" title="Reveal full key">
                  <i data-lucide="eye"></i>
                </button>
                <button class="btn btn-ghost sm danger" onclick="Pages._revokeServiceKey('${id}', '${primaryKey.id}')" title="Revoke key">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </div>
            <div class="key-card-meta">
              <span>Created ${formatDate(primaryKey.created_at)}</span>
              <span>Last used: ${primaryKey.last_used_at ? formatDate(primaryKey.last_used_at) : 'Never'}</span>
            </div>
            <div id="key-reveal-area" class="hidden"></div>
          </div>`;

      Modal.show(`Service: ${s.display_name}`, `
        <div class="detail-grid">
          ${Components.renderDetailRow('ID', `<code>${s.id}</code>`)}
          ${Components.renderDetailRow('Slug', `<code class="code-tag">${s.slug}</code>`)}
          ${Components.renderDetailRow('Status', statusBadge(s.is_active ? 'active' : 'inactive'))}
          ${Components.renderDetailRow('Mode', s.is_sandbox ? '<span class="badge badge-warning">Sandbox</span>' : '<span class="badge badge-success">Live</span>')}
          ${Components.renderDetailRow('Contact', s.contact_email || '—')}
          ${Components.renderDetailRow('Success URL', s.success_url ? `<a href="${s.success_url}" target="_blank">${s.success_url}</a>` : '—')}
          ${Components.renderDetailRow('Fail URL', s.fail_url || '—')}
          ${Components.renderDetailRow('Cancel URL', s.cancel_url || '—')}
          ${Components.renderDetailRow('Created', formatDate(s.created_at))}
        </div>

        <div class="keys-section mt-16">
          <div class="keys-section-header">
            <h4 class="keys-section-title"><i data-lucide="settings"></i> Service Settings</h4>
            <button class="btn btn-ghost sm" onclick="Pages._editServiceSettingsModal('${s.id}')">
              <i data-lucide="edit-2"></i> Edit
            </button>
          </div>
        </div>

        <div class="keys-section mt-16">
          <div class="keys-section-header">
            <h4 class="keys-section-title"><i data-lucide="percent"></i> Commission</h4>
            <button class="btn btn-ghost sm" onclick="Pages._editCommission('${s.id}', '${s.commission_rate}', '${s.commission_type || 'percentage'}')">
              <i data-lucide="edit-2"></i> Edit
            </button>
          </div>
          <div class="detail-grid" id="commission-display">
            ${Components.renderDetailRow('Rate', `<strong>${parseFloat(s.commission_rate || 0).toFixed(2)}%</strong>`)}
            ${Components.renderDetailRow('Type', `<span class="badge badge-info">${s.commission_type || 'percentage'}</span>`)}
          </div>
        </div>

        <div class="keys-section mt-16">
          <div class="keys-section-header">
            <h4 class="keys-section-title"><i data-lucide="key-round"></i> API Key</h4>
            ${primaryKey ? `<button class="btn btn-primary sm" onclick="Pages._generateServiceKey('${s.id}')">
              <i data-lucide="refresh-cw"></i> Regenerate
            </button>` : ''}
          </div>
          <div id="service-key-card">
            ${keyCardHtml}
          </div>
        </div>

        <div id="new-key-reveal" class="hidden"></div>
      `);
      if (window.lucide) lucide.createIcons();

    } catch (e) {
      Toast.error(e.message);
    }
  },

  _editCommission(serviceId, currentRate, currentType) {
    const display = document.getElementById('commission-display');
    if (!display) return;
    display.innerHTML = `
      <div class="form-row" style="align-items:flex-end;gap:12px;margin:8px 0">
        <div class="form-group" style="flex:1;margin:0">
          <label class="form-label">Rate (%)</label>
          <input class="form-input" id="commission-rate-input" type="number" min="0" max="100" step="0.01"
            value="${parseFloat(currentRate || 0).toFixed(2)}" placeholder="2.50">
        </div>
        <div class="form-group" style="flex:1;margin:0">
          <label class="form-label">Type</label>
          <select class="form-input" id="commission-type-input">
            <option value="percentage" ${currentType === 'percentage' ? 'selected' : ''}>Percentage</option>
            <option value="flat" ${currentType === 'flat' ? 'selected' : ''}>Flat (BDT)</option>
          </select>
        </div>
        <button class="btn btn-primary sm" onclick="Pages._saveCommission('${serviceId}')" style="margin-bottom:0">
          <i data-lucide="save"></i> Save
        </button>
        <button class="btn btn-ghost sm" onclick="Pages._viewService('${serviceId}')" style="margin-bottom:0">
          Cancel
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons({ nodes: [display] });
  },

  async _saveCommission(serviceId) {
    const rate = document.getElementById('commission-rate-input')?.value;
    const type = document.getElementById('commission-type-input')?.value;
    if (!rate) return Toast.error('Enter a commission rate');
    try {
      await API.updateServiceCommission(serviceId, parseFloat(rate), type);
      Toast.success('Commission updated!');
      Modal.close();
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
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="es-sandbox" ${s.is_sandbox ? 'checked' : ''}> Sandbox Mode
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="es-skip-preview" ${s.meta?.skip_preview ? 'checked' : ''}> Skip Payment Preview
            </label>
            <small style="color:var(--text-muted);display:block;margin-top:4px">When enabled, customers are redirected directly to the payment gateway without seeing the order summary page.</small>
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
      Modal.close();
      Toast.success('Service settings updated!');
      Pages.services(document.getElementById('page-content'));
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
    if (!confirm('Generate a new API key? The current key will be replaced.')) return;
    try {
      const res = await API.generateServiceKey(serviceId);
      const reveal = document.getElementById('new-key-reveal');
      if (reveal) {
        reveal.classList.remove('hidden');
        reveal.innerHTML = `
          <div class="key-reveal mt-16">
            <div class="key-reveal-warning">
              <i data-lucide="alert-triangle"></i>
              <span>Copy this key now — it will <strong>never</strong> be shown again.</span>
            </div>
            <div class="key-display">
              <code id="new-key-value">${res.raw_key}</code>
              <button class="btn btn-ghost sm" onclick="navigator.clipboard.writeText('${res.raw_key}').then(()=>Toast.success('Copied to clipboard!'))">
                <i data-lucide="copy"></i> Copy
              </button>
            </div>
          </div>
        `;
        if (window.lucide) lucide.createIcons({ nodes: [reveal] });
      }
      Toast.success('New API key generated!');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async _revokeServiceKey(serviceId, keyId) {
    if (!confirm('Revoke this API key? This action cannot be undone.')) return;
    try {
      await API.revokeServiceKey(serviceId, keyId, 'Admin revoked from panel');
      Toast.success('Key revoked');
      Pages._viewService(serviceId);
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async _rotateKey(serviceId) {
    if (!confirm('Rotate API key? The old key will have a 24-hour grace period.')) return;
    try {
      const res = await API.rotateServiceKey(serviceId);
      Toast.success('Key rotated! Store your new key safely.');
      Modal.show('New API Key', `
        <div class="key-reveal">
          <p class="text-warning">⚠️ Copy this key now — it will not be shown again.</p>
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
  },

  async _toggleService(id, isActive) {
    try {
      await API.toggleService(id, isActive);
      Toast.success(`Service ${isActive ? 'activated' : 'deactivated'}`);
      Pages.services(document.getElementById('page-content'));
    } catch (e) {
      Toast.error(e.message);
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  async transactions(container) {
    let page = 1, limit = 25, statusFilter = '', serviceFilter = '';
    const load = async () => {
      const data = await API.getTransactions({ limit, offset: (page-1)*limit, status: statusFilter, service_id: serviceFilter });
      const items = data.data || data.transactions || data;
      renderList(items, data.total || items.length || 0);
    };

    const renderList = (txs, total) => {
      container.innerHTML = `
        ${Components.renderPageHeader('Transactions', `${total.toLocaleString()} total transactions`)}
        ${Components.renderFilterBar([
          { id: 'status', type: 'select', onChange: `statusFilter=this.value;page=1;Pages.transactions(document.getElementById('page-content'))`,
            options: [
              { value: '', label: 'All Statuses' },
              { value: 'success', label: '✓ Success' },
              { value: 'processing', label: '↻ Processing' },
              { value: 'failed', label: '✗ Failed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]
          },
        ])}
        <div class="card">
          ${Components.renderTable(
            [
              { label: 'Merchant TX ID', key: 'merchant_id' },
              { label: 'Amount', key: 'amount' },
              { label: 'Status', key: 'status' },
              { label: 'Method', key: 'method' },
              { label: 'Date', key: 'date' },
              { label: '', key: 'actions' },
            ],
            txs.map(tx => ({
              merchant_id: `<code class="code-tag sm">${tx.eps_merchant_tx_id || tx.id?.slice(0,8)}</code>`,
              amount: `<span class="amount">${formatCurrency(tx.amount)}</span>`,
              status: statusBadge(tx.status),
              method: tx.eps_financial_entity || '—',
              date: formatDate(tx.created_at),
              actions: `<button class="btn btn-ghost sm" onclick="Pages._viewTransaction('${tx.id}')"><i data-lucide="eye"></i></button>`,
              _onclick: `Pages._viewTransaction('${tx.id}')`,
            })),
            'No transactions found'
          )}
          ${renderPagination(page, total, limit, `(p) => { page=p; Pages.transactions(document.getElementById('page-content')); }`)}
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    };

    try {
      container.innerHTML = Components.renderSkeleton();
      await load();
    } catch (e) {
      container.innerHTML = Components.renderError(e.message);
    }
  },

  async _viewTransaction(id) {
    try {
      const res = await API.getTransaction(id);
      const tx = res.transaction || res;
      const events = res.events || [];
      Modal.show('Transaction Details', `
        <div class="detail-grid">
          ${Components.renderDetailRow('Transaction ID', `<code>${tx.id}</code>`)}
          ${Components.renderDetailRow('EPS TX ID', tx.eps_transaction_id || '—')}
          ${Components.renderDetailRow('Merchant TX ID', `<code>${tx.eps_merchant_tx_id}</code>`)}
          ${Components.renderDetailRow('Amount', formatCurrency(tx.amount))}
          ${Components.renderDetailRow('Status', statusBadge(tx.status))}
          ${Components.renderDetailRow('Payment Method', tx.eps_financial_entity || '—')}
          ${Components.renderDetailRow('Customer ID', tx.eps_customer_id || '—')}
          ${Components.renderDetailRow('Payment Ref', tx.eps_payment_ref || '—')}
          ${Components.renderDetailRow('Created', formatDate(tx.created_at))}
          ${Components.renderDetailRow('Completed', formatDate(tx.completed_at))}
        </div>
        ${events.length ? `
          <div class="event-timeline">
            <h4>Event Log</h4>
            ${events.map(ev => `
              <div class="event-item">
                <div class="event-dot"></div>
                <div class="event-content">
                  <span class="event-type">${ev.event_type}</span>
                  <span class="event-time">${formatDate(ev.created_at)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      `);
    } catch (e) {
      Toast.error(e.message);
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BILLS
  // ═══════════════════════════════════════════════════════════════════════════

  async bills(container) {
    let page = 1, limit = 25;
    const load = async () => {
      const data = await API.getBills({ limit, offset: (page-1)*limit });
      const items = data.data || data.bills || data;
      renderList(items, data.total || items.length || 0);
    };

    const renderList = (bills, total) => {
      container.innerHTML = `
        ${Components.renderPageHeader('Bills', `${total.toLocaleString()} total bills`)}
        <div class="card">
          ${Components.renderTable(
            [
              { label: 'Token', key: 'token' },
              { label: 'Customer', key: 'customer' },
              { label: 'Amount', key: 'amount' },
              { label: 'Status', key: 'status' },
              { label: 'Type', key: 'type' },
              { label: 'Expires', key: 'expires' },
              { label: '', key: 'actions' },
            ],
            bills.map(b => ({
              token: `<code class="code-tag sm">${b.bill_token?.slice(0, 16)}…</code>`,
              customer: b.customer_name || b.customer_email || '—',
              amount: formatCurrency(b.final_amount),
              status: statusBadge(b.status),
              type: b.payment_type,
              expires: formatDate(b.expires_at),
              actions: `<button class="btn btn-ghost sm" onclick="Pages._viewBill('${b.id}')"><i data-lucide="eye"></i></button>`,
            })),
            'No bills found'
          )}
          ${renderPagination(page, total, limit, `(p) => { page=p; Pages.bills(document.getElementById('page-content')); }`)}
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    };

    try { container.innerHTML = Components.renderSkeleton(); await load(); }
    catch (e) { container.innerHTML = Components.renderError(e.message); }
  },

  async _viewBill(id) {
    try {
      const res = await API.getBill(id);
      const b = res.bill || res;
      const items = res.items || [];
      Modal.show('Bill Details', `
        <div class="detail-grid">
          ${Components.renderDetailRow('Token', `<code class="code-tag">${b.bill_token}</code>`)}
          ${Components.renderDetailRow('Status', statusBadge(b.status))}
          ${Components.renderDetailRow('Type', b.payment_type)}
          ${Components.renderDetailRow('Amount', formatCurrency(b.final_amount))}
          ${Components.renderDetailRow('Customer', b.customer_name || '—')}
          ${Components.renderDetailRow('Email', b.customer_email || '—')}
          ${Components.renderDetailRow('Phone', b.customer_phone || '—')}
          ${Components.renderDetailRow('Created', formatDate(b.created_at))}
          ${Components.renderDetailRow('Expires', formatDate(b.expires_at))}
        </div>
        ${items.length ? `
          <table class="data-table mt-16">
            <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>
              ${items.map(it => `<tr>
                <td>${it.product_name}</td>
                <td>${it.quantity}</td>
                <td>${formatCurrency(it.unit_final_price)}</td>
                <td>${formatCurrency(it.line_total)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        ` : ''}
      `);
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
          `<span class="badge badge-warning"><i data-lucide="alert-triangle"></i> Manual Approval Only</span>`)}
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
              amount: `<span class="amount">${formatCurrency(r.refund_amount)}</span>`,
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
    const notes = prompt('Admin notes (optional):');
    if (notes === null) return; // cancelled
    try {
      await API.approveRefund(id, notes);
      Toast.success('Refund approved and queued for processing');
      Pages.refunds(document.getElementById('page-content'));
    } catch (e) { Toast.error(e.message); }
  },

  async _rejectRefund(id) {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await API.rejectRefund(id, reason);
      Toast.success('Refund rejected');
      Pages.refunds(document.getElementById('page-content'));
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
        ${Components.renderPageHeader('Customers', `${total.toLocaleString()} customers`)}
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
              name: `<div>${c.display_name || c.canonical_name || 'Unknown'}</div>`,
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
    const reason = prompt('Block reason:');
    if (!reason) return;
    try {
      await API.blockCustomer(id, reason);
      Toast.success('Customer blocked');
      Pages.customers(document.getElementById('page-content'));
    } catch (e) { Toast.error(e.message); }
  },

  async _unblockCustomer(id) {
    try {
      await API.unblockCustomer(id);
      Toast.success('Customer unblocked');
      Pages.customers(document.getElementById('page-content'));
    } catch (e) { Toast.error(e.message); }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

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
        ${Components.renderPageHeader('Configuration', 'System settings and EPS credentials',
          `<button class="btn btn-primary" onclick="Pages._saveAllConfig()"><i data-lucide="save"></i> Save Changes</button>`)}
        <div class="config-sections">
          ${Object.entries(grouped).map(([cat, items]) => `
            <div class="card config-section">
              <div class="card-header">
                <h3 class="card-title"><i data-lucide="${cat === 'eps' ? 'credit-card' : 'settings'}"></i> ${cat.toUpperCase()}</h3>
              </div>
              <div class="config-grid">
                ${items.map(item => `
                  <div class="config-item">
                    <label class="form-label">
                      ${item.key_name}
                      ${item.is_secret ? '<i data-lucide="lock" style="width:12px;height:12px;opacity:.5"></i>' : ''}
                    </label>
                    ${item.description ? `<div class="config-desc">${item.description}</div>` : ''}
                    <input class="form-input" 
                      type="${item.is_secret ? 'password' : 'text'}"
                      id="cfg-${cat}-${item.key_name}"
                      data-category="${cat}"
                      data-key="${item.key_name}"
                      value="${item.is_secret ? '' : (item.value || '')}"
                      placeholder="${item.is_secret ? '(encrypted — leave blank to keep)' : (item.value || '')}">
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    } catch (e) { container.innerHTML = Components.renderError(e.message); }
  },

  async _saveAllConfig() {
    const inputs = document.querySelectorAll('[data-category][data-key]');
    const updates = [];
    inputs.forEach(inp => {
      if (inp.value) {
        updates.push({ category: inp.dataset.category, key: inp.dataset.key, value: inp.value });
      }
    });

    if (!updates.length) { Toast.info('No changes to save'); return; }
    try {
      for (const u of updates) await API.updateConfig(u.category, u.key, u.value);
      Toast.success(`${updates.length} configuration value(s) saved`);
      Pages.config(document.getElementById('page-content'));
    } catch (e) { Toast.error(e.message); }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // IPN ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

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
    const rows = endpoints.map(ep => {
      const svc = serviceMap[ep.service_id];
      return {
        service: `<div class="fw-500">${svc?.display_name || '—'}</div><code class="code-tag sm">${svc?.slug || ep.service_id.slice(0,8)}</code>`,
        url: `<code class="code-tag sm" title="${ep.url}">${ep.url.length > 45 ? ep.url.slice(0,45)+'…' : ep.url}</code>`,
        events: `<div class="events-tags">${(ep.events||[]).map(e => `<span class="badge badge-info sm">${e}</span>`).join('')}</div>`,
        status: statusBadge(ep.is_active ? 'active' : 'inactive'),
        failures: ep.failure_count > 0
          ? `<span class="badge badge-danger">${ep.failure_count}</span>`
          : `<span class="text-muted">0</span>`,
        last_ok: ep.last_success_at ? formatDate(ep.last_success_at) : '<span class="text-muted">Never</span>',
        actions: `
          <div class="action-btns">
            <button class="btn btn-ghost sm" title="Edit" onclick="Pages._editIpnModal('${ep.id}','${ep.url.replace(/'/g,"\\'")}',${JSON.stringify(ep.events)},${ep.is_active})">
              <i data-lucide="edit-2"></i>
            </button>
            <button class="btn btn-ghost sm" title="Test ping" onclick="Pages._testIpnEndpoint('${ep.id}')">
              <i data-lucide="send"></i>
            </button>
            <button class="btn btn-ghost sm" title="Delivery logs" onclick="Pages._viewIpnDeliveries('${ep.id}','${ep.url.replace(/'/g,"\\'")}')">
              <i data-lucide="list"></i>
            </button>
            <button class="btn btn-ghost sm danger" title="Delete" onclick="Pages._deleteIpnEndpoint('${ep.id}')">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        `,
      };
    });

    container.innerHTML = `
      ${Components.renderPageHeader('IPN Endpoints', 'Webhook endpoints across all services — admin has full control',
        `<button class="btn btn-primary" id="add-ipn-btn"><i data-lucide="plus"></i> Add Endpoint</button>`)}
      <div class="card">
        ${Components.renderTable(
          [
            { label: 'Service', key: 'service' },
            { label: 'URL', key: 'url' },
            { label: 'Events', key: 'events' },
            { label: 'Status', key: 'status' },
            { label: 'Failures', key: 'failures' },
            { label: 'Last OK', key: 'last_ok' },
            { label: 'Actions', key: 'actions' },
          ],
          rows,
          'No IPN endpoints configured across any service.'
        )}
      </div>
    `;

    // Store services for modal use
    container.__ipnServices = services;
    document.getElementById('add-ipn-btn')?.addEventListener('click', () => Pages._addIpnModal(services));
    if (window.lucide) lucide.createIcons();
  },

  _addIpnModal(services) {
    const ALL_EVENTS = ['payment.success','payment.failed','payment.expired','payment.cancelled','refund.requested','refund.approved','refund.completed','refund.rejected','bill.created','bill.cancelled'];
    Modal.show('Add IPN Endpoint', `
      <form id="add-ipn-form">
        <div class="form-group">
          <label class="form-label">Service</label>
          <select id="ipn-svc" class="form-input">
            ${services.map(s => `<option value="${s.id}">${s.display_name} (${s.slug})</option>`).join('')}
          </select>
        </div>
        ${Components.renderInput('ipn-url', 'Webhook URL', 'url', 'https://yourapp.com/webhook', '', true)}
        <div class="form-group">
          <label class="form-label">Events (select all that apply)</label>
          <div class="checkbox-group">
            ${ALL_EVENTS.map(ev => `
              <label class="checkbox-label">
                <input type="checkbox" name="ipn-events" value="${ev}" checked> ${ev}
              </label>
            `).join('')}
          </div>
        </div>
        <div id="add-ipn-error" class="form-error hidden"></div>
      </form>
    `, [
      `<button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>`,
      `<button class="btn btn-primary" onclick="Pages._submitAddIpn()"><i data-lucide="plus"></i> Create</button>`
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
      // Show the auto-generated secret ONCE
      Modal.show('⚠️ Save Your Webhook Secret', `
        <div class="alert-warning p-16 rounded-8 mb-16">
          <strong>This secret will NOT be shown again.</strong> Copy it now and store it securely.
          Your server must use this to verify the <code>X-Trialvo-Pay-Signature</code> header.
        </div>
        <div class="key-reveal">
          <div class="key-display">
            <code id="ipn-secret-display">${res.secret}</code>
            <button class="btn btn-ghost sm" onclick="navigator.clipboard.writeText('${res.secret}').then(()=>Toast.success('Copied!'))">
              <i data-lucide="copy"></i> Copy
            </button>
          </div>
        </div>
        <div class="detail-grid mt-16">
          ${Components.renderDetailRow('Endpoint ID', `<code>${res.id}</code>`)}
          ${Components.renderDetailRow('URL', `<code>${res.url}</code>`)}
          ${Components.renderDetailRow('Events', res.events?.join(', '))}
        </div>
      `, [
        `<button class="btn btn-primary" onclick="Modal.close(); Pages.ipn(document.getElementById('page-content'))">Done — I saved my secret</button>`
      ]);
      if (window.lucide) lucide.createIcons();
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('hidden');
    }
  },

  _editIpnModal(id, url, events, isActive) {
    const ALL_EVENTS = ['payment.success','payment.failed','payment.expired','payment.cancelled','refund.requested','refund.approved','refund.completed','refund.rejected','bill.created','bill.cancelled'];
    Modal.show('Edit IPN Endpoint', `
      <form id="edit-ipn-form">
        ${Components.renderInput('edit-ipn-url', 'Webhook URL', 'url', '', url, true)}
        <div class="form-group">
          <label class="form-label">Events</label>
          <div class="checkbox-group">
            ${ALL_EVENTS.map(ev => `
              <label class="checkbox-label">
                <input type="checkbox" name="edit-ipn-events" value="${ev}" ${events.includes(ev) ? 'checked' : ''}> ${ev}
              </label>
            `).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="edit-ipn-active" ${isActive ? 'checked' : ''}> Active (uncheck to disable deliveries)
          </label>
        </div>
        <div id="edit-ipn-error" class="form-error hidden"></div>
      </form>
    `, [
      `<button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>`,
      `<button class="btn btn-primary" onclick="Pages._submitEditIpn('${id}')"><i data-lucide="save"></i> Save Changes</button>`
    ]);
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
      Toast.success('Endpoint updated');
      Pages.ipn(document.getElementById('page-content'));
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('hidden');
    }
  },

  async _testIpnEndpoint(id) {
    Toast.info('Sending test ping…');
    try {
      const res = await API.testIpnEndpoint(id);
      if (res.success) {
        Toast.success(`Test ping delivered! HTTP ${res.http_status}`);
      } else {
        Toast.error(`Test failed: ${res.error || `HTTP ${res.http_status}`}`);
      }
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async _deleteIpnEndpoint(id) {
    if (!confirm('Delete this IPN endpoint? This cannot be undone.')) return;
    try {
      await API.deleteIpnEndpoint(id);
      Toast.success('Endpoint deleted');
      Pages.ipn(document.getElementById('page-content'));
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async _viewIpnDeliveries(endpointId, url) {
    try {
      const res = await API.getIpnDeliveries(endpointId);
      const deliveries = res.data || [];

      Modal.show(`Delivery Logs — ${url.length > 40 ? url.slice(0,40)+'…' : url}`, `
        <div style="max-height:420px;overflow-y:auto">
          ${deliveries.length === 0
            ? '<p class="p-16 text-muted">No deliveries recorded yet.</p>'
            : Components.renderTable(
              [
                { label: 'Event', key: 'event' },
                { label: 'Status', key: 'status' },
                { label: 'HTTP', key: 'http' },
                { label: 'Attempts', key: 'attempts' },
                { label: 'Time', key: 'time' },
              ],
              deliveries.map(d => ({
                event: `<code class="code-tag sm">${d.event_type}</code>`,
                status: d.status === 'delivered'
                  ? '<span class="badge badge-success">delivered</span>'
                  : d.status === 'exhausted'
                  ? '<span class="badge badge-danger">exhausted</span>'
                  : '<span class="badge badge-warning">' + d.status + '</span>',
                http: d.http_status ? `<code>${d.http_status}</code>` : '—',
                attempts: `${d.attempt_count}/${d.max_attempts}`,
                time: formatDate(d.created_at),
              })),
              'No deliveries'
            )
          }
        </div>
      `, [`<button class="btn btn-ghost" onclick="Modal.close()">Close</button>`]);
      if (window.lucide) lucide.createIcons();
    } catch (e) {
      Toast.error(e.message);
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT LOGS
  // ═══════════════════════════════════════════════════════════════════════════

  async audit(container) {
    let page = 1, limit = 50;
    const load = async () => {
      const data = await API.getAuditLogs({ limit, offset: (page-1)*limit });
      const items = data.data || data.logs || data;
      renderList(items, data.total || items.length || 0);
    };

    const renderList = (logs, total) => {
      container.innerHTML = `
        ${Components.renderPageHeader('Audit Logs', `${total.toLocaleString()} events logged`)}
        <div class="card">
          ${Components.renderTable(
            [
              { label: 'Action', key: 'action' },
              { label: 'Actor', key: 'actor' },
              { label: 'Resource', key: 'resource' },
              { label: 'IP', key: 'ip' },
              { label: 'Time', key: 'time' },
            ],
            logs.map(l => ({
              action: `<code class="code-tag sm">${l.action}</code>`,
              actor: `<span class="badge badge-info">${l.actor_type}</span> ${l.actor_id?.slice(0, 8) || '—'}`,
              resource: l.resource_type ? `${l.resource_type}:${l.resource_id?.slice(0,8)}` : '—',
              ip: l.ip_address || '—',
              time: formatDate(l.created_at),
            })),
            'No audit events'
          )}
          ${renderPagination(page, total, limit, `(p) => { page=p; Pages.audit(document.getElementById('page-content')); }`)}
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    };

    try { container.innerHTML = Components.renderSkeleton(); await load(); }
    catch (e) { container.innerHTML = Components.renderError(e.message); }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMINISTRATORS
  // ═══════════════════════════════════════════════════════════════════════════

  async admins(container) {
    try {
      container.innerHTML = Components.renderSkeleton();
      const data = await API.getAdmins();
      const admins = data.data || data.admins || data;

      container.innerHTML = `
        ${Components.renderPageHeader('Administrators', 'Admin accounts and 2FA management',
          `<button class="btn btn-primary" id="add-admin-btn"><i data-lucide="user-plus"></i> Add Admin</button>`)}
        <div class="card">
          ${Components.renderTable(
            [
              { label: 'Email', key: 'email' },
              { label: 'Name', key: 'name' },
              { label: 'Role', key: 'role' },
              { label: '2FA', key: 'twofa' },
              { label: 'Status', key: 'status' },
              { label: 'Last Login', key: 'last_login' },
            ],
            admins.map(a => ({
              email: a.email,
              name: a.display_name || '—',
              role: `<span class="badge badge-info">${a.role}</span>`,
              twofa: a.is_2fa_enabled ? '<span class="badge badge-success"><i data-lucide="shield-check"></i> Enabled</span>' : '<span class="badge badge-neutral">Disabled</span>',
              status: statusBadge(a.is_active ? 'active' : 'inactive'),
              last_login: formatDate(a.last_login_at),
            })),
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

      const rows = merchants.map(m => {
        const svc = services.find(s => s.id === m.service_id);
        return `<tr>
          <td><div class="fw-500">${m.email}</div><div class="text-xs text-muted">${m.display_name || '—'}</div></td>
          <td>${svc ? svc.display_name : m.service_id.substring(0,8)}</td>
          <td>${m.role}</td>
          <td>${m.is_active
            ? '<span class="badge badge-success">Active</span>'
            : '<span class="badge badge-danger">Inactive</span>'}</td>
          <td>${m.last_login_at ? formatDate(m.last_login_at) : 'Never'}</td>
          <td>
            <div class="flex gap-xs">
              <button class="btn btn-ghost btn-sm" title="${m.is_active ? 'Deactivate' : 'Activate'}" onclick="Pages._toggleMerchant('${m.id}', ${!m.is_active})">${m.is_active ? '🚫' : '✅'}</button>
              <button class="btn btn-ghost btn-sm" title="Reset Password" onclick="Pages._resetMerchantPassword('${m.id}')">🔑</button>
            </div>
          </td>
        </tr>`;
      }).join('');

      container.innerHTML = `
        ${Components.renderPageHeader('Merchants', 'Manage developer accounts linked to services', `<button class="btn btn-primary" onclick="Pages._showCreateMerchant()"><i data-lucide="plus"></i> Create Merchant</button>`)}
        <div class="card">
          <table class="table">
            <thead><tr><th>Email</th><th>Service</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted)">No merchant accounts yet</td></tr>'}</tbody>
          </table>
        </div>
      `;
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
    if (!confirm(`Are you sure you want to ${action} this merchant?`)) return;
    try {
      await API.toggleMerchant(id, active);
      Toast.success(`Merchant ${action}d`);
      Router.navigate('/admin/merchants');
    } catch (e) { Toast.error(e.message); }
  },

  async _resetMerchantPassword(id) {
    const password = prompt('Enter new password (min 8 chars):');
    if (!password || password.length < 8) return Toast.error('Password must be at least 8 characters');
    try {
      await API.resetMerchantPassword(id, password);
      Toast.success('Password reset. All sessions revoked.');
    } catch (e) { Toast.error(e.message); }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESS FLOW PAGE
  // ═══════════════════════════════════════════════════════════════════════════

  async flow(container) {
    const node = (icon, label, sub = '', colorClass = 'brand') => `
      <div class="flow-node">
        <div class="flow-node-icon ${colorClass}"><i data-lucide="${icon}"></i></div>
        <div class="flow-node-label">${label}</div>
        ${sub ? `<div class="flow-node-sub">${sub}</div>` : ''}
      </div>`;
    const arrow = () => `<div class="flow-arrow"><i data-lucide="chevron-right"></i></div>`;
    const listItem = (num, title, desc) => `
      <div class="flow-list-item">
        <div class="flow-list-num">${num}</div>
        <div class="flow-list-content"><h4>${title}</h4><p>${desc}</p></div>
      </div>`;

    container.innerHTML = `
      <div class="page-content">
        <div class="page-header">
          <div class="page-title-wrap">
            <h1 class="page-title">Process Flow</h1>
            <p class="page-subtitle">End-to-end Trialvo Pay system lifecycle — from onboarding to payment settlement</p>
          </div>
        </div>

        <div class="flow-page">

          <!-- ─── Diagram 1: Onboarding ─── -->
          <div class="card flow-section">
            <div class="flow-section-title">
              <i data-lucide="user-plus"></i>
              Diagram 1 — Merchant Onboarding (Admin-controlled)
            </div>
            <div class="flow-diagram">
              ${node('user-cog', 'Admin', 'Creates service', 'brand')}
              ${arrow()}
              ${node('layers', 'Service Created', 'Slug, commission, mode', 'info')}
              ${arrow()}
              ${node('store', 'Merchant Account', 'Admin creates', 'brand')}
              ${arrow()}
              ${node('mail', 'Credentials Shared', 'Email + password', 'warning')}
              ${arrow()}
              ${node('log-in', 'Merchant Logs In', 'Changes password', 'success')}
              ${arrow()}
              ${node('key-round', 'Generates API Key', 'Self-service', 'success')}
              ${arrow()}
              ${node('webhook', 'Sets Webhooks', 'IPN endpoints', 'success')}
              ${arrow()}
              ${node('check-circle', 'Ready', 'Integration live', 'success')}
            </div>
            <div class="flow-list" style="margin-top:24px">
              ${listItem(1, 'Admin creates a Service', 'Set the service name, slug, EPS mode (sandbox/live), commission rate, and default success/fail/cancel URLs.')}
              ${listItem(2, 'Admin creates Merchant Account', 'One merchant account per service. Admin sets the email and temporary password, then shares credentials securely.')}
              ${listItem(3, 'Merchant self-onboards', 'Merchant logs in, changes password, generates their API key, and configures their webhook endpoints — all without admin involvement.')}
              ${listItem(4, 'Integration is live', 'Merchant integrates using their Service ID + API Key. Trialvo Pay routes their bills through EPS.')}
            </div>
          </div>

          <!-- ─── Diagram 2: Payment Flow ─── -->
          <div class="card flow-section">
            <div class="flow-section-title">
              <i data-lucide="credit-card"></i>
              Diagram 2 — Payment Flow
            </div>
            <div class="flow-diagram">
              ${node('code-2', 'Merchant Backend', 'POST /api/v1/bills', 'brand')}
              ${arrow()}
              ${node('server', 'Trialvo Pay', 'Validates + creates bill', 'info')}
              ${arrow()}
              ${node('external-link', 'pay_url Returned', 'Redirect customer', 'warning')}
              ${arrow()}
              ${node('layout', 'Payment Page', 'Customer selects method', 'info')}
              ${arrow()}
              ${node('building-2', 'EPS Gateway', 'bKash/Nagad/Card', 'warning')}
              ${arrow()}
              ${node('zap', 'EPS Callback', 'Success/Fail/Cancel', 'warning')}
            </div>
            <div class="flow-diagram" style="margin-top:4px">
              ${node('shield-check', 'Trialvo Pay Verifies', 'check_status API', 'success')}
              ${arrow()}
              ${node('database', 'DB Updated', 'Bill + Transaction', 'brand')}
              ${arrow()}
              ${node('webhook', 'IPN Dispatched', 'To merchant endpoints', 'info')}
              ${arrow()}
              ${node('check-circle', 'Merchant Fulfilled', 'Order processed', 'success')}
              ${arrow()}
              ${node('user', 'Customer Redirected', 'success_url / fail_url', 'info')}
            </div>
            <div class="docs-callout warn" style="margin-top:20px">
              <div class="docs-callout-title"><i data-lucide="alert-triangle"></i> Critical: Always use IPN, never redirect</div>
              <p>The customer redirect to success_url is for UX only. The IPN webhook is the authoritative payment confirmation. Never fulfill orders based on the redirect alone — it can be spoofed or missed.</p>
            </div>
          </div>

          <!-- ─── Diagram 3: Refund Flow ─── -->
          <div class="card flow-section">
            <div class="flow-section-title">
              <i data-lucide="rotate-ccw"></i>
              Diagram 3 — Refund Flow
            </div>
            <div class="flow-diagram">
              ${node('code-2', 'Merchant Backend', 'POST /api/v1/refunds', 'brand')}
              ${arrow()}
              ${node('server', 'Trialvo Pay', 'Creates refund request', 'info')}
              ${arrow()}
              ${node('clock', 'Pending Review', 'Status: requested', 'warning')}
              ${arrow()}
              ${node('user-cog', 'Admin Reviews', 'Admin panel → Refunds', 'brand')}
              ${arrow()}
              ${node('git-branch', 'Decision', 'Approve or Reject', 'brand')}
            </div>
            <div class="flow-diagram" style="margin-top:4px">
              ${node('check-circle', 'Approved', 'Refund processed', 'success')}
              <div class="flow-arrow" style="color:var(--color-text-4)"><i data-lucide="chevron-right"></i></div>
              ${node('webhook', 'IPN Sent', 'refund.approved event', 'success')}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              ${node('x-circle', 'Rejected', 'With reason', 'danger')}
              <div class="flow-arrow" style="color:var(--color-text-4)"><i data-lucide="chevron-right"></i></div>
              ${node('webhook', 'IPN Sent', 'refund.rejected event', 'danger')}
            </div>
          </div>

          <!-- ─── Diagram 4: IPN Delivery ─── -->
          <div class="card flow-section">
            <div class="flow-section-title">
              <i data-lucide="send"></i>
              Diagram 4 — IPN Delivery & Retry
            </div>
            <div class="flow-diagram">
              ${node('zap', 'Event Triggered', 'payment.success etc', 'brand')}
              ${arrow()}
              ${node('webhook', 'Find Endpoints', 'Subscribed to event', 'info')}
              ${arrow()}
              ${node('shield', 'Sign Payload', 'HMAC-SHA256 secret', 'brand')}
              ${arrow()}
              ${node('send', 'POST to URL', 'With X-Signature', 'info')}
              ${arrow()}
              ${node('git-branch', 'HTTP 2xx?', 'Check response', 'warning')}
            </div>
            <div class="flow-diagram" style="margin-top:4px">
              ${node('check-circle', 'Delivered', 'Status: delivered', 'success')}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              ${node('clock', 'Retry Queue', '30s → 2m → 8m → 30m → 2h', 'warning')}
              ${arrow()}
              ${node('refresh-cw', 'Retry Attempt', 'Up to 5 retries', 'warning')}
              ${arrow()}
              ${node('x-circle', 'Exhausted', 'All retries failed', 'danger')}
            </div>
            <div class="docs-callout tip" style="margin-top:20px">
              <div class="docs-callout-title"><i data-lucide="info"></i> Delivery tracking</div>
              <p>Every delivery attempt is logged with HTTP status, response body, and timestamps. Merchants can view delivery history in their portal under <strong>Webhooks → Deliveries</strong>. Admins can view all IPN endpoints under <strong>IPN Endpoints</strong>.</p>
            </div>
          </div>

          <!-- ─── Diagram 5: IPN Architecture ─── -->
          <div class="card flow-section">
            <div class="flow-section-title">
              <i data-lucide="network"></i>
              Diagram 5 &mdash; IPN Architecture &amp; Event Reference
            </div>

            <p style="font-size:0.8125rem;color:var(--color-text-2);margin-bottom:20px">
              IPN (Instant Payment Notification) is Trialvo Pay's push-notification system. When a payment event occurs,
              Trialvo Pay signs a JSON payload with the merchant's webhook secret and POSTs it to every subscribed endpoint.
              It is the <strong style="color:var(--color-text)">only authoritative source of truth</strong> —
              never rely on browser redirects alone.
            </p>

            <!-- Full IPN chain from EPS to Merchant -->
            <div style="margin-bottom:28px">
              <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-3);margin-bottom:12px">Full IPN chain — from EPS to Merchant</div>
              <div class="flow-diagram">
                ${node('building-2', 'EPS Gateway', 'Payment processed', 'warning')}
                ${arrow()}
                ${node('zap', 'EPS Callback', '/eps/callback', 'warning')}
                ${arrow()}
                ${node('shield-check', 'Verify EPS Sig', 'HMAC from EPS', 'brand')}
                ${arrow()}
                ${node('database', 'Bill Updated', 'Status + transaction', 'info')}
                ${arrow()}
                ${node('zap', 'Event Emitted', 'payment.success etc', 'brand')}
                ${arrow()}
                ${node('search', 'Find Webhooks', 'Active + subscribed', 'info')}
                ${arrow()}
                ${node('lock', 'Sign Payload', 'X-Trialvo-Pay-Signature', 'brand')}
                ${arrow()}
                ${node('send', 'POST to URL', 'Merchant endpoint', 'success')}
              </div>
            </div>

            <!-- IPN Event Types Table -->
            <div style="margin-bottom:28px">
              <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-3);margin-bottom:12px">IPN Event Types</div>
              <table class="docs-perm-table">
                <thead><tr><th>Event</th><th>Trigger</th><th>Bill Status After</th></tr></thead>
                <tbody>
                  <tr><td><code>payment.success</code></td><td>EPS confirms payment successfully received</td><td><code>paid</code></td></tr>
                  <tr><td><code>payment.failed</code></td><td>EPS reports payment failure</td><td><code>failed</code></td></tr>
                  <tr><td><code>payment.cancelled</code></td><td>Customer cancels on EPS payment page</td><td><code>cancelled</code></td></tr>
                  <tr><td><code>refund.approved</code></td><td>Admin approves a refund request</td><td><code>refunded</code></td></tr>
                  <tr><td><code>refund.rejected</code></td><td>Admin rejects a refund request</td><td>unchanged</td></tr>
                </tbody>
              </table>
            </div>

            <!-- IPN Payload Fields -->
            <div style="margin-bottom:28px">
              <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-3);margin-bottom:12px">IPN Payload Structure (JSON body sent to merchant)</div>
              <table class="docs-perm-table">
                <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
                <tbody>
                  <tr><td><code>event</code></td><td>string</td><td>Event type — e.g. <code>payment.success</code></td></tr>
                  <tr><td><code>bill_token</code></td><td>string</td><td>Merchant's original bill reference</td></tr>
                  <tr><td><code>amount</code></td><td>string</td><td>Transaction amount in BDT</td></tr>
                  <tr><td><code>currency</code></td><td>string</td><td>Always <code>BDT</code></td></tr>
                  <tr><td><code>status</code></td><td>string</td><td>Bill status after the event</td></tr>
                  <tr><td><code>gateway_provider</code></td><td>string</td><td>Payment method used (bkash, nagad, card, etc)</td></tr>
                  <tr><td><code>eps_merchant_tx_id</code></td><td>string</td><td>EPS gateway transaction reference</td></tr>
                  <tr><td><code>timestamp</code></td><td>ISO 8601</td><td>Event time in UTC</td></tr>
                  <tr><td><code>metadata</code></td><td>object / null</td><td>Custom data passed at bill creation time</td></tr>
                  <tr><td><code>refund_amount</code></td><td>string / null</td><td>Refund amount (refund events only)</td></tr>
                  <tr><td><code>refund_reason</code></td><td>string / null</td><td>Reason for refund (refund events only)</td></tr>
                </tbody>
              </table>
            </div>

            <!-- Signature Verification Steps -->
            <div style="margin-bottom:0">
              <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-3);margin-bottom:12px">Signature Verification — X-Trialvo-Pay-Signature header</div>
              <p style="font-size:0.8125rem;color:var(--color-text-2);margin-bottom:14px">
                Every IPN POST includes the header <code style="font-size:0.78em;background:var(--color-surface-2);padding:2px 6px;border-radius:4px;color:var(--color-brand-2)">X-Trialvo-Pay-Signature</code>.
                Merchants must verify this before trusting the payload:
              </p>
              <div class="flow-list">
                ${listItem(1, 'Get the raw request body bytes (before JSON parsing)', 'Never re-serialize the parsed JSON to verify — byte order must be exact to match the signature.')}
                ${listItem(2, 'Compute HMAC-SHA256(raw_body, webhook_secret)', 'Use the secret shown when the webhook endpoint was created. It is not recoverable after creation — regenerate and update if lost.')}
                ${listItem(3, 'Hex-encode the digest and compare with header', 'Use constant-time comparison (e.g. crypto.timingSafeEqual in Node, hmac.compare_digest in Python) to prevent timing attacks.')}
                ${listItem(4, 'Respond HTTP 2xx within 10 seconds', 'If your endpoint takes longer or returns a non-2xx, Trialvo Pay retries: 30s → 2m → 8m → 30m → 2h (max 5 retries). After 5 failures the delivery is marked exhausted.')}
              </div>
            </div>

            <div class="docs-callout warn" style="margin-top:20px">
              <div class="docs-callout-title"><i data-lucide="alert-triangle"></i> Never skip signature verification</div>
              <p>Any public URL that accepts IPN without verifying the <code>X-Trialvo-Pay-Signature</code> header can be spoofed by a third party sending fake payment.success events. Always verify before fulfilling orders or crediting accounts.</p>
            </div>
          </div>

        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN DOCUMENTATION PAGE
  // ═══════════════════════════════════════════════════════════════════════════

  async docs(container) {
    container.innerHTML = `
      <div class="page-content">
        <div class="page-header">
          <div class="page-title-wrap">
            <h1 class="page-title">Admin Guide</h1>
            <p class="page-subtitle">Operations reference — what only the admin can do and how to do it</p>
          </div>
          <a href="/docs" target="_blank" class="btn btn-outline btn-sm">
            <i data-lucide="code-2"></i> API Docs (for merchants)
          </a>
        </div>

        <div class="admin-docs card" style="padding:32px">
          <div class="docs-section">

            <h2><i data-lucide="user-plus"></i> 1. Onboarding a New Merchant</h2>
            <p>Merchant registration is <strong>admin-only</strong>. Merchants cannot self-register. Follow these steps:</p>

            <h3>Step 1 — Create a Service</h3>
            <p>Navigate to <strong>Services → New Service</strong>. Fill in:</p>
            <ul>
              <li><strong>Display Name</strong> — merchant's project name (e.g. "GameStore")</li>
              <li><strong>Slug</strong> — URL-safe identifier (e.g. <code>gamestore</code>)</li>
              <li><strong>Mode</strong> — <code>sandbox</code> for testing, <code>live</code> for production</li>
              <li><strong>Commission Rate</strong> — percentage (e.g. <code>2.5</code>) or set to <code>0</code> for special deals</li>
              <li><strong>Commission Type</strong> — <code>percentage</code> or <code>fixed</code></li>
              <li><strong>Success / Fail / Cancel URLs</strong> — default redirect URLs (merchant can override later)</li>
            </ul>

            <h3>Step 2 — Create the Merchant Account</h3>
            <p>Navigate to <strong>Merchants → New Merchant</strong>. Select the service you just created, provide:</p>
            <ul>
              <li><strong>Email</strong> — the developer's login email</li>
              <li><strong>Temporary Password</strong> — share this securely; merchant must change it on first login</li>
              <li><strong>Display Name</strong> — optional, shown in the merchant panel</li>
            </ul>
            <div class="docs-callout info">
              <div class="docs-callout-title"><i data-lucide="info"></i> One merchant per service</div>
              <p>Each service has exactly one merchant account. If a team has multiple developers, they share the same login.</p>
            </div>

            <h3>Step 3 — Share Credentials</h3>
            <p>Share with the merchant:</p>
            <ul>
              <li>Merchant Portal URL: <code>https://pay.trialvo.com/merchant</code></li>
              <li>Their email and temporary password</li>
            </ul>
            <p>The merchant logs in, changes their password, then generates their own API key and webhook secrets — <strong>you don't need to touch those</strong>.</p>

            <h2><i data-lucide="percent"></i> 2. Commission Management</h2>
            <p>Go to <strong>Services → [Service Name] → Edit</strong> to change commission at any time.</p>
            <table class="docs-perm-table">
              <thead><tr><th>Commission Type</th><th>How it Works</th><th>Example</th></tr></thead>
              <tbody>
                <tr><td><strong>Percentage</strong></td><td>Applied as % of transaction amount</td><td>2.5% on ৳1000 = ৳25</td></tr>
                <tr><td><strong>Fixed</strong></td><td>Fixed fee per transaction</td><td>৳15 flat per payment</td></tr>
                <tr><td><strong>Zero / Special</strong></td><td>Set rate to 0 for no commission</td><td>Partner deal, free tier</td></tr>
              </tbody>
            </table>
            <div class="docs-callout warn">
              <div class="docs-callout-title"><i data-lucide="alert-triangle"></i> Commission changes are not retroactive</div>
              <p>Changing the commission rate only affects new bills created after the change. Existing bills are not affected.</p>
            </div>

            <h2><i data-lucide="rotate-ccw"></i> 3. Refund Approval Workflow</h2>
            <p>Merchants can request refunds via API. Admin must approve or reject each refund. No automatic refund processing.</p>
            <ol>
              <li>Merchant calls <code>POST /api/v1/refunds</code> with <code>bill_token</code>, <code>refund_amount</code>, and <code>reason</code></li>
              <li>A refund request appears in <strong>Refunds</strong> with status <code>requested</code></li>
              <li>You review the request — check the bill details, amount, and merchant reason</li>
              <li>Click <strong>Approve</strong> or <strong>Reject</strong> (with a rejection reason for the merchant)</li>
              <li>Trialvo Pay sends an IPN to the merchant's webhooks: <code>refund.approved</code> or <code>refund.rejected</code></li>
            </ol>
            <div class="docs-callout info">
              <div class="docs-callout-title"><i data-lucide="info"></i> Actual refund processing</div>
              <p>Trialvo Pay marks the refund as approved, but the actual EPS refund transaction depends on your EPS gateway settings. Confirm with your EPS account whether refunds are processed automatically or require manual gateway action.</p>
            </div>

            <h2><i data-lucide="toggle-left"></i> 4. Enabling / Disabling Services & Merchants</h2>
            <h3>Disable a Service</h3>
            <p>Go to <strong>Services → [Service] → Edit → Status: Inactive</strong>. This blocks all new bills for that service. Existing in-flight bills are unaffected.</p>
            <h3>Lock / Unlock a Merchant</h3>
            <p>Go to <strong>Merchants → [Merchant] → Deactivate</strong>. This immediately blocks merchant login and API access. Use when credentials are compromised or to offboard a merchant.</p>
            <h3>Reset Merchant Password</h3>
            <p>Go to <strong>Merchants → [Merchant] → Reset Password</strong>. All existing sessions are revoked.</p>

            <h2><i data-lucide="layers"></i> 5. Sandbox vs Live Mode</h2>
            <p>Each service is independently configured as sandbox or live:</p>
            <table class="docs-perm-table">
              <thead><tr><th>Mode</th><th>EPS Environment</th><th>Real Payments</th><th>Use For</th></tr></thead>
              <tbody>
                <tr><td><code>sandbox</code></td><td>EPS test environment</td><td class="no">No</td><td>Development, testing</td></tr>
                <tr><td><code>live</code></td><td>EPS production</td><td class="yes">Yes</td><td>Production transactions</td></tr>
              </tbody>
            </table>
            <p>To switch a service from sandbox to live, go to <strong>Services → [Service] → Edit → Mode: Live</strong>. Ensure the EPS production credentials are configured in <strong>Configuration</strong> first.</p>

            <h2><i data-lucide="shield-check"></i> 6. Security & Audit</h2>
            <h3>Audit Logs</h3>
            <p>Every admin action (login, service edit, refund decision, password reset) is logged in <strong>Audit Logs</strong>. Logs include the admin email, IP address, action type, and timestamp. Logs are read-only and cannot be deleted.</p>
            <h3>Two-Factor Authentication</h3>
            <p>Admin accounts support 2FA via TOTP (Google Authenticator). Enable 2FA in <strong>Profile → Enable 2FA</strong>. Strongly recommended for all admins in production.</p>
            <h3>Admin Roles</h3>
            <p>Admin accounts have a <code>role</code> field (<code>superadmin</code> / <code>admin</code>). Role management is done from <strong>Administrators</strong>. Only superadmins can create or delete other admin accounts.</p>

            <h2><i data-lucide="settings"></i> 7. System Configuration</h2>
            <p>Under <strong>Configuration</strong>, you can manage:</p>
            <ul>
              <li><strong>EPS Credentials</strong> — API keys, store ID, merchant ID, hash key for sandbox and live</li>
              <li><strong>IPN Retry Settings</strong> — max retries, retry interval multiplier</li>
              <li><strong>Rate Limits</strong> — API requests per minute per service</li>
              <li><strong>Argon2 Parameters</strong> — password hashing memory/iterations (advanced)</li>
            </ul>
            <div class="docs-callout warn">
              <div class="docs-callout-title"><i data-lucide="alert-triangle"></i> Configuration changes take effect immediately</div>
              <p>Changes to EPS credentials immediately affect all active services using that mode. Test in sandbox before changing live credentials.</p>
            </div>

            <h2><i data-lucide="webhook"></i> 9. IPN &amp; Webhooks — Admin View</h2>
            <p>IPN (Instant Payment Notification) is how Trialvo Pay notifies merchants of payment events. As admin, you have <strong>oversight</strong> over all IPN endpoints across all merchants. Merchants manage their own webhooks — you cannot create or delete their endpoints, but you can monitor and troubleshoot.</p>

            <h3>What is an IPN?</h3>
            <p>When a bill changes status (payment succeeds, fails, is cancelled, or a refund is decided), Trialvo Pay immediately POSTs a signed JSON payload to all merchant webhook URLs that are subscribed to that event. This is called an IPN (Instant Payment Notification) — our equivalent of what Stripe calls a "webhook event".</p>

            <h3>IPN Events</h3>
            <table class="docs-perm-table">
              <thead><tr><th>Event</th><th>When It Fires</th><th>Who Can Subscribe</th></tr></thead>
              <tbody>
                <tr><td><code>payment.success</code></td><td>EPS confirms payment received</td><td>Merchant webhook</td></tr>
                <tr><td><code>payment.failed</code></td><td>EPS reports payment failure</td><td>Merchant webhook</td></tr>
                <tr><td><code>payment.cancelled</code></td><td>Customer cancels at EPS page</td><td>Merchant webhook</td></tr>
                <tr><td><code>refund.approved</code></td><td>Admin approves refund request</td><td>Merchant webhook</td></tr>
                <tr><td><code>refund.rejected</code></td><td>Admin rejects refund request</td><td>Merchant webhook</td></tr>
              </tbody>
            </table>

            <h3>How IPN Delivery Works</h3>
            <ol>
              <li>Event triggers (EPS callback or admin refund decision)</li>
              <li>Trialvo Pay finds all active webhook endpoints for that merchant subscribed to the event</li>
              <li>Trialvo Pay signs the JSON payload using <code>HMAC-SHA256(raw_body, webhook_secret)</code></li>
              <li>Trialvo Pay POSTs to each endpoint with the <code>X-Trialvo-Pay-Signature</code> header</li>
              <li>If the endpoint does not return HTTP 2xx within 10 seconds → retry queue</li>
              <li>Retry schedule: <strong>30s → 2m → 8m → 30m → 2h</strong> (up to 5 retries)</li>
              <li>After 5 failed retries → delivery status becomes <code>exhausted</code></li>
            </ol>

            <h3>IPN Payload Fields</h3>
            <table class="docs-perm-table">
              <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
              <tbody>
                <tr><td><code>event</code></td><td>string</td><td>Event type (e.g. <code>payment.success</code>)</td></tr>
                <tr><td><code>bill_token</code></td><td>string</td><td>Merchant's bill reference</td></tr>
                <tr><td><code>amount</code></td><td>string</td><td>Transaction amount in BDT</td></tr>
                <tr><td><code>currency</code></td><td>string</td><td>Always <code>BDT</code></td></tr>
                <tr><td><code>status</code></td><td>string</td><td>Bill status after event</td></tr>
                <tr><td><code>gateway_provider</code></td><td>string</td><td>bkash, nagad, etc.</td></tr>
                <tr><td><code>eps_merchant_tx_id</code></td><td>string</td><td>EPS transaction ID</td></tr>
                <tr><td><code>timestamp</code></td><td>ISO 8601</td><td>Event time in UTC</td></tr>
                <tr><td><code>metadata</code></td><td>object / null</td><td>Custom data from bill creation</td></tr>
                <tr><td><code>refund_amount</code></td><td>string / null</td><td>Refund amount (refund events only)</td></tr>
                <tr><td><code>refund_reason</code></td><td>string / null</td><td>Reason (refund events only)</td></tr>
              </tbody>
            </table>

            <h3>Admin Monitoring — IPN Endpoints Page</h3>
            <p>Navigate to <strong>IPN Endpoints</strong> in the sidebar to see a system-wide view of all merchant webhook endpoints across all services. You can:</p>
            <ul>
              <li>See which endpoints are <strong>active or inactive</strong></li>
              <li>See which <strong>events each endpoint subscribes to</strong></li>
              <li>See <strong>delivery statistics</strong> (last delivery, failure count)</li>
              <li>View per-delivery logs — HTTP status codes, response bodies, timestamps, and retry attempts</li>
            </ul>
            <div class="docs-callout info">
              <div class="docs-callout-title"><i data-lucide="info"></i> Merchants manage their own webhooks</div>
              <p>Admins can <strong>view</strong> all IPN endpoints and delivery logs across all services, but <strong>cannot create, edit, or delete</strong> a merchant's webhook endpoints. Merchants self-manage their endpoints from the Merchant Portal (Webhooks page). The admin role is visibility and troubleshooting.</p>
            </div>

            <h3>Troubleshooting Failed IPN Deliveries</h3>
            <ol>
              <li>Navigate to <strong>IPN Endpoints</strong> → click the endpoint → view <strong>Delivery History</strong></li>
              <li>Check the <strong>HTTP status code</strong> returned by the merchant's server</li>
              <li>Check the <strong>error message</strong> — common causes: timeout (10s exceeded), TLS error, DNS failure, non-2xx response</li>
              <li>If all 5 retries exhausted, inform the merchant to check their endpoint server</li>
              <li>Merchants can also view their own delivery history from the Merchant Portal → Webhooks → Deliveries</li>
            </ol>
            <div class="docs-callout warn">
              <div class="docs-callout-title"><i data-lucide="alert-triangle"></i> Exhausted deliveries are not re-triggered automatically</div>
              <p>Once a delivery is marked <code>exhausted</code>, it will not be retried again. The merchant must either fix their endpoint and await the next real event, or use the <strong>Test Webhook</strong> feature in the Merchant Portal to send a test payload to verify their endpoint is working.</p>
            </div>

            <h2><i data-lucide="book-open"></i> 10. What Admin Can vs Cannot Do</h2>
            <p>Clear separation of responsibilities between admin and merchant:</p>
            <table class="docs-perm-table">
              <thead>
                <tr><th>Action</th><th>Admin</th><th>Merchant</th></tr>
              </thead>
              <tbody>
                <tr><td>Create/delete service</td><td class="yes">✓ Yes</td><td class="no">No</td></tr>
                <tr><td>Create/delete merchant account</td><td class="yes">✓ Yes</td><td class="no">No</td></tr>
                <tr><td>Set/change commission rate</td><td class="yes">✓ Yes</td><td class="no">No</td></tr>
                <tr><td>Enable/disable service</td><td class="yes">✓ Yes</td><td class="no">No</td></tr>
                <tr><td>Approve/reject refunds</td><td class="yes">✓ Yes</td><td class="no">No (request only)</td></tr>
                <tr><td>View all services' transactions</td><td class="yes">✓ Yes</td><td class="no">Own service only</td></tr>
                <tr><td>View audit logs</td><td class="yes">✓ Yes</td><td class="no">No</td></tr>
                <tr><td>Manage EPS configuration</td><td class="yes">✓ Yes</td><td class="no">No</td></tr>
                <tr><td>View all IPN endpoints (oversight)</td><td class="yes">✓ Yes</td><td class="no">Own service only</td></tr>
                <tr><td>View all delivery logs</td><td class="yes">✓ Yes</td><td class="no">Own service only</td></tr>
                <tr><td>Create / edit / delete webhooks</td><td class="no">No</td><td class="yes">✓ Yes (own service)</td></tr>
                <tr><td>Generate API keys</td><td class="yes">✓ Yes (via service)</td><td class="yes">✓ Yes (own service)</td></tr>
                <tr><td>Update service URLs</td><td class="yes">✓ Yes</td><td class="yes">✓ Yes (own service)</td></tr>
                <tr><td>View own transactions</td><td class="yes">✓ Yes</td><td class="yes">✓ Yes (own service)</td></tr>
                <tr><td>Request refunds</td><td class="yes">✓ Yes</td><td class="yes">✓ Yes (own bills)</td></tr>
              </tbody>
            </table>

          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

};
