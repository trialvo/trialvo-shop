/**
 * Smoke: all previously-DEFERRED artifacts exist and load.
 * Usage: node scripts/smoke-deferred-close.js
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const lifestyle = path.resolve(__dirname, '../../../products/product-1-lifestyle');

const required = [
  path.join(root, 'deploy/infra/docker-compose.traefik.yml'),
  path.join(root, 'deploy/infra/DNS_WILDCARD.md'),
  path.join(root, 'deploy/templates/lifestyle/docker-compose.tmpl.yml'),
  path.join(root, 'deploy/installer-template/docker-compose.yml'),
  path.join(__dirname, '../src/services/dockerProvisioner.js'),
  path.join(__dirname, '../src/services/storage.js'),
  path.join(__dirname, '../src/migrations/021_trials_enabled.js'),
  path.join(lifestyle, 'license-agent/main.go'),
  path.join(lifestyle, 'license-agent/Dockerfile'),
  path.join(lifestyle, 'license-agent/internal/client/client.go'),
  path.join(lifestyle, 'license-agent/internal/gate/gate.go'),
  path.join(lifestyle, 'license-agent/internal/commands/commands.go'),
  path.join(lifestyle, 'license-agent/internal/lease/store.go'),
  path.join(lifestyle, 'admin panel/Dockerfile'),
  path.join(lifestyle, 'shop panel/Dockerfile'),
  path.join(lifestyle, 'deploy/seed-demo-db.sh'),
  path.join(lifestyle, 'deploy/build-images.sh'),
  path.join(lifestyle, 'Back End/middleware/trialHardening.js'),
];

const missing = required.filter((p) => !fs.existsSync(p));
const installer = fs.readFileSync(path.join(root, 'deploy/installer-template/docker-compose.yml'), 'utf8');
const hasAgentService = installer.includes('license-agent:');

// Load JS modules
require('../src/services/dockerProvisioner');
require('../src/services/storage');
require('../src/services/trialSettings');

console.log({
  checked: required.length,
  missing: missing.length ? missing : null,
  hasAgentService,
  storageDriver: require('../src/services/storage').DRIVER,
});

const ok = missing.length === 0 && hasAgentService;
console.log(ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);
