/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERTICAL?: string;
  readonly VITE_APP_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface AppRuntimeConfig {
  API_ORIGIN?: string;
  IMAGE_URL?: string;
  API_PREFIX?: string;
  APP_VERTICAL?: string;
  APP_NAME?: string;
  APP_SHORT_NAME?: string;
}

interface Window {
  __APP_CONFIG__?: AppRuntimeConfig;
}
