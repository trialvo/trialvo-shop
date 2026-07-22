/**
 * Option 1 hosted provisioning via Docker (when DOCKER_PROVISION=1).
 *
 * Two modes, selected by PROVISION_MODE:
 *   - "local"  (default): port-mode for Docker Desktop / dev. Each instance gets
 *                unique host ports (api/db). No Traefik, DNS, or TLS required —
 *                the trial is reachable at http://localhost:<port>. The stack is
 *                started in stages (db → seed SQL → api) so the fresh MySQL is
 *                populated before the API serves traffic.
 *   - "traefik": production reverse-proxy mode (host-based routing + TLS).
 *
 * Falls back gracefully if Docker is unavailable (caller keeps demo URLs).
 */
const fs = require('fs');
const path = require('path');
const net = require('net');
const http = require('http');
const { execFile, spawn } = require('child_process');
const { promisify } = require('util');
const { renderComposeTemplate } = require('./composeTemplate');
const { randomHex } = require('../utils/crypto');

const execFileAsync = promisify(execFile);
const TRIALS_ROOT = process.env.TRIALS_ROOT || path.join(__dirname, '..', '..', 'var', 'trials');
const TRIAL_DOMAIN_BASE = process.env.TRIAL_DOMAIN_BASE || 'trial.trialvo.com';
const CP_URL = (process.env.PUBLIC_API_URL
  || process.env.CONTROL_PLANE_PUBLIC_URL
  || `http://localhost:${process.env.PORT || 8092}`).replace(/\/$/, '');

// In local mode the trial container reaches the Control Plane (this backend) on
// the host via host.docker.internal. Defaults to this backend's own port.
const LOCAL_CP_URL = (process.env.LOCAL_CONTROL_PLANE_URL
  || `http://host.docker.internal:${process.env.PORT || 5000}`).replace(/\/$/, '');

// Where the Lifestyle repo lives (for building the API image and locating seed SQL).
const LIFESTYLE_REPO = process.env.LIFESTYLE_REPO
  || path.resolve(__dirname, '../../../../product 1 life style');

const API_IMAGE_TAG = process.env.TRIAL_IMAGE_API || 'lifestyle-api:trial';
const ADMIN_IMAGE_TAG = process.env.TRIAL_IMAGE_ADMIN || 'lifestyle-admin:trial';
const SHOP_IMAGE_TAG = process.env.TRIAL_IMAGE_SHOP || 'lifestyle-shop:trial';

function dockerEnabled() {
  return process.env.DOCKER_PROVISION === '1' || process.env.DOCKER_PROVISION === 'true';
}

// Local port-mode is the default when Docker provisioning is enabled; production
// opts into Traefik explicitly with PROVISION_MODE=traefik.
function provisionMode() {
  return (process.env.PROVISION_MODE || 'local').toLowerCase();
}

