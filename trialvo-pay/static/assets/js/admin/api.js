/**
 * Trialvo Pay Admin API Client
 * Wraps all fetch calls to admin endpoints with Bearer token auth
 * Exposes a global `API` object used throughout the SPA
 */

const API_BASE = '/api/admin';

const API = {
  _token: null,

  setToken(token) {
    this._token = token;
  },

  async _request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (this._token) headers['Authorization'] = `Bearer ${this._token}`;

    const opts = { method, headers };
    if (body !== null && body !== undefined) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);

    if (res.status === 401) {
      // Auto-logout: clear session and redirect to login
      if (typeof Auth !== 'undefined') Auth.clear();
      if (typeof Toast !== 'undefined') Toast.warning('Session expired. Please sign in again.');
      // Redirect to login with expired flag (avoid loop if already on login)
      if (!location.pathname.includes('/admin/login')) {
        if (typeof Router !== 'undefined') {
          Router.navigate('/admin/login?expired=true', true);
        } else {
          location.href = '/admin/login?expired=true';
        }
      }
      throw new Error('Session expired — please sign in again');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
    return data;
  },

  _get:    (path) => API._request('GET',    path, null),
  _post:   (path, body) => API._request('POST',   path, body),
  _patch:  (path, body) => API._request('PATCH',  path, body),
  _put:    (path, body) => API._request('PUT',    path, body),
  _delete: (path) => API._request('DELETE', path, null),

  // ─── Auth ──────────────────────────────────────────────────────────────────
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async verify2FA(tempToken, code, useBackup = false) {
    const res = await fetch(`${API_BASE}/auth/2fa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temp_token: tempToken, code, use_backup: useBackup }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || '2FA verification failed');
    return data;
  },

  async logout() {
    try { await this._post('/auth/logout'); } catch {}
  },

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  getDashboardStats: () => API._get('/dashboard/stats'),

  // ─── Services ──────────────────────────────────────────────────────────────
  getServices: ({ limit = 25, offset = 0 } = {}) =>
    API._get(`/services?limit=${limit}&offset=${offset}`),
  getService:  (id) => API._get(`/services/${id}`),
  createService: (data) => API._post('/services', data),
  updateService: (id, data) => API._patch(`/services/${id}`, data),
  toggleService: (id, isActive) => API._patch(`/services/${id}/active/${isActive}`, {}),
  rotateServiceKey: (id) => API._post(`/services/${id}/rotate-key`),
  getServiceKeys: (id) => API._get(`/services/${id}/keys`),
  generateServiceKey: (id) => API._post(`/services/${id}/keys`, {}),
  revokeServiceKey: (id, keyId, reason) => API._request('DELETE', `/services/${id}/keys/${keyId}`, { reason }),
  revealServiceKey: (id, keyId) => API._get(`/services/${id}/keys/${keyId}/reveal`),

  // ─── Transactions ──────────────────────────────────────────────────────────
  getTransactions: ({ limit = 25, offset = 0, status = '', service_id = '' } = {}) => {
    const q = new URLSearchParams({ limit, offset });
    if (status) q.set('status', status);
    if (service_id) q.set('service_id', service_id);
    return API._get(`/transactions?${q}`);
  },
  getTransaction: (id) => API._get(`/transactions/${id}`),

  // ─── Bills ─────────────────────────────────────────────────────────────────
  getBills: ({ limit = 25, offset = 0, status = '' } = {}) => {
    const q = new URLSearchParams({ limit, offset });
    if (status) q.set('status', status);
    return API._get(`/bills?${q}`);
  },
  getBill: (id) => API._get(`/bills/${id}`),

  // ─── Refunds ───────────────────────────────────────────────────────────────
  getRefunds: ({ limit = 25, offset = 0, status = '' } = {}) => {
    const q = new URLSearchParams({ limit, offset });
    if (status) q.set('status', status);
    return API._get(`/refunds?${q}`);
  },
  getRefund: (id) => API._get(`/refunds/${id}`),
  approveRefund: (id, notes) => API._post(`/refunds/${id}/approve`, { admin_notes: notes }),
  rejectRefund:  (id, reason) => API._post(`/refunds/${id}/reject`, { rejection_reason: reason }),

  // ─── Customers ─────────────────────────────────────────────────────────────
  getCustomers: ({ limit = 25, offset = 0 } = {}) =>
    API._get(`/customers?limit=${limit}&offset=${offset}`),
  searchCustomers: (q, limit = 25, offset = 0) =>
    API._get(`/customers/search?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`),
  getCustomer:  (id) => API._get(`/customers/${id}`),
  blockCustomer:   (id, reason) => API._post(`/customers/${id}/block`, { reason }),
  unblockCustomer: (id) => API._post(`/customers/${id}/unblock`),

  // ─── Config ────────────────────────────────────────────────────────────────
  getConfig: () => API._get('/config'),
  updateConfig: (category, key, value) =>
    API._patch(`/config/${encodeURIComponent(category)}/${encodeURIComponent(key)}`, { value }),

  // ─── IPN ───────────────────────────────────────────────────────────────────
  getAllIpnEndpoints: () => API._get('/ipn/endpoints'),
  getIpnEndpoints: (serviceId) => API._get(`/ipn/services/${serviceId}/endpoints`),
  createIpnEndpoint: (data) => API._post('/ipn/endpoints', data),
  updateIpnEndpoint: (id, data) => API._patch(`/ipn/endpoints/${id}`, data),
  deleteIpnEndpoint: (id) => API._request('DELETE', `/ipn/endpoints/${id}`),
  testIpnEndpoint: (id) => API._post(`/ipn/endpoints/${id}/test`, {}),
  getIpnDeliveries: (endpointId) => API._get(`/ipn/endpoints/${endpointId}/deliveries`),
  getRecentDeliveries: () => API._get('/ipn/deliveries/recent'),

  // ─── Audit ─────────────────────────────────────────────────────────────────
  getAuditLogs: ({ limit = 50, offset = 0 } = {}) =>
    API._get(`/audit?limit=${limit}&offset=${offset}`),

  // ─── Admins ────────────────────────────────────────────────────────────────
  getAdmins: () => API._get('/admins'),
  createAdmin: (data) => API._post('/admins', data),

  // ─── Merchants ─────────────────────────────────────────────────────────────
  getMerchants: () => API._get('/merchants'),
  createMerchant: (data) => API._post('/merchants', data),
  toggleMerchant: (id, active) => API._put(`/merchants/${id}/active/${active}`),
  resetMerchantPassword: (id, newPassword) => API._post(`/merchants/${id}/reset-password`, { new_password: newPassword }),
  updateServiceCommission: (serviceId, rate, type) => API._patch(`/services/${serviceId}/commission`, { commission_rate: rate, commission_type: type }),

  // ─── Profile / 2FA setup ───────────────────────────────────────────────────
  changePassword: (current, newPassword) =>
    API._post('/admins/me/password', { current_password: current, new_password: newPassword }),
  setup2FA: () => API._post('/admins/me/2fa/setup'),
  confirm2FASetup: (code) => API._post('/admins/me/2fa/confirm', { code }),
};
