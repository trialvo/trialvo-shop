/**
 * Copy host-seeded demo uploads into shared-demo named Docker volumes.
 *
 * Seed scripts write WebP to product repo uploads/ on the host. Option 1 demos
 * serve from named volumes (e.g. shared-demo_lifestyle_demo_uploads), so a
 * reseed leaves the storefront 404 until this sync runs.
 *
 * Default targets: lifestyle + tech (local IMAGE_URL / STORAGE_URL).
 * Fashion uses a CDN — skipped unless SYNC_FASHION_UPLOADS=1.
 * Combo / adv are optional (host already matches, or not always present).
 *
 * Usage:
 *   node scripts/sync-demo-uploads-to-volumes.js
 *   SYNC_FASHION_UPLOADS=1 node scripts/sync-demo-uploads-to-volumes.js
 *
 * Exit 0 if Docker or a volume is missing (warn). Exit 1 only when a copy
 * into an existing volume fails.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const VOLUME_PREFIX = process.env.SHARED_DEMO_VOLUME_PREFIX || 'shared-demo';

const LIFESTYLE_REPO = process.env.LIFESTYLE_REPO
  || path.resolve(__dirname, '../../../products/product-1-lifestyle');
const TECHSHOP_REPO = process.env.TECHSHOP_REPO
  || path.resolve(__dirname, '../../../products/product-3-tech-shop');
const FASHION_REPO = process.env.FASHION_REPO
  || path.resolve(__dirname, '../../../products/product-2-fashion');
const COMBO_REPO = process.env.COMBO_REPO
  || path.resolve(__dirname, '../../../products/product-4-combo-basket');
const ADV_REPO = process.env.ADV_REPO
  || path.resolve(__dirname, '../../../products/product-5-advance-lifestyle-3d');

const DEST_SUBDIRS = [
  'banners',
  'faceimage',
  'products',
  'categories/main',
  'categories/sub',
  'categories/child',
];

const DEMOS = [
  {
    key: 'lifestyle',
    enabled: true,
    volume: `${VOLUME_PREFIX}_lifestyle_demo_uploads`,
    hostDir: path.join(LIFESTYLE_REPO, 'Back End', 'uploads'),
    prefixes: ['life_', 'face_life_'],
  },
  {
    key: 'tech',
    enabled: true,
    volume: `${VOLUME_PREFIX}_techshop_demo_uploads`,
    hostDir: path.join(TECHSHOP_REPO, 'Back End', 'uploads'),
    prefixes: ['tech_', 'face_tech_'],
  },
  {
    key: 'fashion',
    enabled: envFlag('SYNC_FASHION_UPLOADS'),
    volume: `${VOLUME_PREFIX}_fashion_demo_uploads`,
    hostDir: path.join(FASHION_REPO, 'Back End', 'uploads'),
    prefixes: ['face_', 'banner_'],
    skipReason: 'fashion serves media from CDN — skip by default',
  },
  {
    key: 'combo',
    enabled: envFlag('SYNC_COMBO_UPLOADS'),
    volume: `${VOLUME_PREFIX}_combobasket_demo_uploads`,
    hostDir: comboHostUploads(),
    prefixes: [],
    copyAll: true,
    skipReason: 'combo host/volume already match — skip by default',
  },
  {
    key: 'adv',
    enabled: envFlag('SYNC_ADV_UPLOADS'),
    volume: `${VOLUME_PREFIX}_advlifestyle3d_demo_uploads`,
    hostDir: path.join(ADV_REPO, 'Back End', 'uploads'),
    prefixes: ['life_', 'face_life_'],
    skipReason: 'advance lifestyle 3d sync is optional',
  },
];

function envFlag(name) {
  const v = String(process.env[name] || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function comboHostUploads() {
  const candidates = [
    path.join(COMBO_REPO, 'my-shop-api', 'uploads'),
    path.join(COMBO_REPO, 'Back End', 'uploads'),
    path.join(COMBO_REPO, 'uploads'),
  ];
  return candidates.find((p) => fs.existsSync(p)) || candidates[0];
}

function dockerAvailable() {
  const r = spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  return r.status === 0 && String(r.stdout || '').trim().length > 0;
}

function volumeExists(name) {
  const r = spawnSync('docker', ['volume', 'inspect', name], {
    encoding: 'utf8',
    windowsHide: true,
  });
  return r.status === 0;
}

/** Docker Desktop accepts forward-slash Windows paths, including spaces. */
function toBindPath(hostDir) {
  const resolved = path.resolve(hostDir);
  if (process.platform === 'win32') {
    return resolved.replace(/\\/g, '/');
  }
  return resolved;
}

