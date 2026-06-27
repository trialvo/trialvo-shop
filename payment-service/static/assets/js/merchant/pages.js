// PayVault Merchant Portal — Pages
window.MerchantPages = {

// ─── LOGIN ──────────────────────────────────────────────────────────────────
login() {
    return `<div class="login-wrapper">
        <div class="login-card">
            <div class="logo"><h1>PayVault</h1><p>Merchant Portal</p></div>
            <div class="error" id="login-error"></div>
            <form id="login-form">
                <div class="form-group"><label>Email</label><input type="email" id="login-email" required placeholder="you@company.com"></div>
                <div class="form-group"><label>Password</label><input type="password" id="login-password" required placeholder="••••••••"></div>
                <button type="submit" class="btn-login">Sign In</button>
            </form>
        </div>
    </div>`;
},

initLogin() {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('login-error');
        errEl.style.display = 'none';
        try {
            await MerchantAPI.login(
                document.getElementById('login-email').value,
                document.getElementById('login-password').value
            );
            window.location.hash = '#/dashboard';
        } catch(err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
        }
    });
},

// ─── DASHBOARD ──────────────────────────────────────────────────────────────
async dashboard() {
    const d = await MerchantAPI.dashboard();
    const rows = (d.recent_transactions || []).map(t => `<tr>
        <td style="font-family:monospace;font-size:12px">${t.merchant_tx_id}</td>
        <td>৳${MUI.formatAmount(t.amount)}</td>
        <td>${MUI.badge(t.status)}</td>
        <td>${MUI.formatDate(t.created_at)}</td>
    </tr>`);

    return `<div class="page-header"><h1>Dashboard</h1><p>Your payment service overview</p></div>
    <div class="stat-grid">
        <div class="stat-card accent"><div class="stat-label">Total Revenue</div><div class="stat-value">৳${MUI.formatAmount(d.total_revenue)}</div></div>
        <div class="stat-card success"><div class="stat-label">Today</div><div class="stat-value">৳${MUI.formatAmount(d.today_revenue)}</div></div>
        <div class="stat-card"><div class="stat-label">Total Bills</div><div class="stat-value">${d.total_bills}</div><div class="stat-sub">${d.paid_bills} paid</div></div>
        <div class="stat-card warning"><div class="stat-label">Pending Refunds</div><div class="stat-value">${d.pending_refunds}</div></div>
        <div class="stat-card ${d.failed_webhooks_24h > 0 ? 'danger' : ''}"><div class="stat-label">Failed Webhooks (24h)</div><div class="stat-value">${d.failed_webhooks_24h}</div></div>
    </div>
    <div class="card"><div class="card-header"><span class="card-title">Recent Transactions</span></div>
        ${MUI.table(['Transaction ID', 'Amount', 'Status', 'Date'], rows)}
    </div>`;
},

// ─── SETTINGS ───────────────────────────────────────────────────────────────
async settings() {
    const s = await MerchantAPI.getSettings();
    return `<div class="page-header"><h1>Settings</h1><p>Manage your service integration settings</p></div>
    <div class="card">
        <div class="card-header"><span class="card-title">Service Profile</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;font-size:13px;margin-bottom:20px">
            <div><span style="color:var(--text-muted)">Service ID:</span></div><div style="font-family:monospace;color:var(--accent)">${s.service_id} <button class="btn btn-sm btn-secondary" onclick="MUI.copyToClipboard('${s.service_id}')">Copy</button></div>
            <div><span style="color:var(--text-muted)">Slug:</span></div><div>${s.slug}</div>
            <div><span style="color:var(--text-muted)">Mode:</span></div><div>${s.is_sandbox ? MUI.badge('sandbox') : MUI.badge('live')}</div>
            <div><span style="color:var(--text-muted)">Commission:</span></div><div>${s.commission_rate}% (${s.commission_type})</div>
            <div><span style="color:var(--text-muted)">API Base URL:</span></div><div style="font-family:monospace;color:var(--accent)">${s.api_base_url}</div>
        </div>
    </div>
    <div class="card">
        <div class="card-header"><span class="card-title">Callback URLs</span><button class="btn btn-primary btn-sm" onclick="MerchantPages.saveSettings()">Save Changes</button></div>
        <form id="settings-form">
            <div class="form-group"><label>Display Name</label><input id="s-name" value="${s.display_name || ''}"></div>
            <div class="form-row">
                <div class="form-group"><label>Contact Email</label><input id="s-email" value="${s.contact_email || ''}"></div>
                <div class="form-group"><label>Contact Phone</label><input id="s-phone" value="${s.contact_phone || ''}"></div>
            </div>
            <div class="form-group"><label>Success URL</label><input id="s-success" placeholder="https://yoursite.com/payment/success" value="${s.success_url || ''}"></div>
            <div class="form-group"><label>Fail URL</label><input id="s-fail" placeholder="https://yoursite.com/payment/failed" value="${s.fail_url || ''}"></div>
            <div class="form-group"><label>Cancel URL</label><input id="s-cancel" placeholder="https://yoursite.com/payment/cancelled" value="${s.cancel_url || ''}"></div>
            <div class="form-group" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
                <label class="checkbox-label" style="display:flex;align-items:center;gap:8px;cursor:pointer">
                    <input type="checkbox" id="s-skip-preview" ${s.skip_preview ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--accent)">
                    <span>Skip Payment Preview</span>
                </label>
                <small style="color:var(--text-muted);display:block;margin-top:6px">When enabled, customers are redirected directly to the payment gateway without seeing the order summary page. Your service UI will be completely bypassed.</small>
            </div>
        </form>
    </div>`;
},