async function dockerAvailable() {
  try {
    // Docker Desktop can take >8s to answer after a memory/CPU stall (common on
    // Windows after Cursor restarts or load-shedding). Give it enough headroom.
    await execFileAsync('docker', ['info'], { timeout: 45000, windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────

/** Ask the OS for a free ephemeral TCP port. */
function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function imageExists(tag) {
  try {
    await execFileAsync('docker', ['image', 'inspect', tag], { windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

/** Ensure one image exists locally, building it once from its repo subdir if missing. */
async function ensureImage(tag, contextSubdir) {
  if (await imageExists(tag)) return { ok: true, tag };

  const ctx = path.join(LIFESTYLE_REPO, contextSubdir);
  if (!fs.existsSync(ctx)) {
    return { ok: false, error: `Image ${tag} missing and build context not found at ${ctx}` };
  }
  try {
    // First build can take minutes (npm ci / next build); allow a generous timeout.
    await execFileAsync('docker', ['build', '-t', tag, ctx], { timeout: 1200000, windowsHide: true });
    return { ok: true, tag, built: true };
  } catch (e) {
    return { ok: false, error: `Image build failed for ${tag}: ${e.message || String(e)}` };
  }
}

/** Ensure the API image exists (kept for callers that only need the API). */
async function ensureApiImage() {
  return ensureImage(API_IMAGE_TAG, 'Back End');
}

/** Ensure all three Lifestyle images (api, admin, shop) exist. */
async function ensureImages() {
  const api = await ensureImage(API_IMAGE_TAG, 'Back End');
  if (!api.ok) return api;
  const admin = await ensureImage(ADMIN_IMAGE_TAG, 'admin panel');
  if (!admin.ok) return admin;
  const shop = await ensureImage(SHOP_IMAGE_TAG, 'shop panel');
  if (!shop.ok) return shop;
  return { ok: true, api: api.tag, admin: admin.tag, shop: shop.tag };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Poll the MySQL container until `mysqladmin ping` succeeds or timeout. */
async function waitForDbHealthy(composeFile, projectDir, rootPw, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await execFileAsync(
        'docker',
        ['compose', '-f', composeFile, 'exec', '-T', 'db',
          'mysqladmin', 'ping', '-h', '127.0.0.1', '-uroot', `-p${rootPw}`],
        { cwd: projectDir, timeout: 10000, windowsHide: true }
      );
      return true;
    } catch {
      await sleep(3000);
    }
  }
  return false;
}

/** Stream a .sql file into the db container's mysql client. */
function runSeedFile(composeFile, projectDir, rootPw, sqlFile) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'docker',
      ['compose', '-f', composeFile, 'exec', '-T', 'db', 'mysql', '-uroot', `-p${rootPw}`, 'ecom'],
      { cwd: projectDir, windowsHide: true }
    );
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      // mysql prints a password warning to stderr but exits 0 on success.
      if (code === 0) return resolve();
      reject(new Error(`seed ${path.basename(sqlFile)} exited ${code}: ${stderr.slice(0, 600)}`));
    });
    const rs = fs.createReadStream(sqlFile);
    rs.on('error', reject);
    rs.pipe(child.stdin);
  });
}

/** Import the demo dump + trial schema into the fresh instance DB. */
async function seedDatabase(composeFile, projectDir, rootPw) {
  const demo = path.join(LIFESTYLE_REPO, 'Back End', 'db backup', 'myecomv2.sql');
  const trial = path.join(LIFESTYLE_REPO, 'Back End', 'scripts', 'trial_v1.sql');

  if (!fs.existsSync(demo)) {
    return { ok: false, error: `Demo dump missing at ${demo}` };
  }
  try {
    await runSeedFile(composeFile, projectDir, rootPw, demo);
    if (fs.existsSync(trial)) {
      await runSeedFile(composeFile, projectDir, rootPw, trial);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

/**
 * Upsert the Trialvo-issued admin so the emailed credentials actually log in.
 * The demo dump has production admins with unknown passwords — without this
 * step every "Admin email / password" from the status page is useless.
 */
async function seedTrialAdmin(composeFile, projectDir, rootPw, { email, password } = {}) {
  if (!email || !password) return { ok: true, skipped: true };
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(password, 12);
  const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "''");
  const sql = [
    `-- Injected by dockerProvisioner.seedTrialAdmin`,
    `INSERT INTO admins (email, password_hash, first_name, last_name, is_active, created_at)`,
    `VALUES ('${esc(email)}', '${esc(hash)}', 'Trial', 'Admin', 1, NOW())`,
    `ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), is_active=1, deleted_at=NULL, first_name='Trial', last_name='Admin';`,
    `SET @trial_admin_id = (SELECT id FROM admins WHERE email='${esc(email)}' LIMIT 1);`,
    `INSERT IGNORE INTO admin_roles (admin_id, role_id) VALUES (@trial_admin_id, 1);`,
    '',
  ].join('\n');
  const tmp = path.join(projectDir, 'trial_admin_seed.generated.sql');
  fs.writeFileSync(tmp, sql);
  try {
    await runSeedFile(composeFile, projectDir, rootPw, tmp);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  } finally {
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
  }
}

/** Resolve once the API answers any HTTP status (server is up), else false on timeout. */
function waitForHttp(url, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(true);
      });
      req.on('error', () => {
        if (Date.now() >= deadline) return resolve(false);
        setTimeout(attempt, 3000);
      });
      req.setTimeout(5000, () => req.destroy());
    };
    attempt();
  });
}

