// Trialvo Pay Merchant Portal — API Client
window.MerchantAPI = {
    token: localStorage.getItem('merchant_token'),
    merchant: JSON.parse(localStorage.getItem('merchant_user') || 'null'),

    setAuth(token, merchant) {
        this.token = token;
        this.merchant = merchant;
        localStorage.setItem('merchant_token', token);
        localStorage.setItem('merchant_user', JSON.stringify(merchant));
    },

    clearAuth() {
        this.token = null;
        this.merchant = null;
        localStorage.removeItem('merchant_token');
        localStorage.removeItem('merchant_user');
    },

    isAuthenticated() {
        return !!this.token;
    },

    async request(path, options = {}) {
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

        const resp = await fetch(`/api/merchant${path}`, { ...options, headers });

        if (resp.status === 401) {
            this.clearAuth();
            window.location.hash = '#/login';
            throw new Error('Session expired');
        }

        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Request failed');
        return data;
    },

    // Auth
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        this.setAuth(data.token, data.merchant);
        return data;
    },

    async logout() {
        try { await this.request('/auth/logout', { method: 'POST' }); } catch(e) {}
        this.clearAuth();
    },

    async me() { return this.request('/auth/me'); },
    async changePassword(current_password, new_password) {
        return this.request('/auth/change-password', { method: 'POST', body: JSON.stringify({ current_password, new_password }) });
    },

    // Dashboard
    async dashboard() { return this.request('/dashboard'); },

    // Settings
    async getSettings() { return this.request('/settings'); },
    async updateSettings(data) { return this.request('/settings', { method: 'PATCH', body: JSON.stringify(data) }); },

    // Keys
    async listKeys() { return this.request('/keys'); },
    async generateKey() { return this.request('/keys', { method: 'POST' }); },
    async revealKey(id) { return this.request(`/keys/${id}/reveal`, { method: 'POST' }); },
    async revokeKey(id) { return this.request(`/keys/${id}`, { method: 'DELETE' }); },

    // Webhooks
    async listWebhooks() { return this.request('/webhooks'); },
    async createWebhook(url, events) { return this.request('/webhooks', { method: 'POST', body: JSON.stringify({ url, events }) }); },
    async updateWebhook(id, data) { return this.request(`/webhooks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); },
    async deleteWebhook(id) { return this.request(`/webhooks/${id}`, { method: 'DELETE' }); },
    async testWebhook(id) { return this.request(`/webhooks/${id}/test`, { method: 'POST' }); },

    // Transactions
    async listTransactions(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.request(`/transactions${qs ? '?' + qs : ''}`);
    },
    async getTransaction(id) { return this.request(`/transactions/${id}`); },

    // Refunds
    async listRefunds(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.request(`/refunds${qs ? '?' + qs : ''}`);
    },
    async submitRefund(transaction_id, reason, amount) {
        const body = { transaction_id, reason };
        if (amount) body.amount = amount;
        return this.request('/refunds', { method: 'POST', body: JSON.stringify(body) });
    },

    // Deliveries
    async listDeliveries(webhookId, params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.request(`/webhooks/${webhookId}/deliveries${qs ? '?' + qs : ''}`);
    },
    async deliveryStats() { return this.request('/deliveries/stats'); },
};
