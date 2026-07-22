/* Standalone check for local Docker port-mode provisioning (Phase 1).
 * Provisions a real Lifestyle API + MySQL stack, verifies the API is reachable
 * and the DB was seeded, then tears it down. Run:
 *   DOCKER_PROVISION=1 PROVISION_MODE=local node scripts/test-local-provision.js
 */
process.env.DOCKER_PROVISION = process.env.DOCKER_PROVISION || '1';
process.env.PROVISION_MODE = process.env.PROVISION_MODE || 'local';

const http = require('http');
const crypto = require('crypto');
const { provisionDockerStack, destroyDockerStack } = require('../src/services/dockerProvisioner');

function getJson(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', (e) => resolve({ error: e.message }));
  });
}

(async () => {
  const installId = crypto.randomBytes(12).toString('hex');
  console.log('==> Provisioning local stack, installId =', installId);
  const t0 = Date.now();

  const res = await provisionDockerStack({
    installId,
    agentSecret: crypto.randomBytes(16).toString('hex'),
    bootstrapToken: crypto.randomBytes(16).toString('hex'),
    subdomain: `test-${installId.slice(0, 6)}`,
    licensePublicKey: '',
  });

  console.log('provision result:', JSON.stringify(res, null, 2));
  console.log(`(took ${Math.round((Date.now() - t0) / 1000)}s)`);

  if (!res.ok) {
    console.error('PROVISION FAILED');
    process.exit(1);
  }

  const apiPort = res.ports.api;
  console.log('\n==> Probing API root:', `http://localhost:${apiPort}/`);
  console.log(await getJson(`http://localhost:${apiPort}/`));

  // A public products endpoint proves the DB was seeded (tables + rows exist).
  console.log('\n==> Probing a data endpoint (proves seed):');
  for (const p of ['/api/products', '/products', '/api/product', '/api/v2/products']) {
    const r = await getJson(`http://localhost:${apiPort}${p}`);
    console.log(`  ${p} ->`, r.status ?? r.error, (r.body || '').slice(0, 120).replace(/\s+/g, ' '));
  }

  const keep = process.argv.includes('--keep');
  if (keep) {
    console.log('\n==> --keep set; leaving stack running at', res.urls.apiUrl);
    return;
  }
  console.log('\n==> Destroying stack (hard)...');
  const tear = await destroyDockerStack(res.projectDir, { hard: true });
  console.log('destroy result:', tear);
})();