// ─── traefik (production) provisioning ──────────────────────────────────────

async function provisionTraefikStack({
  installId, agentSecret, bootstrapToken, subdomain, licensePublicKey = '',
}) {
  const project = `trial-${installId.slice(0, 10)}`;
  const projectDir = path.join(TRIALS_ROOT, project);
  fs.mkdirSync(projectDir, { recursive: true });

  const dbPassword = randomHex(12);
  const jwtSecret = randomHex(24);
  const yaml = renderComposeTemplate({
    controlPlaneUrl: CP_URL,
    installId, agentSecret, bootstrapToken, subdomain,
    trialDomainBase: TRIAL_DOMAIN_BASE, licensePublicKey,
    dbPassword, dbRootPassword: dbPassword, jwtSecret, project,
  });

  fs.writeFileSync(path.join(projectDir, 'docker-compose.yml'), yaml);
  fs.writeFileSync(path.join(projectDir, '.env'), [
    `COMPOSE_PROJECT_NAME=${project}`,
    `TRIAL_IMAGE_API=${process.env.TRIAL_IMAGE_API || 'registry.trialvo.com/lifestyle-api:trial'}`,
    `TRIAL_IMAGE_ADMIN=${process.env.TRIAL_IMAGE_ADMIN || 'registry.trialvo.com/lifestyle-admin:trial'}`,
    `TRIAL_IMAGE_SHOP=${process.env.TRIAL_IMAGE_SHOP || 'registry.trialvo.com/lifestyle-shop:trial'}`,
    '',
  ].join('\n'));

  try {
    try {
      await execFileAsync('docker', ['network', 'inspect', 'traefik_public'], { windowsHide: true });
    } catch {
      await execFileAsync('docker', ['network', 'create', 'traefik_public'], { windowsHide: true });
    }

    await execFileAsync(
      'docker',
      ['compose', '-f', path.join(projectDir, 'docker-compose.yml'), 'up', '-d'],
      { cwd: projectDir, timeout: 180000, windowsHide: true }
    );

    const domain = `${subdomain}.${TRIAL_DOMAIN_BASE}`;
    return {
      ok: true, projectDir, project, mode: 'traefik',
      urls: {
        shopUrl: `https://${domain}`,
        adminUrl: `https://admin-${domain}`,
        apiUrl: `https://api-${domain}`,
        domain,
      },
    };
  } catch (e) {
    return { ok: false, projectDir, error: e.message || String(e) };
  }
}

// ─── local (dev/test) provisioning ──────────────────────────────────────────

