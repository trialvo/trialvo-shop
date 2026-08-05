/**
 * Smoke TS-5.5: obfuscator config loads and optional obfuscate of a tiny sample.
 * Full image build needs Docker + javascript-obfuscator installed in Lifestyle.
 * Usage: node scripts/smoke-obfuscate.js
 */
const path = require('path');
const fs = require('fs');

const cfgPath = path.resolve(__dirname, '../../deploy/obfuscator.config.js');
const lifestyleCfg = path.resolve(__dirname, '../../../products/product-1-lifestyle/deploy/obfuscator.config.js');
const lifestyleScript = path.resolve(__dirname, '../../../products/product-1-lifestyle/deploy/obfuscate-backend.js');
const buildSh = path.resolve(__dirname, '../../deploy/build-images.sh');

const checks = {
  trialvoConfig: fs.existsSync(cfgPath),
  lifestyleConfig: fs.existsSync(lifestyleCfg),
  lifestyleScript: fs.existsSync(lifestyleScript),
  buildWrapper: fs.existsSync(buildSh),
};

let sampleOk = true;
try {
  const cfg = require(cfgPath);
  sampleOk = cfg && cfg.stringArray === true;
} catch (e) {
  sampleOk = false;
  checks.loadError = e.message;
}

// Try obfuscating a one-liner if dependency present
let obfuscateDemo = 'skipped';
try {
  const JavaScriptObfuscator = require('javascript-obfuscator');
  const out = JavaScriptObfuscator.obfuscate('function hello(){ return 1; }', require(cfgPath));
  obfuscateDemo = out.getObfuscatedCode().length > 20 ? 'ok' : 'empty';
} catch {
  obfuscateDemo = 'skipped (install javascript-obfuscator to exercise)';
}

const ok = checks.trialvoConfig && checks.lifestyleConfig && checks.lifestyleScript && checks.buildWrapper && sampleOk;
console.log({ ...checks, sampleOk, obfuscateDemo });
console.log(ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);
