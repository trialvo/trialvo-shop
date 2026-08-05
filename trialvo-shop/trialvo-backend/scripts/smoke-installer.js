/**
 * Smoke TS-5.4: generate Opt2 installer ZIP and verify contents.
 * Usage: node scripts/smoke-installer.js
 */
require('dotenv').config();
const { buildInstallerZip, issueRegistryCredentials, TEMPLATE_DIR } = require('../src/services/packager');
const fs = require('fs');
const path = require('path');

(async () => {
  const required = ['docker-compose.yml', 'setup.sh', 'setup.ps1', '.env.example', 'TRIAL_TERMS.md'];
  for (const f of required) {
    const p = path.join(TEMPLATE_DIR, f);
    if (!fs.existsSync(p)) {
      console.error('FAIL missing template', p);
      process.exit(1);
    }
  }

  const installId = 'smoke' + 'a'.repeat(28);
  const registry = issueRegistryCredentials({
    installId,
    expiresAt: new Date(Date.now() + 14 * 86400000),
  });
  const zip = buildInstallerZip({
    installId,
    agentSecret: 'ab'.repeat(32),
    bootstrapToken: 'smoke-bootstrap-token',
    domain: 'demo.example.com',
    backupKey: 'cd'.repeat(32),
    registryCreds: registry,
  });

  const magic = zip.buffer.subarray(0, 2).toString('utf8');
  const asText = zip.buffer.toString('binary');
  const hasAgentEnv = asText.includes('TRIAL_INSTALL_ID=') || asText.includes(installId);
  const hasCompose = asText.includes('services:') || asText.includes('docker-compose');
  const hasTerms = asText.includes('License Agent') || asText.includes('TRIAL_TERMS');

  const ok = magic === 'PK'
    && zip.buffer.length > 500
    && hasAgentEnv
    && zip.files.some((f) => f.endsWith('agent.env'))
    && zip.files.some((f) => f.endsWith('docker-compose.yml'));

  console.log({
    filename: zip.filename,
    bytes: zip.buffer.length,
    files: zip.files.length,
    magic,
    hasAgentEnv,
    hasCompose,
    hasTerms,
  });
  console.log(ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