function alpineCopyScript() {
  const mkdir = DEST_SUBDIRS.map((d) => `/dest/${d}`).join(' ');
  // Ash-safe: PREFIXES=life_,face_life_  or empty + COPY_ALL=1
  return `
set -e
# Disable globbing so prefix patterns like life_* are passed to find, not expanded.
set -f
mkdir -p ${mkdir}

FIND_EXPR=""
if [ -n "$PREFIXES" ]; then
  OLDIFS=$IFS
  IFS=','
  for p in $PREFIXES; do
    [ -n "$p" ] || continue
    if [ -z "$FIND_EXPR" ]; then
      FIND_EXPR="-name \${p}*"
    else
      FIND_EXPR="$FIND_EXPR -o -name \${p}*"
    fi
  done
  IFS=$OLDIFS
fi

if [ "$COPY_ALL" = "1" ]; then
  find /src -type f ! -path '*/.*' > /tmp/src_matches
elif [ -n "$FIND_EXPR" ]; then
  find /src -type f \\( $FIND_EXPR \\) ! -path '*/.*' > /tmp/src_matches
else
  : > /tmp/src_matches
fi

copied=0
while IFS= read -r f; do
  [ -n "$f" ] || continue
  rel="\${f#/src/}"
  mkdir -p "/dest/\$(dirname "$rel")"
  cp -f "$f" "/dest/$rel"
  copied=$((copied + 1))
done < /tmp/src_matches

if [ "$COPY_ALL" = "1" ]; then
  dest_count=$(find /dest -type f ! -path '*/.*' | wc -l | tr -d ' ')
elif [ -n "$FIND_EXPR" ]; then
  dest_count=$(find /dest -type f \\( $FIND_EXPR \\) ! -path '*/.*' | wc -l | tr -d ' ')
else
  dest_count=0
fi

echo "COPIED=$copied DEST=$dest_count"
`.trim();
}

function syncOne(demo) {
  const bind = toBindPath(demo.hostDir);
  const args = [
    'run',
    '--rm',
    '-e', `PREFIXES=${(demo.prefixes || []).join(',')}`,
    '-e', `COPY_ALL=${demo.copyAll ? '1' : '0'}`,
    '-v', `${demo.volume}:/dest`,
    '-v', `${bind}:/src:ro`,
    'alpine',
    'sh',
    '-c',
    alpineCopyScript(),
  ];

  console.log(`==> ${demo.key}: ${demo.hostDir}`);
  console.log(`    → volume ${demo.volume}`);
  if (demo.prefixes && demo.prefixes.length) {
    console.log(`    prefixes: ${demo.prefixes.map((p) => p + '*').join(', ')}`);
  } else if (demo.copyAll) {
    console.log('    mode: copy all non-hidden files');
  }

  const r = spawnSync('docker', args, {
    encoding: 'utf8',
    windowsHide: true,
  });

  if (r.status !== 0) {
    const err = String(r.stderr || r.stdout || '').trim() || `docker exit ${r.status}`;
    throw new Error(err);
  }

  const out = String(r.stdout || '').trim();
  const copied = (out.match(/COPIED=(\d+)/) || [])[1] || '?';
  const dest = (out.match(/DEST=(\d+)/) || [])[1] || '?';
  console.log(`    copied ${copied} file(s); volume now has ${dest} matching file(s)`);
  if (r.stderr && String(r.stderr).trim()) {
    console.log(`    docker stderr: ${String(r.stderr).trim()}`);
  }
  return { copied, dest };
}

function main() {
  console.log('==> Sync host seeded uploads → shared-demo Docker volumes');

  if (!dockerAvailable()) {
    console.warn('==> Docker is not available — skip volume sync (seeded files stay on host)');
    process.exit(0);
  }

  let hardFail = false;
  let ran = 0;

  for (const demo of DEMOS) {
    if (!demo.enabled) {
      console.log(`==> ${demo.key}: skipped (${demo.skipReason || 'disabled'})`);
      continue;
    }

    if (!fs.existsSync(demo.hostDir)) {
      console.warn(`==> ${demo.key}: host uploads missing — ${demo.hostDir}`);
      continue;
    }

    if (!volumeExists(demo.volume)) {
      console.warn(`==> ${demo.key}: volume ${demo.volume} does not exist yet — skip`);
      continue;
    }

    try {
      syncOne(demo);
      ran += 1;
    } catch (e) {
      hardFail = true;
      console.error(`==> ${demo.key}: COPY FAILED — ${e.message || e}`);
    }
  }

  if (hardFail) {
    console.error('==> Demo uploads sync failed for at least one existing volume');
    process.exit(1);
  }

  console.log(ran ? `\n✅ Demo uploads sync complete (${ran} volume(s))` : '\n✅ Demo uploads sync complete (nothing to copy)');
}

main();
