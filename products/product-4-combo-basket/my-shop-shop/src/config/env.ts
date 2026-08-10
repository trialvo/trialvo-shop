// Combo Basket — shop environment (NEXT_PUBLIC_* overrides at Docker build time)
const MODE: "development" | "production" =
  process.env.NODE_ENV === "production" ? "production" : "development";

const DEV = {
  API_URL: "http://localhost:5001/api/shop",
  IMAGE_BASE_URL: "http://localhost:5001",
  BASE_URL: "http://localhost:3000",
  SITE_URL: "http://localhost:3000",
};

const PROD = {
  API_URL: "http://localhost:9103/api/shop",
  IMAGE_BASE_URL: "http://localhost:9103",
  BASE_URL: "http://localhost:5103",
  SITE_URL: "http://localhost:5103",
};

function pick(envKey: string, devVal: string, prodVal: string): string {
  const fromEnv = process.env[envKey];
  if (fromEnv) return fromEnv;
  return MODE === "production" ? prodVal : devVal;
}

export const ENV = {
  API_URL: pick("NEXT_PUBLIC_API_URL", DEV.API_URL, PROD.API_URL),
  IMAGE_BASE_URL: pick("NEXT_PUBLIC_IMAGE_BASE_URL", DEV.IMAGE_BASE_URL, PROD.IMAGE_BASE_URL),
  BASE_URL: pick("NEXT_PUBLIC_BASE_URL", DEV.BASE_URL, PROD.BASE_URL),
  SITE_URL: pick("NEXT_PUBLIC_SITE_URL", DEV.SITE_URL, PROD.SITE_URL),
  MODE,
  isProduction: MODE === "production",
} as const;

export default ENV;
