import { ENV } from "@/config/env";
import { getApiBaseUrl } from "@/lib/apiBase";

/**
 * Legacy config wrapper — proxies everything from config/env.ts
 * No .env file needed. All values are in src/config/env.ts
 */
const config = {
  apiUrl: getApiBaseUrl(),
  imageBaseUrl: ENV.IMAGE_BASE_URL,
  baseUrl: ENV.BASE_URL,
  siteUrl: ENV.SITE_URL,
};

export default config;
