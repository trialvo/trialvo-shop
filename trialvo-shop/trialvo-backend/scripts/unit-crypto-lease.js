/**
 * Unit smoke — AES/HMAC crypto + lease sign/verify (plan §15).
 * Usage: node scripts/unit-crypto-lease.js
 */
require('dotenv').config();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { encrypt, decrypt, hmacSign, randomHex } = require('../src/utils/crypto');
const { issueLease, ensureKeyPair } = require('../src/services/leaseIssuer');
const fs = require('fs');
const path = require('path');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

(async () => {
  // Crypto roundtrip
  const plain = 'secret-value-' + randomHex(4);
  const enc = encrypt(plain);
  assert(decrypt(enc) === plain, 'encrypt/decrypt mismatch');

  const sig = hmacSign('agent-secret', 'install.123.hash');
  assert(/^[a-f0-9]{64}$/.test(sig), 'hmac shape');

  // Lease RS256
  ensureKeyPair();
  const lease = issueLease({
    installId: 'testid123',
    domain: 'demo.example.com',
    state: 'active',
  });
  assert(typeof lease === 'string' && lease.split('.').length === 3, 'lease jwt');

  const { getPublicKey } = require('../src/services/leaseIssuer');
  const pub = getPublicKey();
  const decoded = jwt.verify(lease, pub, { algorithms: ['RS256'] });
  assert(decoded.install_id === 'testid123', 'lease claims');
  const verified = true;

  // Storage driver resolves without throw on local
  const storage = require('../src/services/storage');
  assert(storage.DRIVER === 'local' || storage.DRIVER === 's3', 'storage driver');

  // Compose template + docker helpers load
  require('../src/services/composeTemplate');
  require('../src/services/dockerProvisioner');

  console.log({ cryptoOk: true, leaseIssued: true, leaseVerified: verified, storage: storage.DRIVER });
  console.log('PASS');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  console.log('FAIL');
  process.exit(1);
});
