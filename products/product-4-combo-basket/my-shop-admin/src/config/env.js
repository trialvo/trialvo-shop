// Combo Basket — admin environment (runtime /config.js from nginx entrypoint in Docker)
const viteMode = import.meta.env.MODE === 'production' ? 'production' : 'development';
const runtime =
  typeof window !== 'undefined' && window.__APP_CONFIG__
    ? window.__APP_CONFIG__
    : null;
const MODE = runtime ? 'production' : viteMode;

const DEV = {
  API_URL: 'http://localhost:5001/api',
  IMAGE_BASE_URL: 'http://localhost:5001',
  APP_TITLE: 'Combo Basket Admin',
};

const PROD = {
  API_URL: 'https://api.combobasket.com/api',
  IMAGE_BASE_URL: 'https://api.combobasket.com',
  APP_TITLE: 'Combo Basket Admin',
};

const defaults = MODE === 'production' ? PROD : DEV;

function pick(key, fallback) {
  if (runtime && runtime[key]) return runtime[key];
  return fallback;
}

export const ENV = {
  API_URL: pick('API_URL', defaults.API_URL),
  IMAGE_BASE_URL: pick('IMAGE_BASE_URL', defaults.IMAGE_BASE_URL),
  APP_TITLE: pick('APP_TITLE', defaults.APP_TITLE),
  MODE,
  isProduction: MODE === 'production',
};

export default ENV;
