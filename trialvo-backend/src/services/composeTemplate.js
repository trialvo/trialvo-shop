/**
 * Render Opt1 compose templates.
 * - Traefik template (production): docker-compose.tmpl.yml
 * - Local port-mode template (dev/test): docker-compose.local.tmpl.yml
 */
const fs = require('fs');
const path = require('path');

const TEMPLATE_DIR = path.resolve(__dirname, '../../../deploy/templates/lifestyle');
const TEMPLATE_PATH = path.join(TEMPLATE_DIR, 'docker-compose.tmpl.yml');
const LOCAL_TEMPLATE_PATH = path.join(TEMPLATE_DIR, 'docker-compose.local.tmpl.yml');

function renderComposeTemplate(vars = {}) {
  const templatePath = vars.local ? LOCAL_TEMPLATE_PATH : TEMPLATE_PATH;
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Compose template missing: ${templatePath}`);
  }
  let text = fs.readFileSync(templatePath, 'utf8');
  const map = {
    CONTROL_PLANE_URL: vars.controlPlaneUrl || '',
    INSTALL_ID: vars.installId || '',
    AGENT_SECRET: vars.agentSecret || '',
    BOOTSTRAP_TOKEN: vars.bootstrapToken || '',
    SUBDOMAIN: vars.subdomain || '',
    TRIAL_DOMAIN_BASE: vars.trialDomainBase || process.env.TRIAL_DOMAIN_BASE || 'trial.trialvo.com',
    TRIAL_DOMAIN: vars.trialDomain || `${vars.subdomain || 'trial'}.${vars.trialDomainBase || 'local'}`,
    LICENSE_PUBLIC_KEY: vars.licensePublicKey || '',
    DB_PASSWORD: vars.dbPassword || '',
    DB_ROOT_PASSWORD: vars.dbRootPassword || vars.dbPassword || '',
    JWTSECRET: vars.jwtSecret || '',
    PROJECT: vars.project || `trial-${(vars.installId || 'x').slice(0, 8)}`,
    // Local port-mode extras
    API_IMAGE: vars.apiImage || process.env.TRIAL_IMAGE_API || 'lifestyle-api:trial',
    ADMIN_IMAGE: vars.adminImage || process.env.TRIAL_IMAGE_ADMIN || 'lifestyle-admin:trial',
    SHOP_IMAGE: vars.shopImage || process.env.TRIAL_IMAGE_SHOP || 'lifestyle-shop:trial',
    API_PORT: vars.apiPort != null ? String(vars.apiPort) : '',
    DB_PORT: vars.dbPort != null ? String(vars.dbPort) : '',
    ADMIN_PORT: vars.adminPort != null ? String(vars.adminPort) : '',
    SHOP_PORT: vars.shopPort != null ? String(vars.shopPort) : '',
  };
  for (const [key, value] of Object.entries(map)) {
    text = text.split(`{{${key}}}`).join(String(value));
  }
  return text;
}

module.exports = { renderComposeTemplate, TEMPLATE_PATH, LOCAL_TEMPLATE_PATH };
