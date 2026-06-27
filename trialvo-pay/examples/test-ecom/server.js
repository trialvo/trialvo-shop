/**
 * ═══════════════════════════════════════════════════════════════
 *  Test E-Commerce — Trialvo Pay Integration Test Harness
 *  
 *  A simple Node.js server that:
 *   1. Serves a single-page e-commerce test app
 *   2. Makes HMAC-authenticated calls to Trialvo Pay /api/v1/*
 *   3. Receives IPN webhooks from Trialvo Pay
 *   4. Pushes real-time events to the browser via SSE
 *  
 *  Usage: node server.js
 *  Runs on: http://localhost:3456
 * ═══════════════════════════════════════════════════════════════
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = 3456;
const TRIALVO_PAY_BASE = 'http://localhost:8080';

// ── State ──────────────────────────────────────────────────────
let config = {
  serviceId: '',
  apiKey: '',
  ipnSecret: '',
};

// Store received webhooks for display
const webhookLog = [];
// SSE clients for real-time push
const sseClients = [];

// ── Crypto helpers ─────────────────────────────────────────────
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function hmacSha256(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

function makeAuthHeaders(serviceId, apiKey, body) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const bodyStr = body ? JSON.stringify(body) : '';
  const bodyHash = sha256(Buffer.from(bodyStr));
  const message = `${serviceId}:${timestamp}:${nonce}:${bodyHash}`;
  const signature = hmacSha256(apiKey, message);

  return {
    'Content-Type': 'application/json',
    'X-Service-Id': serviceId,
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    'X-Api-Key': apiKey,
    'X-Body-Hash': bodyHash,
    'X-Signature': signature,
  };
}

// ── HTTP request helper ────────────────────────────────────────
function httpRequest(method, urlStr, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Send SSE event ─────────────────────────────────────────────
function broadcastSSE(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((res) => {
    try { res.write(msg); } catch {}
  });
}

// ── Parse JSON body ────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } 
      catch { resolve(data); }
    });
    req.on('error', reject);
  });
}

// ── Route handlers ─────────────────────────────────────────────

async function handleSetConfig(req, res) {
  const body = await readBody(req);
  config.serviceId = body.serviceId || config.serviceId;
  config.apiKey = body.apiKey || config.apiKey;
  config.ipnSecret = body.ipnSecret || config.ipnSecret;
  json(res, 200, { success: true, config: { serviceId: config.serviceId, hasApiKey: !!config.apiKey, hasIpnSecret: !!config.ipnSecret } });
}

function handleGetConfig(req, res) {
  json(res, 200, { 
    serviceId: config.serviceId, 
    hasApiKey: !!config.apiKey,
    apiKeyPreview: config.apiKey ? config.apiKey.substring(0, 12) + '...' : '',
    hasIpnSecret: !!config.ipnSecret,
  });
}

async function handleCreateBill(req, res) {
  if (!config.serviceId || !config.apiKey) {
    return json(res, 400, { error: 'Service not configured. Set service ID and API key first.' });
  }

  const body = await readBody(req);
  const headers = makeAuthHeaders(config.serviceId, config.apiKey, body);

  try {
    const result = await httpRequest('POST', `${TRIALVO_PAY_BASE}/api/v1/bills`, headers, body);
    json(res, result.status, result.body);
  } catch (err) {
    json(res, 500, { error: err.message });
  }
}

async function handleGetBill(req, res) {
  if (!config.serviceId || !config.apiKey) {
    return json(res, 400, { error: 'Service not configured.' });
  }

  const parsed = url.parse(req.url, true);
  const token = parsed.pathname.split('/').pop();
  const headers = makeAuthHeaders(config.serviceId, config.apiKey, null);

  try {
    const result = await httpRequest('GET', `${TRIALVO_PAY_BASE}/api/v1/bills/${token}`, headers, null);
    json(res, result.status, result.body);
  } catch (err) {
    json(res, 500, { error: err.message });
  }
}

async function handleCancelBill(req, res) {
  if (!config.serviceId || !config.apiKey) {
    return json(res, 400, { error: 'Service not configured.' });
  }

  const parsed = url.parse(req.url, true);
  const token = parsed.pathname.split('/').pop();
  const headers = makeAuthHeaders(config.serviceId, config.apiKey, null);

  try {
    const result = await httpRequest('DELETE', `${TRIALVO_PAY_BASE}/api/v1/bills/${token}`, headers, null);
    json(res, result.status, result.body);
  } catch (err) {
    json(res, 500, { error: err.message });
  }
}

async function handleGetTransaction(req, res) {
  if (!config.serviceId || !config.apiKey) {
    return json(res, 400, { error: 'Service not configured.' });
  }

  const parsed = url.parse(req.url, true);
  const txId = parsed.pathname.split('/').pop();
  const headers = makeAuthHeaders(config.serviceId, config.apiKey, null);

  try {
    const result = await httpRequest('GET', `${TRIALVO_PAY_BASE}/api/v1/transactions/${txId}`, headers, null);
    json(res, result.status, result.body);
  } catch (err) {
    json(res, 500, { error: err.message });
  }
}

async function handleCreateRefund(req, res) {
  if (!config.serviceId || !config.apiKey) {
    return json(res, 400, { error: 'Service not configured.' });
  }

  const body = await readBody(req);
  const headers = makeAuthHeaders(config.serviceId, config.apiKey, body);

  try {
    const result = await httpRequest('POST', `${TRIALVO_PAY_BASE}/api/v1/refunds`, headers, body);
    json(res, result.status, result.body);
  } catch (err) {
    json(res, 500, { error: err.message });
  }
}

async function handleGetRefund(req, res) {
  if (!config.serviceId || !config.apiKey) {
    return json(res, 400, { error: 'Service not configured.' });
  }

  const parsed = url.parse(req.url, true);
  const refundId = parsed.pathname.split('/').pop();
  const headers = makeAuthHeaders(config.serviceId, config.apiKey, null);

  try {
    const result = await httpRequest('GET', `${TRIALVO_PAY_BASE}/api/v1/refunds/${refundId}`, headers, null);
    json(res, result.status, result.body);
  } catch (err) {
    json(res, 500, { error: err.message });
  }
}

// ── IPN Webhook receiver ───────────────────────────────────────
async function handleWebhook(req, res) {
  const rawBody = await new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
  });

  const signature = req.headers['x-trialvo-pay-signature'] || '';
  const eventType = req.headers['x-trialvo-pay-event'] || 'unknown';

  // Verify signature if we have a secret
  let signatureValid = false;
  if (config.ipnSecret && rawBody) {
    const expected = hmacSha256(config.ipnSecret, rawBody);
    signatureValid = expected === signature;
  }

  let payload;
  try { payload = JSON.parse(rawBody); } catch { payload = rawBody; }

  const entry = {
    id: Date.now(),
    event: eventType,
    payload,
    signature,
    signatureValid,
    receivedAt: new Date().toISOString(),
    headers: {
      'x-trialvo-pay-signature': signature,
      'x-trialvo-pay-event': eventType,
    },
  };

  webhookLog.unshift(entry);
  if (webhookLog.length > 100) webhookLog.pop();

  // Push to SSE clients
  broadcastSSE('webhook', entry);

  console.log(`\n🔔 IPN Webhook received: ${eventType}`);
  console.log(`   Signature valid: ${signatureValid}`);
  console.log(`   Payload:`, JSON.stringify(payload, null, 2).substring(0, 200));

  json(res, 200, { received: true });
}

function handleWebhookLog(req, res) {
  json(res, 200, { data: webhookLog });
}

// ── SSE endpoint ───────────────────────────────────────────────
function handleSSE(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write('event: connected\ndata: {"status":"connected"}\n\n');
  sseClients.push(res);
  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx >= 0) sseClients.splice(idx, 1);
  });
}

// ── Static file serving ────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function serveStatic(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const fullPath = path.join(__dirname, 'public', filePath);

  if (!fs.existsSync(fullPath)) {
    // SPA fallback
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(indexPath));
      return;
    }
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(fullPath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(fs.readFileSync(fullPath));
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

// ── Router ─────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    });
    return res.end();
  }

  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  try {
    // API routes
    if (pathname === '/api/config' && req.method === 'POST') return handleSetConfig(req, res);
    if (pathname === '/api/config' && req.method === 'GET') return handleGetConfig(req, res);
    if (pathname === '/api/bills' && req.method === 'POST') return handleCreateBill(req, res);
    if (pathname.startsWith('/api/bills/') && pathname.endsWith('/cancel') && req.method === 'POST') {
      req.url = pathname.replace('/cancel', '');
      return handleCancelBill(req, res);
    }
    if (pathname.startsWith('/api/bills/') && req.method === 'GET') return handleGetBill(req, res);
    if (pathname.startsWith('/api/transactions/') && req.method === 'GET') return handleGetTransaction(req, res);
    if (pathname === '/api/refunds' && req.method === 'POST') return handleCreateRefund(req, res);
    if (pathname.startsWith('/api/refunds/') && req.method === 'GET') return handleGetRefund(req, res);

    // Webhook receiver
    if (pathname === '/webhooks/trialvo_pay' && req.method === 'POST') return handleWebhook(req, res);
    if (pathname === '/api/webhooks/log' && req.method === 'GET') return handleWebhookLog(req, res);

    // SSE
    if (pathname === '/api/events') return handleSSE(req, res);

    // Static files
    serveStatic(req, res);
  } catch (err) {
    console.error('Server error:', err);
    json(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║          🛒 Test E-Commerce — Trialvo Pay Test Harness          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   Shop:      http://localhost:${PORT}                          ║
║   Webhook:   http://localhost:${PORT}/webhooks/trialvo_pay         ║
║   Trialvo Pay:  http://localhost:8080                            ║
║                                                              ║
║   Steps:                                                     ║
║   1. Go to Settings tab → paste Service ID & API Key         ║
║   2. Go to Shop tab → add items to cart → checkout            ║
║   3. Complete payment on EPS sandbox page                    ║
║   4. Watch Events tab for real-time IPN webhooks             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