async function provisionLocalStack({
  installId, agentSecret, bootstrapToken, subdomain, licensePublicKey = '',
  adminEmail = '', adminPassword = '',
}) {
  const imgs = await ensureImages();
  if (!imgs.ok) return { ok: false, error: imgs.error };

  const project = `trial-${installId.slice(0, 10)}`;
  const projectDir = path.join(TRIALS_ROOT, project);
  fs.mkdirSync(projectDir, { recursive: true });

  const apiPort = await getFreePort();
  const dbPort = await getFreePort();
  const adminPort = await getFreePort();
  const shopPort = await getFreePort();
  const dbPassword = randomHex(12);
  const jwtSecret = randomHex(24);
  // The lease's `domain` claim is the stored instance domain (subdomain.base),
  // NOT the localhost:port used for local reachability. TRIAL_DOMAIN must match
  // it or licenseClient.verifyLease() rejects the lease and the trial stays locked.
  const trialDomain = `${subdomain}.${TRIAL_DOMAIN_BASE}`;

  const yaml = renderComposeTemplate({
    local: true,
    controlPlaneUrl: LOCAL_CP_URL,
    installId, agentSecret, bootstrapToken, subdomain,
    trialDomain, licensePublicKey,
    dbPassword, dbRootPassword: dbPassword, jwtSecret,
    project,
    apiImage: imgs.api, adminImage: imgs.admin, shopImage: imgs.shop,
    apiPort, dbPort, adminPort, shopPort,
  });

  const composeFile = path.join(projectDir, 'docker-compose.yml');
  fs.writeFileSync(composeFile, yaml);
  fs.writeFileSync(path.join(projectDir, '.env'), `COMPOSE_PROJECT_NAME=${project}\n`);
  // Write the license public key to a file that the compose mounts into the API
  // container (avoids inlining a multi-line PEM into YAML). Always create it so
  // the bind-mount target exists even when no key is supplied.
  fs.writeFileSync(path.join(projectDir, 'license_public.pem'), licensePublicKey || '');

  try {
    // Stage 1: bring up MySQL only and wait until it accepts connections.
    await execFileAsync('docker', ['compose', '-f', composeFile, 'up', '-d', 'db'],
      { cwd: projectDir, timeout: 120000, windowsHide: true });

    if (!(await waitForDbHealthy(composeFile, projectDir, dbPassword))) {
      return { ok: false, projectDir, error: 'MySQL did not become healthy in time' };
    }

    // Stage 2: seed schema + demo data before the API can serve requests.
    const seeded = await seedDatabase(composeFile, projectDir, dbPassword);
    if (!seeded.ok) return { ok: false, projectDir, error: `DB seed failed: ${seeded.error}` };

    // Stage 2b: inject the Trialvo-issued admin (email/password from the mailer /
    // status page). Without this the demo dump's unknown passwords are the only
    // admins and every trial login fails.
    const adminSeed = await seedTrialAdmin(composeFile, projectDir, dbPassword, {
      email: adminEmail, password: adminPassword,
    });
    if (!adminSeed.ok) {
      return { ok: false, projectDir, error: `Admin seed failed: ${adminSeed.error}` };
    }

    // Stage 3: start the API and wait until it responds.
    await execFileAsync('docker', ['compose', '-f', composeFile, 'up', '-d', 'api'],
      { cwd: projectDir, timeout: 120000, windowsHide: true });
    const apiReady = await waitForHttp(`http://127.0.0.1:${apiPort}/`);

    // Stage 4: start the admin SPA + shop frontends (best-effort readiness).
    await execFileAsync('docker', ['compose', '-f', composeFile, 'up', '-d', 'admin', 'shop'],
      { cwd: projectDir, timeout: 180000, windowsHide: true });
    const adminReady = await waitForHttp(`http://127.0.0.1:${adminPort}/`, 60000);
    const shopReady = await waitForHttp(`http://127.0.0.1:${shopPort}/`, 120000);

    return {
      ok: true, projectDir, project, mode: 'local',
      apiReady, adminReady, shopReady,
      ports: { api: apiPort, db: dbPort, admin: adminPort, shop: shopPort },
      urls: {
        shopUrl: `http://localhost:${shopPort}`,
        adminUrl: `http://localhost:${adminPort}`,
        apiUrl: `http://localhost:${apiPort}`,
        domain: trialDomain,
      },
    };
  } catch (e) {
    return { ok: false, projectDir, error: e.message || String(e) };
  }
}

/**
 * Entry point used by the provisioner. Dispatches to local or traefik mode.
 * @returns {{ ok: boolean, projectDir?: string, error?: string, urls?: object }}
 */
async function provisionDockerStack(opts) {
  if (!dockerEnabled()) {
    return { ok: false, skipped: true, error: 'DOCKER_PROVISION not enabled' };
  }
  if (!(await dockerAvailable())) {
    return { ok: false, error: 'Docker daemon not available' };
  }
  return provisionMode() === 'traefik'
    ? provisionTraefikStack(opts)
    : provisionLocalStack(opts);
}

/**
 * Soft/hard destroy compose project for an Opt1 instance.
 */
async function destroyDockerStack(projectDir, { hard = false } = {}) {
  if (!projectDir || !fs.existsSync(projectDir)) {
    return { ok: false, error: 'projectDir missing' };
  }
  const composeFile = path.join(projectDir, 'docker-compose.yml');
  try {
    const args = ['compose', '-f', composeFile, 'down'];
    if (hard) args.push('-v', '--remove-orphans');
    await execFileAsync('docker', args, { cwd: projectDir, timeout: 120000, windowsHide: true });
    if (hard) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

module.exports = {
  dockerEnabled,
  dockerAvailable,
  provisionMode,
  provisionDockerStack,
  destroyDockerStack,
  ensureApiImage,
  ensureImages,
  TRIALS_ROOT,
};
