require("dotenv").config();

var ApplicationSettings = {
  /* =========================
     ENVIRONMENT & SERVER
  ========================= */
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || "5000",
  baseUrl: process.env.BASE_URL || "/api/v1",

  /* =========================
     GLOBAL RATE LIMIT
  ========================= */


  GLOBAL_RATE_LIMIT_WINDOW_MS:parseInt( process.env.GLOBAL_RATE_LIMIT_WINDOW_MS )|| 15*60*1000,
  GLOBAL_RATE_LIMIT_MAX: parseInt(process.env.GLOBAL_RATE_LIMIT_MAX) || 100,

  /* =========================
     FRONTEND URLS
  ========================= */
  ADMIN_URL: process.env.ADMIN_URL || "http://localhost:6000",
  SHOP_URL: process.env.SHOP_URL || "http://localhost:3000",

  /* =========================
     STORAGE SETTINGS
  ========================= */
  storageDriver: process.env.STORAGE_DRIVER || "",
  STORAGE_URL: process.env.STORAGE_URL || "http://localhost:7000",

  /* =========================
     BRAND INFO
  ========================= */
  BRAND_ADDRESS: process.env.BRAND_ADDRESS || "Jamgora",
  BRAND_NAME: process.env.BRAND_NAME || "Trialvo",

  /* =========================
     IMAGE SETTINGS
  ========================= */

  // Announcement
  announcement_height: parseInt(process.env.ANNOUNCEMENT_HEIGHT) || 400,
  announcement_quality: parseInt(process.env.ANNOUNCEMENT_QUALITY) || 100,
  announcement_width: parseInt(process.env.ANNOUNCEMENT_WIDTH) || 1200,

  // Banner
  banner_height: parseInt(process.env.BANNER_HEIGHT) || 400,
  banner_quality: parseInt(process.env.BANNER_QUALITY) || 100,
  banner_width: parseInt(process.env.BANNER_WIDTH) || 1200,

  // Category
  category_height: parseInt(process.env.CATEGORY_HEIGHT) || 400,
  category_quality: parseInt(process.env.CATEGORY_QUALITY) || 100,
  category_width: parseInt(process.env.CATEGORY_WIDTH) || 400,


  // draft_width: parseInt(process.env.DRAFT_WIDTH) || 600,
  // draft_height: parseInt(process.env.DRAFT_HEIGHT) || 800,
  // draft_quality: parseInt(process.env.DRAFT_QUALITY) || 100,

  // Product
  product_height: parseInt(process.env.PRODUCT_HEIGHT) || 600,
  product_quality: parseInt(process.env.PRODUCT_QUALITY) || 100,
  product_width: parseInt(process.env.PRODUCT_WIDTH) || 600,

  // Face image (low-quality thumbnail for product listings)
  face_image_width: parseInt(process.env.FACE_IMAGE_WIDTH) || 400,
  face_image_height: parseInt(process.env.FACE_IMAGE_HEIGHT) || 400,
  face_image_quality: parseInt(process.env.FACE_IMAGE_QUALITY) || 60,

  // Profile
  profile_quality: parseInt(process.env.PROFILE_QUALITY) || 80,
  profile_size: parseInt(process.env.PROFILE_SIZE) || 256,

  // Report images (small but clear)
  report_image_width: parseInt(process.env.REPORT_IMAGE_WIDTH) || 800,
  report_image_height: parseInt(process.env.REPORT_IMAGE_HEIGHT) || 800,
  report_image_quality: parseInt(process.env.REPORT_IMAGE_QUALITY) || 70,

  // Review images (same dimensions as report images)
  review_image_width: parseInt(process.env.REVIEW_IMAGE_WIDTH) || 800,
  review_image_height: parseInt(process.env.REVIEW_IMAGE_HEIGHT) || 800,
  review_image_quality: parseInt(process.env.REVIEW_IMAGE_QUALITY) || 70,

  /* =========================
     DATABASE SETTINGS
  ========================= */
  connectionLimit: process.env.CONNECTION_LIMIT || 100,
  host: process.env.DB_HOST || "127.0.0.1",
  dbPort: parseInt(process.env.DB_PORT, 10) || 3306,
  database: process.env.DB_NAME || "ecom",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  dbSocketPath: process.env.DB_SOCKET_PATH || "",

  /* =========================
     GOOGLE AUTH + CLOUD STORAGE
  ========================= */
  GAUTH_CLIENT_ID: process.env.GAUTH_CLIENT_ID || "",
  gcsBucket: process.env.GCS_BUCKET || "",
  gcsProjectId: process.env.GCS_PROJECT_ID || "",
  instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME || "",

  /* =========================
     JWT AUTH SETTINGS
  ========================= */
  jwtExpiry: process.env.JWTEXPIRY || "48",
  jwtSecret: process.env.JWTSECRET || "fish",
  unsubscribeSecret:
    process.env.UNSUBSCRIBE_SECRET || "unsubscribefish",

  /* =========================
     FRAUD CHECKER API
  ========================= */
  FRAUDE_API_KEY: process.env.FRAUDE_API_KEY,
  FRAUDE_API_URL: process.env.FRAUDE_API_URL,

  /* =========================
     SSL / PAYMENT TESTING
  ========================= */
  GUEST_SSL_EMAIL: process.env.GUEST_SSL_EMAIL,
  TEST_SSL_PHONE: process.env.TEST_SSL_PHONE,
};

module.exports = ApplicationSettings;