async saveSettings() {
    try {
        await MerchantAPI.updateSettings({
            display_name: document.getElementById('s-name').value || null,
            contact_email: document.getElementById('s-email').value || null,
            contact_phone: document.getElementById('s-phone').value || null,
            success_url: document.getElementById('s-success').value || null,
            fail_url: document.getElementById('s-fail').value || null,
            cancel_url: document.getElementById('s-cancel').value || null,
            skip_preview: document.getElementById('s-skip-preview')?.checked ?? false,
        });
        MUI.toast('Settings saved!', 'success');
    } catch(e) { MUI.toast(e.message, 'error'); }
},

// ─── API KEYS ───────────────────────────────────────────────────────────────
async keys() {
    const data = await MerchantAPI.listKeys();
    const keys = data.data || [];
    const keyCards = keys.map(k => `<div class="key-display">
        <span class="key-prefix">${k.key_prefix}${'•'.repeat(20)}</span>
        <span style="font-size:11px;color:var(--text-muted)">${k.last_used_at ? 'Last used: ' + MUI.formatDate(k.last_used_at) : 'Never used'}</span>
        <button class="btn btn-sm btn-secondary" onclick="MerchantPages.revealKey('${k.id}')">Reveal</button>
        <button class="btn btn-sm btn-danger" onclick="MerchantPages.revokeKey('${k.id}')">Revoke</button>
    </div>`).join('');

    return `<div class="page-header"><h1>API Keys</h1><p>Manage your integration keys</p></div>
    <div class="card">
        <div class="card-header"><span class="card-title">Active Keys</span><button class="btn btn-primary btn-sm" onclick="MerchantPages.generateKey()"><i data-lucide="plus" style="width:14px;height:14px"></i> Generate Key</button></div>
        ${keyCards || MUI.emptyState('key-round', 'No API keys', 'Generate your first API key to start integrating.')}
    </div>`;
},

async generateKey() {
    try {
        const data = await MerchantAPI.generateKey();
        const html = MUI.modal('New API Key Generated', `
            <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:16px;margin-bottom:16px">
                <p style="font-size:13px;color:var(--success);margin-bottom:12px;display:flex;align-items:center;gap:6px"><i data-lucide="alert-triangle" style="width:14px;height:14px"></i> Copy this key now — it won't be shown again in full.</p>
                <div class="key-display"><span class="key-full">${data.raw_key}</span>
                <button class="btn btn-sm btn-primary" onclick="MUI.copyToClipboard('${data.raw_key}')"><i data-lucide="copy" style="width:12px;height:12px"></i> Copy</button></div>
            </div>
        `);
        document.body.insertAdjacentHTML('beforeend', html);
        if (window.lucide) lucide.createIcons();
        MerchantApp.navigate(window.location.hash);
    } catch(e) { MUI.toast(e.message, 'error'); }
},

async revealKey(id) {
    try {
        const data = await MerchantAPI.revealKey(id);
        const html = MUI.modal('API Key', `
            <div class="key-display"><span class="key-full">${data.raw_key}</span>
            <button class="btn btn-sm btn-primary" onclick="MUI.copyToClipboard('${data.raw_key}')">Copy Full Key</button></div>
        `);
        document.body.insertAdjacentHTML('beforeend', html);
    } catch(e) { MUI.toast(e.message, 'error'); }
},

