import { ENV } from "@/config/env";

/**
 * Legacy config wrapper — proxies everything from config/env.ts
 * No .env file needed. All values are in src/config/env.ts
 */
const config = {
  apiUrl: ENV.API_URL,
  imageBaseUrl: ENV.IMAGE_BASE_URL,
  baseUrl: ENV.BASE_URL,
  siteUrl: ENV.SITE_URL,
};

export default config;
