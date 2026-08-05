#!/usr/bin/env node
/**
 * TS-5.5 — Obfuscate Lifestyle backend JS into dist-obf/ for trial/prod images.
 * Usage: node deploy/obfuscate-backend.js
 * Requires: npm i -D javascript-obfuscator (in Back End or root).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'Back End');
const OUT = path.resolve(__dirname, '..', 'Back End', 'dist-obf');
const CONFIG = require('./obfuscator.config.js');

const INCLUDE = [
  'index.js',
  'middleware',
  'services',
  'routes',
  'controllers',
  'config',
  'utils',
];

function ensureObfuscator() {
  try {
    return require('javascript-obfuscator');
  } catch {
    try {
      return require(path.join(ROOT, 'node_modules', 'javascript-obfuscator'));
    } catch {
      console.error('Missing javascript-obfuscator. Run: cd "Back End" && npm i -D javascript-obfuscator');
      process.exit(1);
    }
  }
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'uploads' || name === 'dist-obf') continue;
      walk(full, files);
    } else if (name.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

function copyNonJs(srcRel, destRel) {
  const src = path.join(ROOT, srcRel);
  const dest = path.join(OUT, destRel);
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

const JavaScriptObfuscator = ensureObfuscator();

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const targets = [];
for (const entry of INCLUDE) {
  const full = path.join(ROOT, entry);
  if (!fs.existsSync(full)) continue;
  const st = fs.statSync(full);
  if (st.isFile() && entry.endsWith('.js')) targets.push(full);
  else if (st.isDirectory()) walk(full, targets);
}

let count = 0;
for (const file of targets) {
  const rel = path.relative(ROOT, file);
  const code = fs.readFileSync(file, 'utf8');
  const result = JavaScriptObfuscator.obfuscate(code, CONFIG);
  const outFile = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, result.getObfuscatedCode());
  count += 1;
}

// Preserve package manifests for image build
for (const f of ['package.json', 'package-lock.json']) {
  copyNonJs(f, f);
}

console.log(`[obfuscate] Wrote ${count} files → ${OUT}`);
console.log('[obfuscate] Build trial image with: docker build -f deploy/Dockerfile.trial .');