async revokeKey(id) {
    if (!confirm('Are you sure you want to revoke this key? This cannot be undone.')) return;
    try { await MerchantAPI.revokeKey(id); MUI.toast('Key revoked', 'success'); MerchantApp.navigate('#/keys'); } catch(e) { MUI.toast(e.message, 'error'); }
},

// ─── WEBHOOKS ───────────────────────────────────────────────────────────────
async webhooks() {
    const data = await MerchantAPI.listWebhooks();
    const endpoints = data.data || [];
    const validEvents = data.valid_events || [];

    const cards = endpoints.map(ep => `<div class="webhook-card">
        <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="webhook-url">${ep.url}</div>
            <div>${ep.is_active ? MUI.badge('active') : MUI.badge('inactive')}</div>
        </div>
        <div class="webhook-events">${(ep.events || []).map(e => `<span class="webhook-event">${e}</span>`).join('')}</div>
        <div class="webhook-actions">
            <button class="btn btn-sm btn-secondary" onclick="MerchantPages.testWebhook('${ep.id}')"><i data-lucide="zap" style="width:12px;height:12px"></i> Test</button>
            <button class="btn btn-sm btn-secondary" onclick="window.location.hash='#/webhooks/${ep.id}/deliveries'"><i data-lucide="list" style="width:12px;height:12px"></i> Deliveries</button>
            <button class="btn btn-sm btn-danger" onclick="MerchantPages.deleteWebhook('${ep.id}')"><i data-lucide="trash-2" style="width:12px;height:12px"></i> Delete</button>
        </div>
    </div>`).join('');

    // Store valid events for the modal
    window._validEvents = validEvents;

    return `<div class="page-header"><h1>Webhooks</h1><p>Manage IPN endpoints and event subscriptions</p></div>
    <div class="card">
        <div class="card-header"><span class="card-title">Endpoints</span><button class="btn btn-primary btn-sm" onclick="MerchantPages.showCreateWebhook()"><i data-lucide="plus" style="width:14px;height:14px"></i> Add Endpoint</button></div>
        ${cards || MUI.emptyState('webhook', 'No webhooks', 'Add a webhook endpoint to receive payment notifications.')}
    </div>`;
},

showCreateWebhook() {
    const events = (window._validEvents || []).map(e => `<label class="checkbox-item"><input type="checkbox" value="${e}" checked><span>${e}</span></label>`).join('');
    const html = MUI.modal('Add Webhook Endpoint', `
        <div class="form-group"><label>Endpoint URL</label><input id="wh-url" placeholder="https://yoursite.com/api/webhook"></div>
        <div class="form-group"><label>Events</label><div class="checkbox-group" id="wh-events">${events}</div></div>
    `, `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="MerchantPages.createWebhook()">Create</button>`);
    document.body.insertAdjacentHTML('beforeend', html);
},

async createWebhook() {
    const url = document.getElementById('wh-url').value;
    const events = [...document.querySelectorAll('#wh-events input:checked')].map(i => i.value);
    if (!url) return MUI.toast('URL is required', 'error');
    if (!events.length) return MUI.toast('Select at least one event', 'error');
    try {
        const data = await MerchantAPI.createWebhook(url, events);
        document.querySelector('.modal-overlay').remove();
        const secretHtml = MUI.modal('Webhook Secret', `
            <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:16px">
                <p style="font-size:13px;color:var(--success);margin-bottom:12px;display:flex;align-items:center;gap:6px"><i data-lucide="shield-check" style="width:14px;height:14px"></i> Save this secret — it won't be shown again. Use it to verify webhook signatures.</p>
                <div class="key-display"><span class="key-full">${data.secret}</span>
                <button class="btn btn-sm btn-primary" onclick="MUI.copyToClipboard('${data.secret}')"><i data-lucide="copy" style="width:12px;height:12px"></i> Copy</button></div>
            </div>
        `);
        document.body.insertAdjacentHTML('beforeend', secretHtml);
        if (window.lucide) lucide.createIcons();
        MerchantApp.navigate('#/webhooks');
    } catch(e) { MUI.toast(e.message, 'error'); }
},

async testWebhook(id) {
    try {
        MUI.toast('Sending test webhook...', 'info');
        const data = await MerchantAPI.testWebhook(id);
        const msg = data.success ? `Webhook responded with HTTP ${data.http_status}` : `Failed: ${data.error || 'HTTP ' + data.http_status}`;
        MUI.toast(msg, data.success ? 'success' : 'error');
    } catch(e) { MUI.toast(e.message, 'error'); }
},

