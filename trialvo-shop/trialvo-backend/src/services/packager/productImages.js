/**
 * Resolve Docker image refs + pack naming from product slug / deploy_config.
 * Falls back to Lifestyle defaults for backward compatibility.
 *
 * Important: global TRIAL_IMAGE_* env vars only apply to Lifestyle (or when
 * deploy_config explicitly omits images AND prefix is lifestyle). Otherwise a
 * CP .env set for Lifestyle would incorrectly stamp fashion/tech packs.
 */
function parseDeployConfig(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return { ...raw };
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Map catalog slug → short image prefix used in registry tags. */
function imagePrefixForSlug(slug) {
  const s = String(slug || '').toLowerCase();
  if (s.includes('combo')) return 'combobasket';
  if (s.includes('tech')) return 'techshop';
  if (s.includes('fashion') && !s.includes('lifestyle')) return 'fashion';
  if (s.includes('lifestyle')) return 'lifestyle';
  return s.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lifestyle';
}

function packLabelForSlug(slug) {
  const prefix = imagePrefixForSlug(slug);
  if (prefix === 'techshop') return 'tech-shop';
  if (prefix === 'combobasket') return 'combo-basket';
  return prefix;
}

/**
 * Qualify a local tag (name:tag) with registry host when needed.
 * Leaves already-qualified refs alone (host/name:tag or localhost:port/...).
 */
function qualifyImage(registry, image) {
  if (!image) return image;
  const img = String(image).trim();
  if (!img) return img;

  // Already registry-qualified (host/name:tag or localhost:port/name:tag)
  if (
    img.startsWith('localhost:') ||
    /^[\w.-]+:\d+\//.test(img) ||
    /registry\./i.test(img) ||
    (img.includes('/') && !/^(lifestyle|fashion|techshop)-/.test(img))
  ) {
    return img;
  }

  // Plain "name:tag" — prepend registry
  if (!img.includes('/') && registry) {
    return `${registry.replace(/\/$/, '')}/${img}`;
  }
  return img;
}

function defaultImageFor(prefix, role) {
  const local =
    role === 'agent' ? `${prefix}-license-agent:trial` : `${prefix}-${role}:trial`;

  // Only Lifestyle may inherit CP-wide TRIAL_IMAGE_* overrides
  if (prefix === 'lifestyle') {
    const envKey =
      role === 'api'
        ? 'TRIAL_IMAGE_API'
        : role === 'admin'
          ? 'TRIAL_IMAGE_ADMIN'
          : role === 'shop'
            ? 'TRIAL_IMAGE_SHOP'
            : 'TRIAL_IMAGE_AGENT';
    if (process.env[envKey]) return process.env[envKey];
  }
  return local;
}

/**
 * @param {{ productSlug?: string, deployConfig?: object|string, registry?: string }} opts
 */
function resolveProductImages(opts = {}) {
  const REGISTRY = opts.registry || process.env.TRIAL_REGISTRY || 'registry.trialvo.com';
  const dc = parseDeployConfig(opts.deployConfig);
  const slug = opts.productSlug || 'lifestyle-ecommerce';
  const prefix = imagePrefixForSlug(slug);

  const api = dc.image_api || defaultImageFor(prefix, 'api');
  const admin = dc.image_admin || defaultImageFor(prefix, 'admin');
  const shop = dc.image_shop || defaultImageFor(prefix, 'shop');
  const agent = dc.image_agent || defaultImageFor(prefix, 'agent');

  return {
    prefix,
    packLabel: packLabelForSlug(slug),
    api: qualifyImage(REGISTRY, api),
    admin: qualifyImage(REGISTRY, admin),
    shop: qualifyImage(REGISTRY, shop),
    agent: qualifyImage(REGISTRY, agent),
    deployConfig: dc,
  };
}

/**
 * Whether a trial option is allowed for this deploy_config.
 * Missing flags default to true (Lifestyle backward compat).
 */
function supportsTrialOption(deployConfig, option /* 1 | 2 */) {
  const dc = parseDeployConfig(deployConfig);
  if (option === 1) return dc.supports_option1 !== false;
  if (option === 2) return dc.supports_option2 !== false;
  return true;
}

module.exports = {
  parseDeployConfig,
  imagePrefixForSlug,
  packLabelForSlug,
  qualifyImage,
  resolveProductImages,
  supportsTrialOption,
};
