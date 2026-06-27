const fs = require('fs');
const path = require('path');

const DIRS = ['trialvo-pay', 'trialvo-backend', 'trialvo-frontend'];
const ROOT_FILES = ['docker-compose.local.yml', 'docker-compose.prod.yml', 'generate_keys.js', 'seed.sql', 'nginx-shop.conf'];

function replaceContent(content) {
  let c = content;
  // Specific Docker/Service Names
  c = c.replace(/payvault_app/g, 'trialvo-pay');
  c = c.replace(/payvault_postgres/g, 'trialvo-pay-postgres');
  c = c.replace(/payvault_redis/g, 'trialvo-pay-redis');
  
  // Directory references
  c = c.replace(/\.\/payment-service/g, './trialvo-pay');
  
  // Domain references
  c = c.replace(/payvault\.trialvo\.com/g, 'pay.trialvo.com');

  // Headers
  c = c.replace(/X-PayVault-/g, 'X-Trialvo-Pay-');
  c = c.replace(/x-payvault-/g, 'x-trialvo-pay-');

  // Constants
  c = c.replace(/PAYVAULT_/g, 'TRIALVO_PAY_');
  c = c.replace(/PAYVAULT/g, 'TRIALVO_PAY');

  // Underscored variables
  c = c.replace(/payvault_/g, 'trialvo_pay_');
  c = c.replace(/_payvault/g, '_trialvo_pay');

  // Title Case Text
  c = c.replace(/PayVault/g, 'Trialvo Pay');

  // Remaining generic lowercase
  c = c.replace(/payvault/g, 'trialvo_pay');

  return c;
}

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (f.startsWith('.') || f === 'node_modules' || f === 'target' || f === 'dist' || f === 'build') continue;
    
    if (fs.statSync(full).isDirectory()) {
      processDir(full);
    } else {
      if (/\.(js|ts|tsx|rs|toml|sql|md|yml|yaml|conf|json|html|css|scss|bat)$/i.test(f)) {
        const content = fs.readFileSync(full, 'utf8');
        const updated = replaceContent(content);
        if (content !== updated) {
          fs.writeFileSync(full, updated);
          console.log(`Updated ${full}`);
        }
      }
    }
  }
}

DIRS.forEach(processDir);
ROOT_FILES.forEach(f => {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf8');
    const updated = replaceContent(content);
    if (content !== updated) {
      fs.writeFileSync(f, updated);
      console.log(`Updated ${f}`);
    }
  }
});