async deleteWebhook(id) {
    if (!confirm('Delete this webhook endpoint?')) return;
    try { await MerchantAPI.deleteWebhook(id); MUI.toast('Webhook deleted', 'success'); MerchantApp.navigate('#/webhooks'); } catch(e) { MUI.toast(e.message, 'error'); }
},

// ─── TRANSACTIONS ───────────────────────────────────────────────────────────
async transactions() {
    const data = await MerchantAPI.listTransactions({ limit: 50 });
    const rows = (data.data || []).map(t => `<tr>
        <td style="font-family:monospace;font-size:12px">${t.eps_merchant_tx_id}</td>
        <td>৳${MUI.formatAmount(t.amount)}</td>
        <td>${t.currency}</td>
        <td>${MUI.badge(t.status)}</td>
        <td>${t.gateway_provider}</td>
        <td>${MUI.formatDate(t.created_at)}</td>
    </tr>`);
    return `<div class="page-header"><h1>Transactions</h1><p>View your payment transactions</p></div>
    <div class="card">${MUI.table(['Tx ID', 'Amount', 'Currency', 'Status', 'Gateway', 'Date'], rows)}</div>`;
},

// ─── REFUNDS ────────────────────────────────────────────────────────────────
async refunds() {
    const data = await MerchantAPI.listRefunds({ limit: 50 });
    const rows = (data.data || []).map(r => `<tr>
        <td style="font-family:monospace;font-size:12px">${r.id.substring(0,8)}...</td>
        <td>৳${MUI.formatAmount(r.refund_amount)}</td>
        <td>${MUI.badge(r.status)}</td>
        <td>${r.refund_reason}</td>
        <td>${MUI.formatDate(r.requested_at)}</td>
    </tr>`);
    return `<div class="page-header"><h1>Refunds</h1><p>Track and submit refund requests</p></div>
    <div class="card">${MUI.table(['ID', 'Amount', 'Status', 'Reason', 'Requested'], rows)}</div>`;
},

// ─── DELIVERIES ─────────────────────────────────────────────────────────────
async deliveries(webhookId) {
    const data = await MerchantAPI.listDeliveries(webhookId, { limit: 50 });
    const rows = (data.data || []).map(d => `<tr>
        <td>${MUI.badge(d.status)}</td>
        <td>${d.http_status || '—'}</td>
        <td>${d.attempt}</td>
        <td>${MUI.formatDate(d.created_at)}</td>
        <td>${d.next_retry_at ? MUI.formatDate(d.next_retry_at) : '—'}</td>
    </tr>`);
    return `<div class="page-header"><h1>Webhook Deliveries</h1><p><a href="#/webhooks" style="color:var(--accent)">← Back to Webhooks</a></p></div>
    <div class="card">${MUI.table(['Status', 'HTTP', 'Attempt', 'Sent', 'Next Retry'], rows)}</div>`;
},

// ─── INTEGRATION GUIDE (DYNAMIC!) ───────────────────────────────────────────
async integration() {
    const settings = await MerchantAPI.getSettings();
    const keysData = await MerchantAPI.listKeys();
    const keys = keysData.data || [];
    const keyPrefix = keys.length > 0 ? keys[0].key_prefix : 'pvk_xxxxxxxx';
    const keyId = keys.length > 0 ? keys[0].id : null;

    const SID = settings.service_id;
    const BASE = settings.api_base_url || 'https://payvault.trialvo.com/api/v1';
    const KEY_PLACEHOLDER = keyPrefix + '••••••••••••••••••••••••';

    const codeExamples = {
        curl: `# Create a Bill
curl -X POST "${BASE}/bills" \\
  -H "Content-Type: application/json" \\
  -H "X-Service-Id: ${SID}" \\
  -H "X-Timestamp: $(date -u +%s)" \\
  -H "X-Nonce: $(uuidgen)" \\
  -H "X-Signature: <HMAC-SHA256 signature>" \\
  -d '{
    "amount": "500.00",
    "currency": "BDT",
    "description": "Order #1234",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "external_order_id": "ORD-1234"
  }'`,

        python: `import hashlib, hmac, json, time, uuid, requests

SERVICE_ID = "${SID}"
API_KEY = "YOUR_API_KEY"  # Click "Reveal" above to get your full key
BASE_URL = "${BASE}"

def create_bill(amount, description, customer_name, customer_email, order_id=None):
    """Create a payment bill via PayVault API."""
    body = {
        "amount": str(amount),
        "currency": "BDT",
        "description": description,
        "customer_name": customer_name,
        "customer_email": customer_email,
        "external_order_id": order_id or str(uuid.uuid4()),
    }

    body_json = json.dumps(body, separators=(",", ":"), sort_keys=True)
    timestamp = str(int(time.time()))
    nonce = str(uuid.uuid4())

    # Build HMAC signature
    body_hash = hashlib.sha256(body_json.encode()).hexdigest()
    sign_string = f"POST\\n/api/v1/bills\\n{timestamp}\\n{nonce}\\n{body_hash}"
    signature = hmac.new(API_KEY.encode(), sign_string.encode(), hashlib.sha256).hexdigest()

    headers = {
        "Content-Type": "application/json",
        "X-Service-Id": SERVICE_ID,
        "X-Timestamp": timestamp,
        "X-Nonce": nonce,
        "X-Signature": signature,
    }

    resp = requests.post(f"{BASE_URL}/bills", json=body, headers=headers)
    data = resp.json()

    if resp.status_code == 201:
        print(f"Bill created! Redirect customer to: {data['payment_url']}")
        return data
    else:
        print(f"Error: {data.get('error', 'Unknown error')}")
        return None

# Example usage
bill = create_bill(500, "Premium Plan", "John Doe", "john@example.com", "ORD-1234")`,

        nodejs: `const crypto = require('crypto');
const fetch = require('node-fetch');

const SERVICE_ID = "${SID}";
const API_KEY = "YOUR_API_KEY"; // Click "Reveal" above to get your full key
const BASE_URL = "${BASE}";

async function createBill(amount, description, customerName, customerEmail, orderId) {
    const body = {
        amount: String(amount),
        currency: "BDT",
        description,
        customer_name: customerName,
        customer_email: customerEmail,
        external_order_id: orderId || crypto.randomUUID(),
    };

    const bodyJson = JSON.stringify(body);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomUUID();

    // Build HMAC signature
    const bodyHash = crypto.createHash('sha256').update(bodyJson).digest('hex');
    const signString = \`POST\\n/api/v1/bills\\n\${timestamp}\\n\${nonce}\\n\${bodyHash}\`;
    const signature = crypto.createHmac('sha256', API_KEY).update(signString).digest('hex');

    const resp = await fetch(\`\${BASE_URL}/bills\`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Service-Id': SERVICE_ID,
            'X-Timestamp': timestamp,
            'X-Nonce': nonce,
            'X-Signature': signature,
        },
        body: bodyJson,
    });

    const data = await resp.json();
    if (resp.status === 201) {
        console.log('Bill created! Redirect to:', data.payment_url);
        return data;
    } else {
        console.error('Error:', data.error);
        return null;
    }
}

// Example usage
createBill(500, "Premium Plan", "John Doe", "john@example.com", "ORD-1234");`,

        php: `<?php
$SERVICE_ID = "${SID}";
$API_KEY = "YOUR_API_KEY"; // Click "Reveal" above to get your full key
$BASE_URL = "${BASE}";

function createBill($amount, $description, $customerName, $customerEmail, $orderId = null) {
    global $SERVICE_ID, $API_KEY, $BASE_URL;

    $body = [
        'amount' => (string) $amount,
        'currency' => 'BDT',
        'description' => $description,
        'customer_name' => $customerName,
        'customer_email' => $customerEmail,
        'external_order_id' => $orderId ?? uniqid('ORD-'),
    ];

    $bodyJson = json_encode($body, JSON_UNESCAPED_SLASHES);
    $timestamp = (string) time();
    $nonce = bin2hex(random_bytes(16));

    // Build HMAC signature
    $bodyHash = hash('sha256', $bodyJson);
    $signString = "POST\\n/api/v1/bills\\n{$timestamp}\\n{$nonce}\\n{$bodyHash}";
    $signature = hash_hmac('sha256', $signString, $API_KEY);

    $ch = curl_init("$BASE_URL/bills");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $bodyJson,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            "X-Service-Id: $SERVICE_ID",
            "X-Timestamp: $timestamp",
            "X-Nonce: $nonce",
            "X-Signature: $signature",
        ],
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $data = json_decode($response, true);
    if ($httpCode === 201) {
        echo "Bill created! Redirect to: " . $data['payment_url'];
        return $data;
    } else {
        echo "Error: " . ($data['error'] ?? 'Unknown');
        return null;
    }
}

// Example usage
createBill(500, "Premium Plan", "John Doe", "john@example.com", "ORD-1234");
?>`
    };

    const revealBtn = keyId ? `<button class="btn btn-sm btn-primary" onclick="MerchantPages.revealKeyInGuide('${keyId}')"><i data-lucide="eye" style="width:12px;height:12px"></i> Reveal Full Key</button>` : `<a href="#/keys" class="btn btn-sm btn-primary"><i data-lucide="plus" style="width:12px;height:12px"></i> Generate a Key First</a>`;

    const tabButtons = Object.keys(codeExamples).map((lang, i) =>
        `<button class="code-tab ${i === 0 ? 'active' : ''}" onclick="MerchantPages.switchCodeTab(this, '${lang}')">${lang.charAt(0).toUpperCase() + lang.slice(1)}</button>`
    ).join('');

    const codeBlocks = Object.entries(codeExamples).map(([lang, code], i) =>
        `<div class="code-block" data-lang="${lang}" style="${i > 0 ? 'display:none' : ''}">
            <button class="btn btn-sm btn-secondary btn-copy" onclick="MUI.copyToClipboard(this.closest('.code-block').querySelector('pre').textContent)"><i data-lucide="copy" style="width:12px;height:12px"></i> Copy</button>
            <pre>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </div>`
    ).join('');

    return `<div class="page-header"><h1>Integration Guide</h1><p>Dynamic code examples pre-filled with your credentials</p></div>

    <div class="card">
        <div class="card-header"><span class="card-title">Your Credentials</span>${revealBtn}</div>
        <div style="display:grid;grid-template-columns:140px 1fr;gap:8px 16px;font-size:13px">
            <span style="color:var(--text-muted)">Service ID:</span>
            <span style="font-family:monospace;color:var(--accent)">${SID} <button class="btn btn-sm btn-secondary" onclick="MUI.copyToClipboard('${SID}')" style="margin-left:8px">Copy</button></span>
            <span style="color:var(--text-muted)">API Key:</span>
            <span id="guide-key" style="font-family:monospace">${KEY_PLACEHOLDER}</span>
            <span style="color:var(--text-muted)">API Base URL:</span>
            <span style="font-family:monospace;color:var(--accent)">${BASE} <button class="btn btn-sm btn-secondary" onclick="MUI.copyToClipboard('${BASE}')" style="margin-left:8px">Copy</button></span>
        </div>
    </div>

    <div class="card">
        <div class="card-header"><span class="card-title">Create a Bill</span></div>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px">This example creates a payment bill. The response includes a <code>payment_url</code> — redirect your customer there to complete payment.</p>
        <div class="code-tabs">${tabButtons}</div>
        ${codeBlocks}
    </div>

    <div class="card">
        <div class="card-header"><span class="card-title">Webhook Verification</span></div>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px">When PayVault sends a webhook to your endpoint, verify the signature using your webhook secret:</p>
        <div class="code-block">
            <button class="btn btn-sm btn-secondary btn-copy" onclick="MUI.copyToClipboard(this.closest('.code-block').querySelector('pre').textContent)"><i data-lucide="copy" style="width:12px;height:12px"></i> Copy</button>
            <pre>import hmac, hashlib

def verify_webhook(payload_body: bytes, signature_header: str, webhook_secret: str) -> bool:
    """Verify PayVault webhook signature."""
    expected = hmac.new(
        webhook_secret.encode(),
        payload_body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)</pre>
        </div>
    </div>

    <div class="card">
        <div class="card-header"><span class="card-title">Full Documentation</span></div>
        <p style="font-size:13px;color:var(--text-secondary)">For the complete API reference, authentication details, and error codes, visit the
        <a href="/docs" target="_blank" style="color:var(--accent)">PayVault Developer Documentation →</a></p>
    </div>`;
},

switchCodeTab(btn, lang) {
    btn.closest('.card').querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    btn.closest('.card').querySelectorAll('.code-block').forEach(b => b.style.display = b.dataset.lang === lang ? '' : 'none');
},

async revealKeyInGuide(id) {
    try {
        const data = await MerchantAPI.revealKey(id);
        document.getElementById('guide-key').innerHTML = `<span style="color:var(--success)">${data.raw_key}</span> <button class="btn btn-sm btn-secondary" onclick="MUI.copyToClipboard('${data.raw_key}')" style="margin-left:8px">Copy</button>`;
        MUI.toast('Key revealed! Replace YOUR_API_KEY in the code examples with this key.', 'success');
    } catch(e) { MUI.toast(e.message, 'error'); }
},

}; // end MerchantPages
