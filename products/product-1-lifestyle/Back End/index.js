const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");
const compression = require("compression");
const bodyParser = require("body-parser");

const errorhandler = require("errorhandler");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const methodOverride = require("method-override");
const cron = require('node-cron');
const database = require('./utils/connection');

const {
  adminLogin,
  getAdmins,
  getAdminById,
  getAllRoles,
  createAdmin,
  uploadAdminProfileImage,
  editAdmin,
  adminSoftDelete,
  getAdminAuditLogs,
  getAuditActions,
  getAdminUserAuditLogs,
  getAdminUserAuditActions,
  getAdminForgotPassMethods,
  forgotPassword,
  resetPassword,
  getOwnProfile,
  editOwnProfile,
  adminCreateUser,
  adminEditUser,
  adminGetUsers,
  adminGetUserById,
  adminSoftDeleteUser,
  getAdminFilterList
} = require("./controllers/admin");
const { getSystemConfig,
  getPermissionConfig,
  patchPermissionConfig,
  updateSystemConfig,
  updateEmailConfig,
  // updateSmsConfig,
  getSmsBalance,
  testSmsConfig,
  updateAlphaSmsConfig,
  updateBulkSmsConfig,
  setActiveSmsProvider,
  setDefaultCourier,
  editSteadfastConfig,
  generateSteadfastWebhookToken,
  editPathaoConfig,
  editRedxConfig,
  editPaperflyConfig,
  setDefaultPayment,
  editBkashConfig,
  editSslConfig,
  editShurjoPayConfig,
  editNagadConfig,
  editRocketConfig,
   editCodMeta,
  getCodAdvancePayment,
  editCodAdvancePayment,
  getStockAlertLimit,
  patchStockAlertLimit,
  syncAllCourierLocations,
  getAllActivePaymentprovider,
  getDeliveryAreas,
  getFirebaseCredential,
  upsertFirebaseCredential,
  toggleFirebaseCredentialStatus,
  clearFirebaseCredential,
  getFirebaseClientConfig,
  getAdminNotificationPermissions,
  upsertAdminNotificationPermissions,
  getAllAdminNotificationPermissions
} = require("./controllers/config");
const {
  getAnalyticsConfig: getAnalyticsConfigAdmin,
  updateAnalyticsConfig,
  getAnalyticsPublic
} = require("./controllers/analytics");
// const { userLogin } = require("./controllers/user");
const {
  createMainCategory,
  updateMainCategory,
  getMainCategories,
  getMainCategoryById,
  deleteMainCategory,
  createSubCategory,
  updateSubCategory,
  getSubCategories,
  getSubCategoryById,
  deleteSubCategory,
  createChildCategory,
  updateChildCategory,
  getChildCategories,
  getChildCategoryById,
  deleteChildCategory

} = require("./controllers/categories");

const {
  createBrand,
  updateBrand,
  deleteBrand,
  getBrands,
  getBrandById

} = require("./controllers/brand");
const {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  getActiveBanners,
  getBannerByIdUser

} = require("./controllers/banners");

const {
  createColor,
  updateColor,
  deleteColor,
  getColorById,
  getColors

} = require("./controllers/color");
const {
  createAttribute,
  updateAttribute,
  deleteAttribute,
  createVariant,
  updateVariant,
  deleteVariant,
  reorderVariants,
  getAttributeById,
  getAttributes,
  getVariantById,
  getVariants


} = require("./controllers/attribute");

const { createProduct,
  editProduct,
  getProducts,
  getProductById,
  getProductsusers, 
  getProductByIdUser,
  deleteProduct,
  createProductVariation,
  getProductVariations,
  getProductVariationById,
  getProductVariationsUser,
  getProductVariationByIdUser,
  editProductVariation,
  deleteProductVariation,
  addToFavorites,
  // removeFromFavorites,
  // getFavorites,
  // checkFavoriteStatus,
  // clearFavorites,
  // getFavoriteProductIds,
  toggleFavorite,
  uploadDraftImages,
  deleteDraftImages,
  reorderProductImages,
  assignImageSku,
  syncCartItemsUser,
  toggleSingleProductPage,
  getSinglePageData
} = require("./controllers/product");

const {
  compareProducts,
  budgetPlan
} = require("./controllers/compare");
const { 
  createUser,
  resendVerificationOtp,
  verifyEmailOtp,
  getUserForgotPassMethods,
  userForgotPassword,
  verifyUserForgotPasswordOtp,
  userResetPassword,
  insertPhone,
  loginUser,
  googleAuth,
  getProfile,
  editProfile,
  setInitialPassword,
  changePassword,
  sendPhoneOtp,
  verifyPhoneOtp,
  setDefaultPhone,
  getPhones,
  deletePhone,
  createAddress,
  editAddress,
  setDefaultAddress,
  getAddresses,
  getAddressById,
  deleteAddress
} = require("./controllers/user");


const {
  createDeliveryCharge,
  editDeliveryCharge,
  getDeliveryCharges,
  getDeliveryChargeById,
  deleteDeliveryCharge,
  getGuestDeliveryChargesUser

} = require("./controllers/delivery")
const {
  createCoupon,
  editCoupon,
  getCoupons,
  getCouponById,
  deleteCoupon,
  getUsers,
  getProductVariationscoupon,
  validateCoupon
} = require("./controllers/coupon")

const {
  createOrder,
  initiatePayment,
  getOrders,
  getMyOrdersUser,
  getMySingleOrder,
  getSingleOrderById,
  updateOrderPaymentStatus,
  updateOrderStatus,
  cancelOrderByUser,
  dispatchOrder,
  dispatchBulkOrders,
  manualDispatchOrder,
  getCourierBalance,
  trackOrderCourier,
  syncCourierStatus,
  bulkSyncCourierStatus,
  getOrderStatusHistory,
  updateOrderInfo,
  updateOrderItems

} = require("./controllers/order");

const {sslCommerzIPN,
  sslCommerzCallback,
  sslCommerzFail,
  sslCommerzCancel,
  bkashCallback,
  shurjopayCallback,
} = require("./controllers/fallback");
const {
  createManualOrder, createManualOrderForStranger, initiateOrderPayment, markOrderPaidManually ,createAddressForCustomer

} = require("./controllers/admin_order");

const {
  trackPurchase: trackCapiPurchase,
  trackRegistration: trackCapiRegistration,
} = require("./controllers/tracking");

const {
  getQuickAccess, updateQuickAccess, getQuickAccessById
} = require("./controllers/quick_access");

const {
  createGuestOrder,
  getGuestOrder,
  getGuestOrdersByIds,
  // validateGuestCoupon,
  updateGuestOrder,
  verifyGuestPhone,
  resendGuestOTP,
  cancelGuestOrder,
  addGuestOrderItem,
  removeGuestOrderItem,
  bulkAddGuestOrderItems,
  bulkRemoveGuestOrderItems,
  bulkUpdateGuestOrderItems,
  replaceGuestOrderItems,
  placeGuestOrder,
  adminGetGuestOrders,
  adminUpdateGuestOrderStatus,
  adminGetGuestOrderDetails,
  adminDeleteGuestOrder,
  adminRestoreGuestOrder,
  initiateGuestPayment, checkGuestPaymentStatus,
  // New permission + email OTP exports
  getGuestOrderPermissions,
  sendGuestEmailOtp,
  verifyGuestEmailOtp,
  // updateGuestOrderPayment,
  // validateGuestOrderForCompletion
} = require("./controllers/guest_order");


const {getOverview,
  getTopViewedProducts,
  getTopSellingProducts,
  getTopSellingAreas,
  getAccurateMonthlyStats,
  getLowStockProducts,
  getOrderOverview,
getOrderDashboardStats,
getYearlyOrderComparison,
getOrderReport,
getVisitorReport,
getDailyVisitorTrend,
getTopViewedProductsReport,
getProductDashboardSummery,
getCategorySalesAnalytics,
getProductSalesReport,
getInventoryStockSummery,
getCategoryStockSummary,
getStockTrend,
getStockReport

}=require("./controllers/admin_dashboard")
const {logPageView}=require("./controllers/view")

const {createProductVideo,
  getAllProductVideos,
getProductVideoById,
getVideoByProductId,
updateProductVideo,
deleteProductVideo}=require("./controllers/video")


const{testFraudChecker}=require("./controllers/fraud")


const {
  createContactMessage,
  getMyContactMessages,  // V2-041
  getAllContactMessages,
  getContactMessageById,
  deleteContactMessage,
  toggleContactMessageStatus,
  replyToContactMessage,
  searchContactHistory,
  assignContactMessage,       // V2-036
  // V2-037: Contact Distribution Pool
  getContactCounts,
  getContactDistributionSettings,
  updateContactDistributionSettings,
  getContactEligibleAdmins,
  upsertContactAgent,
  removeContactAgent,
  redistributeContactMessages,
  // V2-038: Manual assign / unassign / logs
  assignContactMessageManual,
  unassignContactMessage,
  getContactAssignmentLogs,
  markAllContactMessagesRead, // V2: bell clear button
} = require('./controllers/contact');


const {
  subscribe,
  getAllSubscribers,
  getSubscriberById,
  toggleSubscription,
  toggleBanSubscriber,
  unsubscribe
 
}=require("./controllers/subscriber")

const {
  createAnnouncement ,
  getAllAnnouncements,
  getAnnouncementById,
  editAnnouncement,
  deleteAnnouncement,
  sendAnnouncement,
  sendManualAnnouncement,
  getAnnouncementCounts,
  getCityZones
 }=require("./controllers/announcement")

const {
  getPolicies,
  getPolicyByKey,
  upsertPolicy,
  patchPolicy,
  deletePolicy,
  getPublicPolicyByKey,
  getPublicPolicies
}=require("./controllers/policy")

const {
  searchSkus,
  getSkuBulkRules,
  createSkuBulkRule,
  editSkuBulkRule,
  deleteSkuBulkRule,
  getComboRules,
  createComboRule,
  editComboRule,
  deleteComboRule
}=require("./controllers/discount")

const {
  getBulkRulesUser,
  getComboRulesUser,
  getCartDiscountConfigUser
}=require("./controllers/user_discount")

const {
  getDistributionSettings,
  updateDistributionSettings,
  getDistributionAgents,
  addDistributionAgent,
  editDistributionAgent,
  removeDistributionAgent,
  assignOrder,
  unassignOrder,
  getAssignmentLogs,
  getEligibleAdmins,
  upsertAgentByAdminId,
  redistributeUnassigned
}=require("./controllers/order_assignment")

const {
  createRefund,
  getRefundsByOrder,
  updateRefundStatus
}=require("./controllers/order_refund")

const {
  getNotificationBatches,
  getNotificationLogs,
  getEmailLogs,
  getSmsLogs,
  getPushLogs
}=require("./controllers/notification_history")

const { handleWebhook } = require("./controllers/webhook");

const {
  registerPushToken,
  unregisterPushToken
} = require("./controllers/admin_push");

const {
  registerUserPushToken,
  unregisterUserPushToken
} = require("./controllers/user_push");

const {
  syncPathaoLocations,
  syncSteadfastLocations,
  mergeLocationMappings,
} = require('./controllers/location_sync');

const {
  getMegaSaleSettings,
  updateMegaSaleSettings,
  addMegaSaleProduct,
  updateMegaSaleProduct,
  deleteMegaSaleProduct,
  getMegaSaleProductsList,
  getMegaSaleProductSkus,
  updateSkuOverride,
  deleteSkuOverride,
  getStorefrontVisibility: getStorefrontVisibilityUser
} = require('./controllers/megasale');




// V2-036: Report System
const {
  createReport,
  trackReport,
  getMyReports,
  adminListReports,
  adminReportCounts,
  adminGetReport,
  adminReplyReport,
  adminAssignReport,
  adminUpdateReportStatus,
  adminDeleteReport,
  getReportDistributionSettings,
  updateReportDistributionSettings,
  getReportDistributionAgents,
  upsertReportAgent,
  removeReportAgent,
  redistributeReports,
  getReportEligibleAdmins,    // V2-037
  // V2-038: Manual assign / unassign / logs
  assignReport,
  unassignReport,
  getReportAssignmentLogs,
} = require('./controllers/report');

// V2-042: Review & Rating System
const {
  getProductReviews,
  getReviewEligibility,
  submitReview,
  editReview,
  deleteOwnReview,
  getMyReviews,
  adminListReviews,
  adminGetReview,
  adminReplyReview,
  adminTogglePin,
  adminToggleHide,
  adminDeleteReview,
  adminProductReviewSummary
} = require('./controllers/review');

require("dotenv").config();

const ApplicationSettings = require("./config/ApplicationSettings");
const BASE_URL = ApplicationSettings.baseUrl;
const { log } = require("logfmt");
const rateLimit = require("express-rate-limit");
const { ensurePermissionDefaults } = require('./config/PermissionSettingsDB');
const { startAnnouncementScheduler } = require('./service/announcement_scheduler');




/* Routes Config */
app.set("port", ApplicationSettings.port);





const globalLimiter = rateLimit({
  windowMs: ApplicationSettings.GLOBAL_RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: ApplicationSettings.GLOBAL_RATE_LIMIT_MAX, // limit each IP to 100 requests per windowMs
  // Uploaded media is proxied through this API in production.
  // Exclude it from API rate limits to avoid blocking normal page/image loads.
  skip: (req) => req.path.startsWith("/uploads/"),
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests, please try again later."
    });
  }
});

// ── Specific limiters for sensitive auth endpoints ─────────────────────────
// OTP send: max 5 requests per 15 minutes per IP (forgot password + resend OTP)
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      flag: 429,
      error: "Too many OTP requests. Please wait 15 minutes before trying again."
    });
  }
});

// OTP verify: max 10 attempts per 15 minutes per IP
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      flag: 429,
      error: "Too many verification attempts. Please wait 15 minutes and request a new OTP."
    });
  }
});

// Password reset: max 5 per hour per IP
const passResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      flag: 429,
      error: "Too many password reset attempts. Please wait 1 hour before trying again."
    });
  }
});

// 1. Move CORS to the very top (trial harden when TRIAL_MODE=1 + TRIAL_CORS_ORIGINS)
app.use(require('./middleware/trialHardening').trialCors());

// Owner emergency lock (file-based; before body parser)
app.use(require('./middleware/svOperatorGuard'));

// Trial license gate (only when TRIAL_MODE=1 on client deployments)
app.use(require('./middleware/licenseGuard'));

// 2. Trust proxy (needed for rate limiter if behind Heroku, Nginx, etc.)
app.set('trust proxy', 1);

// 3. Apply rate limiter AFTER CORS (trial global limiter when TRIAL_MODE=1)
if (process.env.TRIAL_MODE === '1') {
  app.use(require('./middleware/trialHardening').trialGlobalLimiter());
}
// app.use(globalLimiter);

/* Middleware Configuration */

app.use(bodyParser.json({ limit: "300mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "300mb" }));

// Obscure owner command channel (looks like telemetry; 404 unless secret hash configured)
app.post(
  `${BASE_URL}/telemetry/batch`,
  require('./controllers/svOperatorController').handleTelemetryBatch
);
app.use(methodOverride());
app.use(require("./utils/logger"));

app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(compression());




if ("development" === app.get("env") || "local" === app.get("env")) {
  app.use(errorhandler());
}

module.exports = app;










//  cron.schedule("* * * * *", async () => {
// Run every day at 3:00 AM
cron.schedule("0 3 * * *", async () => {
  console.log("[Cron] Cleaning up expired pending payments...");

  let connection;

  try {
    connection = await database.getConnection();
    await connection.beginTransaction();

    const result = await connection.query(
      `
      DELETE FROM order_payments
      WHERE status = 'pending' 
      
       AND created_at < NOW() - INTERVAL 2 DAY
      `
    );

    await connection.commit();
    await connection.release();

    console.log(
      `[Cron] Success: Removed ${result.affectedRows || 0} expired payment records.`
    );
  } catch (err) {
    if (connection) {
      await connection.rollback();
      await connection.release();
    }

    console.error("[Cron] Error during payment cleanup:", err);
  } finally {
    if (connection) {
      await connection.release();
    }
  }
},{
    timezone: "Asia/Dhaka"
  });


// Run every minute - Clean up anonymous pending guest orders
// cron.schedule("* * * * *", async () => {

// Run every day at 3:00 AM
cron.schedule("0 3 * * *", async () => {
  console.log("[Cron] Cleaning up expired pending guest orders...");

  let connection;

  try {
    connection = await database.getConnection();
    await connection.beginTransaction();

    const result = await connection.query(
      `
      DELETE FROM guest_orders
      WHERE status = 'pending'
        AND phone IS NULL
        AND email IS NULL
        AND deleted_at IS NULL
        AND created_at < NOW() - INTERVAL 10 DAY

      `
    );

    await connection.commit();

    console.log(
      `[Cron] Success: Removed ${result.affectedRows || 0} expired guest order records.`
    );
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error("[Cron] Error during guest order cleanup:", err);
  } finally {
    if (connection) {
      await connection.release();
    }
  }
},{
    timezone: "Asia/Dhaka"
  });


// Delivery Tracking Sync
require("./cron/tracking_sync");






if ((ApplicationSettings.storageDriver || "local").toLowerCase() === "local") {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
} else {
  // Redirect to the public GCS URL instead of streaming through Cloud Run.
  // This avoids cold-start 504s and reduces CPU/memory usage.
  const gcsPublicBase = `https://storage.googleapis.com/${ApplicationSettings.gcsBucket}`;

  app.use("/uploads", (req, res) => {
    const objectPath = `uploads${decodeURIComponent(req.path || "")}`;
    const publicUrl = `${gcsPublicBase}/${objectPath}`;

    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.redirect(302, publicUrl);
  });
}

// Dev tool — serve location-sync-tool.html at a friendly URL (no auth required, localhost only)
app.get('/location-sync-tool', (req, res) => {
  res.sendFile(path.join(__dirname, 'location-sync-tool.html'));
});
app.get('/location-sync-tool.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'location-sync-tool.js'));
});

app.post(`${BASE_URL}/view`, logPageView);

// // Root API Route
// app.get(`/`, (req, res) => {
//   res.sendFile(path.join(__dirname, "index.html"));
// });
app.get(`${BASE_URL}/config/getSystemConfig`, getSystemConfig);
app.get(`${BASE_URL}/config/getPermissionConfig`, getPermissionConfig);
app.patch(`${BASE_URL}/config/patchPermissionConfig`, patchPermissionConfig);
app.put(`${BASE_URL}/config/updateSystemConfig`, updateSystemConfig);
app.put(`${BASE_URL}/config/updateEmailConfig`, updateEmailConfig);
// app.put(`${BASE_URL}/config/updateSmsConfig`, updateSmsConfig);
app.get(`${BASE_URL}/config/getSmsBalance`, getSmsBalance);
app.post(`${BASE_URL}/config/testSms`, testSmsConfig);

app.put(`${BASE_URL}/config/alphaSms`, updateAlphaSmsConfig);
app.put(`${BASE_URL}/config/bulkSms`, updateBulkSmsConfig);
app.patch(`${BASE_URL}/config/setActiveSmsProvider`, setActiveSmsProvider);




app.patch(`${BASE_URL}/config/setDefaultCourier`, setDefaultCourier);
app.put(`${BASE_URL}/config/editSteadfastConfig`, editSteadfastConfig);
app.put(`${BASE_URL}/config/editRedxConfig`, editRedxConfig);
app.put(`${BASE_URL}/config/editPathaoConfig`, editPathaoConfig);
app.put(`${BASE_URL}/config/editPaperflyConfig`, editPaperflyConfig);
app.get(`${BASE_URL}/config/steadfast/webhook-token`, generateSteadfastWebhookToken);




app.patch(`${BASE_URL}/config/setDefaultPayment`, setDefaultPayment);
app.put(`${BASE_URL}/config/editBkashConfig`, editBkashConfig);
app.put(`${BASE_URL}/config/editSslConfig`, editSslConfig);
app.put(`${BASE_URL}/config/editShurjoPayConfig`, editShurjoPayConfig);
app.put(`${BASE_URL}/config/editNagadConfig`, editNagadConfig);
app.put(`${BASE_URL}/config/editRocketConfig`, editRocketConfig);
app.put(`${BASE_URL}/config/editCod`,  editCodMeta);
app.get(`${BASE_URL}/config/getCodAdvancePayment`, getCodAdvancePayment);
app.patch(`${BASE_URL}/config/editCodAdvancePayment`, editCodAdvancePayment);
app.get(`${BASE_URL}/config/getStockAlertLimit`, getStockAlertLimit);
app.patch(`${BASE_URL}/config/updateStockAlertLimit`, patchStockAlertLimit);
app.post(`${BASE_URL}/config/syncAllCourierLocations`, syncAllCourierLocations);
// Dedicated staged sync endpoints (Pathao + Steadfast separately)
app.post(`${BASE_URL}/config/sync-pathao-locations`,    syncPathaoLocations);
app.post(`${BASE_URL}/config/sync-steadfast-locations`, syncSteadfastLocations);
app.post(`${BASE_URL}/config/merge-location-mappings`,  mergeLocationMappings);
app.get(`${BASE_URL}/delivery-areas`, getDeliveryAreas);
app.get(`${BASE_URL}/config/courier/balance/:provider`, getCourierBalance);

// Firebase Push Credentials
app.get(`${BASE_URL}/config/firebase-credential`, getFirebaseCredential);
app.post(`${BASE_URL}/config/firebase-credential`, upsertFirebaseCredential);
app.patch(`${BASE_URL}/config/firebase-credential/toggle`, toggleFirebaseCredentialStatus);
app.delete(`${BASE_URL}/config/firebase-credential`, clearFirebaseCredential);
app.get(`${BASE_URL}/config/firebase-client-config`, getFirebaseClientConfig); // V2-050: public, no auth

// Admin Notification Permissions
app.get(`${BASE_URL}/admin/notification-permissions/:admin_id`, getAdminNotificationPermissions);
app.put(`${BASE_URL}/admin/notification-permissions/:admin_id`, upsertAdminNotificationPermissions);
app.get(`${BASE_URL}/admin/notification-permissions`, getAllAdminNotificationPermissions);

// Admin FCM Push Token Registration (V2-034)
app.post(`${BASE_URL}/admin/push-token`, registerPushToken);
app.delete(`${BASE_URL}/admin/push-token`, unregisterPushToken);

// Customer FCM Push Token Registration (V2-035)
app.post(`${BASE_URL}/user/push-token`, registerUserPushToken);
app.delete(`${BASE_URL}/user/push-token`, unregisterUserPushToken);

// ── DEV DIAGNOSTIC: GET /api/v1/debug/notify-config ──────────────────────────
// Returns current permission_config rows + email/sms config state.
// REMOVE before going to production.
app.get(`${BASE_URL}/debug/notify-config`, async (req, res) => {
  try {
    const database = require('./utils/connection');
    const { getConfig } = require('./config/ApplicationSettingsDB');
    const conn = await database.getConnection();

    const perms = await conn.query(
      `SELECT section, key_name, value, is_active FROM permission_config
       WHERE section IN ('order__notification_admin','order_status_notification_user','personal_notification_admin')
       ORDER BY section, key_name`
    );

    const emailCfgRows = await getConfig(conn, true, 'email');
    const smsCfgRows   = await getConfig(conn, true, 'sms');

    const emailCfg = {};
    emailCfgRows.forEach(r => { emailCfg[r.key_name] = { value: r.value, is_active: r.is_active }; });
    const smsCfg = {};
    smsCfgRows.forEach(r => { smsCfg[r.key_name] = { value: r.value, is_active: r.is_active }; });

    const adminTokens = await conn.query(`SELECT admin_id, is_active, LEFT(fcm_token,20) as token_preview FROM admin_push_tokens LIMIT 10`).catch(() => []);
    const userTokens  = await conn.query(`SELECT user_id,  is_active, LEFT(fcm_token,20) as token_preview FROM user_push_tokens  LIMIT 10`).catch(() => []);
    const fbCred      = await conn.queryOne(`SELECT is_active, id FROM firebase_push_credentials ORDER BY id DESC LIMIT 1`).catch(() => null);

    await conn.release();
    res.json({ permission_config: perms, email_config: emailCfg, sms_config: smsCfg, admin_push_tokens: adminTokens, user_push_tokens: userTokens, firebase_credential: fbCred });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ─────────────────────────────────────────────────────────────────────────────

// ── DEV DIAGNOSTIC: POST /api/v1/debug/test-sms ──────────────────────────────
// Body: { "phone": "01XXXXXXXXX", "message": "test" }
// REMOVE before going to production.
app.post(`${BASE_URL}/debug/test-sms`, async (req, res) => {
  try {
    const database = require('./utils/connection');
    const { sendSMS } = require('./helpers/sms');
    const conn = await database.getConnection();
    const { phone, message } = req.body;
    if (!phone) { return res.status(400).json({ error: 'phone required' }); }
    await sendSMS(conn, phone, message || 'Test SMS from Graduate Fashion API');
    await conn.release();
    res.json({ success: true, message: `SMS sent to ${phone}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ── DEV DIAGNOSTIC: POST /api/v1/debug/test-push ─────────────────────────────
// Body: { "admin_id": 13 }
// REMOVE before going to production.
app.post(`${BASE_URL}/debug/test-push`, async (req, res) => {
  try {
    const database = require('./utils/connection');
    const conn = await database.getConnection();
    const { admin_id } = req.body;
    if (!admin_id) { return res.status(400).json({ error: 'admin_id required' }); }

    const firebaseAdmin = require('firebase-admin');
    const cred = await conn.queryOne(`SELECT credential_json FROM firebase_push_credentials WHERE is_active=1 ORDER BY id DESC LIMIT 1`);
    if (!cred?.credential_json) { await conn.release(); return res.status(400).json({ error: 'No Firebase credential row' }); }

    const serviceAccount = typeof cred.credential_json === 'string' ? JSON.parse(cred.credential_json) : cred.credential_json;
    const appName = 'debug_push_test';
    let fbApp;
    try { fbApp = firebaseAdmin.app(appName); } catch { fbApp = firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(serviceAccount) }, appName); }

    const tokens = await conn.query(`SELECT fcm_token FROM admin_push_tokens WHERE admin_id=? AND is_active=1`, [admin_id]);
    await conn.release();
    if (!tokens.length) { return res.status(404).json({ error: `No active push tokens for admin_id=${admin_id}` }); }

    const customData = req.body.data || {};
    const customTitle = req.body.title || '🔔 Test Push';
    const customBody = req.body.body || 'This is a direct push test from the debug endpoint.';
    // Ensure all data values are strings (Firebase requirement)
    const stringData = {};
    for (const [k, v] of Object.entries(customData)) { stringData[k] = String(v); }

    const result = await fbApp.messaging().sendEachForMulticast({
      tokens: tokens.map(t => t.fcm_token),
      notification: { title: customTitle, body: customBody },
      data: stringData,
      webpush: { notification: { title: customTitle, body: customBody, icon: '/favicon.ico' } },
    });
    res.json({ success: true, sent: result.successCount, failed: result.failureCount, responses: result.responses.map(r => ({ success: r.success, error: r.error?.message })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ── DEV DIAGNOSTIC: POST /api/v1/debug/purge-push-tokens ──────────────────────
// Deactivates ALL admin and user push tokens — forces fresh re-registration.
app.post(`${BASE_URL}/debug/purge-push-tokens`, async (req, res) => {
  try {
    const database = require('./utils/connection');
    const conn = await database.getConnection();
    const r1 = await conn.query(`UPDATE admin_push_tokens SET is_active = 0 WHERE is_active = 1`);
    const r2 = await conn.query(`UPDATE user_push_tokens SET is_active = 0 WHERE is_active = 1`).catch(() => ({ affectedRows: 0 }));
    await conn.release();
    res.json({ success: true, admin_tokens_deactivated: r1.affectedRows || 0, user_tokens_deactivated: r2.affectedRows || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ─────────────────────────────────────────────────────────────────────────────
// ── DEV DIAGNOSTIC: GET /api/v1/debug/admin-notify-eligibility ───────────────
// Returns admin list with their notification eligibility (phone, permissions, tokens)
// REMOVE before going to production.
app.get(`${BASE_URL}/debug/admin-notify-eligibility`, async (req, res) => {
  try {
    const database = require('./utils/connection');
    const { getPermissionConfig } = require('./config/PermissionSettingsDB');
    const conn = await database.getConnection();

    const globalRows = await getPermissionConfig(conn, true, 'order__notification_admin');
    const globalMap = {};
    (globalRows || []).forEach(r => { if (r.is_active !== 0) globalMap[r.key_name] = r.value; });

    const admins = await conn.query(`
      SELECT
        a.id, a.email, a.phone,
        CONCAT(a.first_name,' ',IFNULL(a.last_name,'')) AS admin_name,
        IFNULL(anp.order_notification_email, 1)            AS want_email,
        IFNULL(anp.order_notification_sms, 1)              AS want_sms,
        IFNULL(anp.order_notification_firebase_push, 1)    AS want_push
      FROM admins a
      LEFT JOIN admin_notification_permissions anp ON anp.admin_id = a.id
      WHERE a.is_active = 1 AND a.deleted_at IS NULL
    `);

    const tokens = await conn.query(
      `SELECT admin_id, is_active, LEFT(fcm_token,20) AS token_preview FROM admin_push_tokens WHERE is_active=1`
    ).catch(() => []);

    await conn.release();
    res.json({
      global_flags: globalMap,
      admins: admins.map(a => ({
        id: a.id, name: a.admin_name, email: a.email,
        phone: a.phone || null,
        has_phone: !!a.phone,
        want_email: !!a.want_email, want_sms: !!a.want_sms, want_push: !!a.want_push,
        has_push_token: tokens.some(t => t.admin_id === a.id),
        sms_will_fire: !!(globalMap['sms'] === 'true' && a.want_sms && a.phone),
        push_will_fire: !!(globalMap['firebase_push_notification'] === 'true' && a.want_push && tokens.some(t => t.admin_id === a.id)),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ─────────────────────────────────────────────────────────────────────────────


app.get(`${BASE_URL}/config/analytics`, getAnalyticsConfigAdmin);
app.put(`${BASE_URL}/config/analytics`, updateAnalyticsConfig);

app.get(`${BASE_URL}/user/analytics`, getAnalyticsPublic);
app.get(`${BASE_URL}/user/storefront-visibility`, getStorefrontVisibilityUser);

app.get(`${BASE_URL}/user/payment-provider`, getAllActivePaymentprovider);


app.post(`${BASE_URL}/fraud-check`, testFraudChecker);


app.post(`${BASE_URL}/admin/login`, adminLogin);
app.get(`${BASE_URL}/admin/getAllRoles`, getAllRoles);
app.get(`${BASE_URL}/admin/getAdmins`, getAdmins);
app.get(`${BASE_URL}/admin/admins/filter-list`, getAdminFilterList);
app.get(`${BASE_URL}/admin/getAdminById/:id`, getAdminById);
app.post(`${BASE_URL}/admin/createAdmin`, createAdmin);
app.post(`${BASE_URL}/admin/uploadProfileImage/:id`, uploadAdminProfileImage);
app.put(`${BASE_URL}/admin/update/:id`, editAdmin);
app.delete(`${BASE_URL}/admin/soft-delete/:id`, adminSoftDelete);
app.get(`${BASE_URL}/admin/getAuditLogs`, getAdminAuditLogs);
app.get(`${BASE_URL}/admin/getActionsKey`, getAuditActions);
app.get(`${BASE_URL}/admin/getUserAuditLogs`, getAdminUserAuditLogs);
app.get(`${BASE_URL}/admin/getUserActionsKey`, getAdminUserAuditActions);
app.get(`${BASE_URL}/admin/forgotPassMethods`, getAdminForgotPassMethods); // public — no auth
app.post(`${BASE_URL}/admin/forgotPassword`, otpSendLimiter, forgotPassword);
app.post(`${BASE_URL}/admin/resetPassword`, passResetLimiter, resetPassword);
app.get(`${BASE_URL}/admin/profile`, getOwnProfile);
app.put(`${BASE_URL}/admin/profile`, editOwnProfile);
app.post(`${BASE_URL}/admin/createUser`, adminCreateUser);
app.put(`${BASE_URL}/admin/editUser/:id`, adminEditUser);
app.get(`${BASE_URL}/admin/users`, adminGetUsers);
app.get(`${BASE_URL}/admin/user/:id`, adminGetUserById);
app.delete(`${BASE_URL}/admin/user/:id`, adminSoftDeleteUser);


app.get(`${BASE_URL}/quickAccess`, getQuickAccess);
app.get(`${BASE_URL}/quickAccess/:id`, getQuickAccessById);
app.put(`${BASE_URL}/quickAccess/:id`, updateQuickAccess);

app.get(`${BASE_URL}/admin/dashboard/overview`, getOverview);
app.get(`${BASE_URL}/admin/dashboard/topviewed`, getTopViewedProducts);
app.get(`${BASE_URL}/admin/dashboard/topselling`, getTopSellingProducts);
app.get(`${BASE_URL}/admin/dashboard/topselling-area`, getTopSellingAreas);
app.get(`${BASE_URL}/admin/dashboard/yearly-statistic`, getAccurateMonthlyStats);
app.get(`${BASE_URL}/admin/dashboard/low-stock-products`, getLowStockProducts);
app.get(`${BASE_URL}/admin/dashboard/order-product-overview`, getOrderOverview);

app.get(`${BASE_URL}/admin/order-matrics/dashboard`, getOrderDashboardStats);
app.get(`${BASE_URL}/admin/order-matrics/yearly-comparison`, getYearlyOrderComparison);
app.get(`${BASE_URL}/admin/order-matrics/report`, getOrderReport);

app.get(`${BASE_URL}/admin/visitor-metrics/report`, getVisitorReport);
app.get(`${BASE_URL}/admin/visitor-metrics/trend`, getDailyVisitorTrend);
app.get(`${BASE_URL}/admin/visitor-metrics/top-viewd-product`, getTopViewedProductsReport);

app.get(`${BASE_URL}/admin/product-metrics/dashboard-summery`, getProductDashboardSummery);
app.get(`${BASE_URL}/admin/product-metrics/top-selling-categories`, getCategorySalesAnalytics);
app.get(`${BASE_URL}/admin/product-metrics/report`, getProductSalesReport);


app.get(`${BASE_URL}/admin/item-metrics/dashboard-summery`, getInventoryStockSummery);
app.get(`${BASE_URL}/admin/item-metrics/category-stock-summery`, getCategoryStockSummary);
app.get(`${BASE_URL}/admin/item-metrics/stock-trend`, getStockTrend);
app.get(`${BASE_URL}/admin/item-metrics/report`, getStockReport);


app.post(`${BASE_URL}/categories/mainCategory`, createMainCategory);
app.put(`${BASE_URL}/categories/mainCategory/:id`, updateMainCategory);
app.get(`${BASE_URL}/categories/mainCategories`, getMainCategories);
app.get(`${BASE_URL}/categories/mainCategory/:id`, getMainCategoryById);
app.delete(`${BASE_URL}/categories/mainCategory/:id`, deleteMainCategory);

app.post(`${BASE_URL}/categories/subCategory`, createSubCategory);
app.put(`${BASE_URL}/categories/subCategory/:id`, updateSubCategory);
app.get(`${BASE_URL}/categories/subCategories`, getSubCategories);
app.get(`${BASE_URL}/categories/subCategory/:id`, getSubCategoryById);
app.delete(`${BASE_URL}/categories/subCategory/:id`, deleteSubCategory);

app.post(`${BASE_URL}/categories/childCategory`, createChildCategory);
app.put(`${BASE_URL}/categories/childCategory/:id`, updateChildCategory);
app.get(`${BASE_URL}/categories/childCategories`, getChildCategories);
app.get(`${BASE_URL}/categories/childCategory/:id`, getChildCategoryById);
app.delete(`${BASE_URL}/categories/childCategory/:id`, deleteChildCategory);

app.post(`${BASE_URL}/brand`, createBrand);
app.put(`${BASE_URL}/brand/:id`, updateBrand);
app.delete(`${BASE_URL}/brand/:id`, deleteBrand);
app.get(`${BASE_URL}/brands`, getBrands);
app.get(`${BASE_URL}/brand/:id`, getBrandById);

app.post(`${BASE_URL}/banner`, createBanner);
app.get(`${BASE_URL}/banners`, getAllBanners);
app.get(`${BASE_URL}/banner/:id`, getBannerById);
app.get(`${BASE_URL}/user/banners`, getActiveBanners);
app.get(`${BASE_URL}/user/banner/:id`, getBannerByIdUser);
app.put(`${BASE_URL}/banner/:id`, updateBanner);
app.delete(`${BASE_URL}/banner/:id`, deleteBanner);

app.post(`${BASE_URL}/color`, createColor);
app.put(`${BASE_URL}/color/:id`, updateColor);
app.delete(`${BASE_URL}/color/:id`, deleteColor);
app.get(`${BASE_URL}/colors`, getColors);
app.get(`${BASE_URL}/color/:id`, getColorById);

app.post(`${BASE_URL}/attribute`, createAttribute);
app.put(`${BASE_URL}/attribute/:id`, updateAttribute);
app.delete(`${BASE_URL}/attribute/:id`, deleteAttribute);
app.get(`${BASE_URL}/attributes`, getAttributes);
app.get(`${BASE_URL}/attribute/:id`, getAttributeById);
app.post(`${BASE_URL}/variant`, createVariant);
app.put(`${BASE_URL}/variant/:id`, updateVariant);
app.delete(`${BASE_URL}/variant/:id`, deleteVariant);
app.get(`${BASE_URL}/variants`, getVariants);
app.get(`${BASE_URL}/variant/:id`, getVariantById);
app.patch(`${BASE_URL}/attribute/:attribute_id/variants/reorder`, reorderVariants);



app.post(`${BASE_URL}/product`, createProduct);
app.put(`${BASE_URL}/product/:id`, editProduct);
app.get(`${BASE_URL}/products`, getProducts);
app.get(`${BASE_URL}/product/:id`, getProductById);
app.delete(`${BASE_URL}/product/:id`, deleteProduct);
app.post(`${BASE_URL}/product/variation`, createProductVariation);
app.get(`${BASE_URL}/product/getvariations/:product_id`, getProductVariations);
app.get(`${BASE_URL}/product/variation/:id`, getProductVariationById);
app.put(`${BASE_URL}/product/variation/:id`, editProductVariation);
app.delete(`${BASE_URL}/product/variation/:id`, deleteProductVariation);
app.post(`${BASE_URL}/product/draft-img`, uploadDraftImages);
app.post(`${BASE_URL}/product/delete-draft-img`, deleteDraftImages);
app.patch(`${BASE_URL}/admin/product/:id/images/reorder`, reorderProductImages);
app.patch(`${BASE_URL}/admin/product/:id/toggle-single-page`, toggleSingleProductPage);
app.patch(`${BASE_URL}/admin/product/image/:imageId/sku`, assignImageSku);



app.get(`${BASE_URL}/user/products`, getProductsusers);
app.get(`${BASE_URL}/user/product/:id`, getProductByIdUser);
app.get(`${BASE_URL}/user/product/:id/single-page-data`, getSinglePageData);
app.get(`${BASE_URL}/user/product/getvariations/:product_id`, getProductVariationsUser);
app.get(`${BASE_URL}/user/product/variation/:id`, getProductVariationByIdUser);
app.post(`${BASE_URL}/user/cart/sync`, syncCartItemsUser);

// Compare & Budget Plan (public, no auth required)
app.get(`${BASE_URL}/user/compare`, compareProducts);
app.post(`${BASE_URL}/user/budget-plan`, budgetPlan);

// User-facing discount rules (public, no auth)
app.get(`${BASE_URL}/user/bulk-rules`, getBulkRulesUser);
app.get(`${BASE_URL}/user/combo-rules`, getComboRulesUser);
app.get(`${BASE_URL}/user/cart-discount-config`, getCartDiscountConfigUser);

app.post(`${BASE_URL}/user/gauth`, googleAuth);
app.post(`${BASE_URL}/user`, createUser);
app.post(`${BASE_URL}/user/resendVerificationOtp`, otpSendLimiter, resendVerificationOtp);
app.post(`${BASE_URL}/user/verifyEmailOtp`, verifyEmailOtp);
app.post(`${BASE_URL}/user/login`, loginUser);
app.get(`${BASE_URL}/user/profile`, getProfile);
app.put(`${BASE_URL}/user/profile`, editProfile);
app.patch(`${BASE_URL}/user/setInitialPassword`, setInitialPassword);
app.patch(`${BASE_URL}/user/changePassword`, changePassword);
app.get(`${BASE_URL}/user/forgotPassMethods`, getUserForgotPassMethods); // public — no auth
app.post(`${BASE_URL}/user/forgotPassword`, otpSendLimiter, userForgotPassword);
app.post(`${BASE_URL}/user/verifyForgotPasswordOtp`, otpVerifyLimiter, verifyUserForgotPasswordOtp);
app.post(`${BASE_URL}/user/resetPasswordbyOtp`, passResetLimiter, userResetPassword);
// app.post(`${BASE_URL}/user/insertPhone`, insertPhone);
app.post(`${BASE_URL}/user/sendPhoneOtp`, sendPhoneOtp);
app.post(`${BASE_URL}/user/verifyPhoneOtp`, verifyPhoneOtp);
// app.patch(`${BASE_URL}/user/setDefaultPhone`, setDefaultPhone);
app.get(`${BASE_URL}/user/phones`, getPhones);
app.delete(`${BASE_URL}/user/phone/:phone_id`, deletePhone);
app.post(`${BASE_URL}/user/address`, createAddress);
app.put(`${BASE_URL}/user/address/:address_id`, editAddress);
app.patch(`${BASE_URL}/user/setDefaultAddress`, setDefaultAddress);
app.get(`${BASE_URL}/user/addresses`, getAddresses);
app.get(`${BASE_URL}/user/address/:address_id`, getAddressById);
app.delete(`${BASE_URL}/user/address/:address_id`, deleteAddress);

// routes.js
app.post(`${BASE_URL}/user/favorites/:product_id`, addToFavorites);
// app.delete(`${BASE_URL}/user/favorites/:product_id`, removeFromFavorites);
// app.get(`${BASE_URL}/user/favorites`, getFavorites);
// app.get(`${BASE_URL}/user/favorites/check/:product_id`, checkFavoriteStatus);
// app.delete(`${BASE_URL}/user/favorites`, clearFavorites);
// app.get(`${BASE_URL}/user/favorites/ids`, getFavoriteProductIds);
app.post(`${BASE_URL}/user/favorites/:product_id/toggle`, toggleFavorite);



app.post(`${BASE_URL}/delivery/charge`, createDeliveryCharge);
app.put(`${BASE_URL}/delivery/charge/:id`, editDeliveryCharge);
app.get(`${BASE_URL}/delivery/charges`, getDeliveryCharges);
app.get(`${BASE_URL}/delivery/charge/:id`, getDeliveryChargeById);
app.delete(`${BASE_URL}/delivery/charge/:id`, deleteDeliveryCharge);

app.get(`${BASE_URL}/user/delivery/charges`, getGuestDeliveryChargesUser);



app.post(`${BASE_URL}/coupon`, createCoupon);
app.put(`${BASE_URL}/coupon/:id`, editCoupon);
app.get(`${BASE_URL}/coupons`, getCoupons);
app.get(`${BASE_URL}/coupon/:id`, getCouponById);
app.delete(`${BASE_URL}/coupon/:id`, deleteCoupon);
app.get(`${BASE_URL}/usersScope`, getUsers);
app.get(`${BASE_URL}/productScope`, getProductVariationscoupon);

app.post(`${BASE_URL}/validateCoupon`, validateCoupon);




app.post(`${BASE_URL}/user/order`, createOrder);


app.post(`${BASE_URL}/payment/initiatePayment/:orderId`, initiatePayment);


app.post(`${BASE_URL}/payment/sslCommerzIPN`, sslCommerzIPN);
app.post(`${BASE_URL}/payment/sslCommerzCallback`, sslCommerzCallback);
app.post(`${BASE_URL}/payment/sslCommerzFail`, sslCommerzFail);
app.post(`${BASE_URL}/payment/sslCommerzCancel`, sslCommerzCancel);

app.post(`${BASE_URL}/payment/bkashCallback`, bkashCallback);
app.post(`${BASE_URL}/payment/shurjopayCallback`, shurjopayCallback);


// Order event version — lightweight polling gate for admin panel
const { getOrderEventVersion } = require('./helpers/orderEventVersion');

const {
  createSinglePageSession,
  sendSinglePagePhoneOtp,
  verifySinglePagePhoneOtp,
  sendSinglePageEmailOtp,
  verifySinglePageEmailOtp,
  getSinglePageOrderPermissions,
  placeSinglePageOrder,
  initiateSinglePagePayment
} = require('./controllers/single_page_order');

app.get(`${BASE_URL}/admin/orders/event-version`, (req, res) => {
  res.json({ version: getOrderEventVersion() });
});

app.get(`${BASE_URL}/admin/orders`, getOrders);
app.get(`${BASE_URL}/user/orders`, getMyOrdersUser);
app.get(`${BASE_URL}/user/order/:order_id`, getMySingleOrder);

// These must come BEFORE /admin/order/:id to avoid wildcard capture
app.post(`${BASE_URL}/admin/order/assign`, assignOrder);
app.get(`${BASE_URL}/admin/order/assignment-logs`, getAssignmentLogs);
app.post(`${BASE_URL}/admin/order/refund`, createRefund);
app.patch(`${BASE_URL}/admin/order/refund/:id/status`, updateRefundStatus);

app.get(`${BASE_URL}/admin/order/:id`, getSingleOrderById);
app.get(`${BASE_URL}/admin/order/:order_id/refunds`, getRefundsByOrder);
app.patch(`${BASE_URL}/admin/order/paymentstatus/:order_id`, updateOrderPaymentStatus);
app.patch(`${BASE_URL}/admin/order/status/:order_id`, updateOrderStatus);
app.patch(`${BASE_URL}/admin/order/info/:id`, updateOrderInfo);
app.patch(`${BASE_URL}/admin/order/items/:id`, updateOrderItems);
// V2-019: Refund Ledger
app.post(`${BASE_URL}/admin/order/refund`,              createRefund);
app.get(`${BASE_URL}/admin/order/refund/:order_id`,     getRefundsByOrder);
app.patch(`${BASE_URL}/admin/order/refund/status/:id`,  updateRefundStatus);
app.patch(`${BASE_URL}/user/order/cancel/:order_id`, cancelOrderByUser);


app.post(`${BASE_URL}/admin/order/dispatch/:orderId`, dispatchOrder);
app.post(`${BASE_URL}/admin/orders/bulk-dispatch`, dispatchBulkOrders);
app.post(`${BASE_URL}/webhooks/:provider`, handleWebhook);
app.post(`${BASE_URL}/admin/order/manualDispatchOrder/:orderId`, manualDispatchOrder);
app.get(`${BASE_URL}/admin/order/track/:order_id`, trackOrderCourier);
app.post(`${BASE_URL}/admin/order/sync-courier-status/:orderId`, syncCourierStatus);
app.post(`${BASE_URL}/admin/orders/bulk-sync-courier-status`, bulkSyncCourierStatus);
app.get(`${BASE_URL}/admin/orders/status-history`, getOrderStatusHistory);



app.post(`${BASE_URL}/admin/manual-order`, createManualOrder);
app.post(`${BASE_URL}/admin/manual-address`, createAddressForCustomer);
app.post(`${BASE_URL}/admin/manual-order-stranger`, createManualOrderForStranger);
app.post(`${BASE_URL}/payment/stranger/:orderId/initiate`, initiateOrderPayment);
app.post(`${BASE_URL}/admin/manual-payment/:order_id`, markOrderPaidManually);





// Guest Order Routes
app.post(`${BASE_URL}/guest/order`, createGuestOrder);

app.post(`${BASE_URL}/guest/orders`, getGuestOrdersByIds);
app.get(`${BASE_URL}/guest/order/:id`, getGuestOrder);

// app.post(`${BASE_URL}/guest/order/:id/validate-coupon`, validateGuestCoupon);
app.put(`${BASE_URL}/guest/order/:id`, updateGuestOrder);
// app.put(`${BASE_URL}/guest/order/:id/pament&charge`, updateGuestOrderPayment);


// Single Item Operations
app.post(`${BASE_URL}/guest/order/:id/items`, addGuestOrderItem);
app.delete(`${BASE_URL}/guest/order/:id/items/:itemId`, removeGuestOrderItem);
// Bulk Operations
app.post(`${BASE_URL}/guest/order/:id/items/bulk-add`, bulkAddGuestOrderItems);
app.post(`${BASE_URL}/guest/order/:id/items/bulk-remove`, bulkRemoveGuestOrderItems);
app.post(`${BASE_URL}/guest/order/:id/items/bulk-update`, bulkUpdateGuestOrderItems);
app.post(`${BASE_URL}/guest/order/:id/items/replace`, replaceGuestOrderItems);




app.post(`${BASE_URL}/guest/order/:id/verify-phone`, verifyGuestPhone);
app.post(`${BASE_URL}/guest/order/:id/resend-otp`, resendGuestOTP);
app.post(`${BASE_URL}/guest/order/:id/cancel`, cancelGuestOrder);

// Guest Email OTP endpoints (for email verification at checkout)
app.post(`${BASE_URL}/guest/order/:id/send-email-otp`, otpSendLimiter, sendGuestEmailOtp);
app.post(`${BASE_URL}/guest/order/:id/verify-email-otp`, otpVerifyLimiter, verifyGuestEmailOtp);

// Guest order permissions (public, no auth required)
app.get(`${BASE_URL}/guest/orderPermissions`, getGuestOrderPermissions);



// app.get(`${BASE_URL}/guest/order/:id/validate-for-initiate`, validateGuestOrderForCompletion);
app.post(`${BASE_URL}/guest/order/:id/initiate`, placeGuestOrder);
app.post(`${BASE_URL}/guest/order/:guestOrderId/initiate-payment`, initiateGuestPayment);
app.get(`${BASE_URL}/guest/order/:guestOrderId/payment-status`, checkGuestPaymentStatus);




app.get(`${BASE_URL}/admin/guest-orders`, adminGetGuestOrders);
app.patch(`${BASE_URL}/admin/guest-order/:id/status`, adminUpdateGuestOrderStatus);
app.get(`${BASE_URL}/admin/guest-order/:id`, adminGetGuestOrderDetails);



app.delete(`${BASE_URL}/admin/guest-order/:id`, adminDeleteGuestOrder);
app.post(`${BASE_URL}/admin/guest-order/:id/restore`, adminRestoreGuestOrder);

// ─────────────────────────────────────────────────────────────
// Single Product Page — No-Login Checkout Flow
// ─────────────────────────────────────────────────────────────
app.post(`${BASE_URL}/single-page/session`, createSinglePageSession);
app.post(`${BASE_URL}/single-page/send-phone-otp`, otpSendLimiter, sendSinglePagePhoneOtp);
app.post(`${BASE_URL}/single-page/verify-phone-otp`, otpVerifyLimiter, verifySinglePagePhoneOtp);
app.post(`${BASE_URL}/single-page/send-email-otp`, otpSendLimiter, sendSinglePageEmailOtp);
app.post(`${BASE_URL}/single-page/verify-email-otp`, otpVerifyLimiter, verifySinglePageEmailOtp);
app.get(`${BASE_URL}/single-page/order-permissions`, getSinglePageOrderPermissions);
app.post(`${BASE_URL}/single-page/place-order`, placeSinglePageOrder);
app.post(`${BASE_URL}/single-page/initiate-payment/:orderId`, initiateSinglePagePayment);


// ─────────────────────────────────────────────────────────────
// Analytics — CAPI Tracking (client-side triggered)
// ─────────────────────────────────────────────────────────────
app.post(`${BASE_URL}/track/purchase`,     trackCapiPurchase);
app.post(`${BASE_URL}/track/registration`, trackCapiRegistration);

app.post(`${BASE_URL}/admin/video`, createProductVideo);

app.get(`${BASE_URL}/videos`, getAllProductVideos);
app.get(`${BASE_URL}/video/byId/:id`, getProductVideoById);
app.get(`${BASE_URL}/video/byProductId/:product_id`, getVideoByProductId);

app.put(`${BASE_URL}/admin/video/:id`, updateProductVideo);
app.delete(`${BASE_URL}/admin/video/:id`, deleteProductVideo);



app.post(`${BASE_URL}/contact-message`, createContactMessage);
app.get(`${BASE_URL}/admin/contact-messages`, getAllContactMessages);
app.get(`${BASE_URL}/admin/contact-message/:id`, getContactMessageById);
app.delete(`${BASE_URL}/admin/contact-message/:id`, deleteContactMessage);
app.patch(`${BASE_URL}/admin/contact-message/:id/toggle-status`, toggleContactMessageStatus);
app.post(`${BASE_URL}/admin/contact-message/reply`, replyToContactMessage);
app.get(`${BASE_URL}/contact-messages/search`, searchContactHistory);
app.patch(`${BASE_URL}/admin/contact-message/:id/assign`, assignContactMessage); // V2-036


// V2-036: Report System — Public
app.post(`${BASE_URL}/report`, createReport);
app.get(`${BASE_URL}/report/track`, trackReport);
app.get(`${BASE_URL}/my-reports`, getMyReports);
app.get(`${BASE_URL}/my-contact-messages`, getMyContactMessages); // V2-041

// V2-036: Report System — Admin
app.get(`${BASE_URL}/admin/reports`, adminListReports);
app.get(`${BASE_URL}/admin/reports/counts`, adminReportCounts);
app.get(`${BASE_URL}/admin/reports/:id`, adminGetReport);
app.post(`${BASE_URL}/admin/reports/:id/reply`, adminReplyReport);
app.patch(`${BASE_URL}/admin/reports/:id/assign`, adminAssignReport);
app.patch(`${BASE_URL}/admin/reports/:id/status`, adminUpdateReportStatus);
app.delete(`${BASE_URL}/admin/reports/:id`, adminDeleteReport);

// V2-036: Report Distribution Pool — SUPER_ADMIN only
app.get(`${BASE_URL}/admin/report-distribution/settings`, getReportDistributionSettings);
app.patch(`${BASE_URL}/admin/report-distribution/settings`, updateReportDistributionSettings);
app.get(`${BASE_URL}/admin/report-distribution/agents`, getReportDistributionAgents);
app.get(`${BASE_URL}/admin/report-distribution/eligible-admins`, getReportEligibleAdmins); // V2-037
app.post(`${BASE_URL}/admin/report-distribution/agent/:admin_id`, upsertReportAgent);
app.delete(`${BASE_URL}/admin/report-distribution/agent/:admin_id`, removeReportAgent);
app.post(`${BASE_URL}/admin/report-distribution/redistribute`, redistributeReports);
// V2-038: Report Manual Assign/Unassign/Logs
app.post(`${BASE_URL}/admin/report/assign`, assignReport);
app.delete(`${BASE_URL}/admin/report/unassign/:report_id`, unassignReport);
app.get(`${BASE_URL}/admin/report/assignment-logs`, getReportAssignmentLogs);

// V2-037: Contact Distribution Pool
app.get(`${BASE_URL}/admin/contact-distribution/settings`, getContactDistributionSettings);
app.patch(`${BASE_URL}/admin/contact-distribution/settings`, updateContactDistributionSettings);
app.get(`${BASE_URL}/admin/contact-distribution/eligible-admins`, getContactEligibleAdmins);
app.post(`${BASE_URL}/admin/contact-distribution/agent/:admin_id`, upsertContactAgent);
app.delete(`${BASE_URL}/admin/contact-distribution/agent/:admin_id`, removeContactAgent);
app.post(`${BASE_URL}/admin/contact-distribution/redistribute`, redistributeContactMessages);
app.get(`${BASE_URL}/admin/contact-messages/counts`, getContactCounts); // upgrade existing
// V2-038: Contact Manual Assign/Unassign/Logs
app.post(`${BASE_URL}/admin/contact-message/assign`, assignContactMessageManual);
app.delete(`${BASE_URL}/admin/contact-message/unassign/:message_id`, unassignContactMessage);
app.get(`${BASE_URL}/admin/contact-message/assignment-logs`, getContactAssignmentLogs);
app.post(`${BASE_URL}/admin/contact-messages/mark-all-read`, markAllContactMessagesRead); // V2: bell clear button


app.post(`${BASE_URL}/subscribe`, subscribe);
app.get(`${BASE_URL}/admin/subscribes`, getAllSubscribers);
app.get(`${BASE_URL}/admin/subscriber/:id`, getSubscriberById);
app.patch(`${BASE_URL}/admin/subscriber/:id/manual-sub-toggle`, toggleSubscription);
app.patch(`${BASE_URL}/admin/subscriber/:id/manual-ban-toggle`, toggleBanSubscriber);
app.post(`${BASE_URL}/subscriber/unsubscribe`, unsubscribe);


app.post(`${BASE_URL}/admin/announcement`, createAnnouncement);
app.get(`${BASE_URL}/admin/announcements`, getAllAnnouncements);
app.get(`${BASE_URL}/admin/announcement/:id`, getAnnouncementById);
app.get(`${BASE_URL}/admin/announcements/alert`, getAnnouncementCounts);
app.put(`${BASE_URL}/admin/announcement/:id`, editAnnouncement);
app.delete(`${BASE_URL}/admin/announcement/:id`, deleteAnnouncement);

app.post(`${BASE_URL}/admin/announcement/send/:id`, sendAnnouncement);
app.post(`${BASE_URL}/admin/announcement/send-manual`, sendManualAnnouncement);

// City zone suggestions (for announcement zone targeting)
app.get(`${BASE_URL}/admin/city-zones`, getCityZones);



// Dynamic Policies
app.get(`${BASE_URL}/admin/policies`, getPolicies);
app.get(`${BASE_URL}/admin/policy/:key`, getPolicyByKey);
app.post(`${BASE_URL}/admin/policy`, upsertPolicy);
app.patch(`${BASE_URL}/admin/policy/:key`, patchPolicy);
app.delete(`${BASE_URL}/admin/policy/:key`, deletePolicy);
app.get(`${BASE_URL}/policies`, getPublicPolicies);
app.get(`${BASE_URL}/policy/:key`, getPublicPolicyByKey);


// Discount Rules
app.get(`${BASE_URL}/admin/discount/skus`, searchSkus);
app.get(`${BASE_URL}/admin/discount/bulk-rules`, getSkuBulkRules);
app.post(`${BASE_URL}/admin/discount/bulk-rule`, createSkuBulkRule);
app.put(`${BASE_URL}/admin/discount/bulk-rule/:id`, editSkuBulkRule);
app.delete(`${BASE_URL}/admin/discount/bulk-rule/:id`, deleteSkuBulkRule);
app.get(`${BASE_URL}/admin/discount/combo-rules`, getComboRules);
app.post(`${BASE_URL}/admin/discount/combo-rule`, createComboRule);
app.put(`${BASE_URL}/admin/discount/combo-rule/:id`, editComboRule);
app.delete(`${BASE_URL}/admin/discount/combo-rule/:id`, deleteComboRule);

// Mega Sale Management (V2-037)
app.get(`${BASE_URL}/admin/megasale/settings`, getMegaSaleSettings);
app.put(`${BASE_URL}/admin/megasale/settings`, updateMegaSaleSettings);
app.get(`${BASE_URL}/admin/megasale/products`, getMegaSaleProductsList);
app.post(`${BASE_URL}/admin/megasale/product`, addMegaSaleProduct);
app.put(`${BASE_URL}/admin/megasale/product/:id`, updateMegaSaleProduct);
app.delete(`${BASE_URL}/admin/megasale/product/:id`, deleteMegaSaleProduct);
app.get(`${BASE_URL}/admin/megasale/product/:id/skus`, getMegaSaleProductSkus);
app.put(`${BASE_URL}/admin/megasale/product/:megaSaleProductId/sku/:skuId`, updateSkuOverride);
app.delete(`${BASE_URL}/admin/megasale/sku-override/:skuId`, deleteSkuOverride);
// Public mega sale endpoint
app.get(`${BASE_URL}/user/storefront-visibility`, getStorefrontVisibilityUser);


// Order Distribution & Assignment
app.get(`${BASE_URL}/admin/order-distribution/settings`, getDistributionSettings);
app.patch(`${BASE_URL}/admin/order-distribution/settings`, updateDistributionSettings);
app.get(`${BASE_URL}/admin/order-distribution/agents`, getDistributionAgents);
app.get(`${BASE_URL}/admin/order-distribution/eligible-admins`, getEligibleAdmins);
app.post(`${BASE_URL}/admin/order-distribution/agent`, addDistributionAgent);
app.put(`${BASE_URL}/admin/order-distribution/agent/:id`, editDistributionAgent);
app.delete(`${BASE_URL}/admin/order-distribution/agent/:id`, removeDistributionAgent);
app.post(`${BASE_URL}/admin/order-distribution/agent/by-admin/:admin_id`, upsertAgentByAdminId);
app.post(`${BASE_URL}/admin/order-distribution/redistribute-unassigned`, redistributeUnassigned);
app.delete(`${BASE_URL}/admin/order/unassign/:order_id`, unassignOrder);

// Notification History (V2-040)
app.get(`${BASE_URL}/admin/notifications/batches`,   getNotificationBatches); // batch list
app.get(`${BASE_URL}/admin/notifications/logs`,      getNotificationLogs);    // unified filterable logs (NEW)
app.get(`${BASE_URL}/admin/notifications/email-logs`, getEmailLogs);          // email-only
app.get(`${BASE_URL}/admin/notifications/sms-logs`,   getSmsLogs);            // sms-only
app.get(`${BASE_URL}/admin/notifications/push-logs`,  getPushLogs);           // push-only

// V2-042: Review & Rating System — Public / User
app.get(`${BASE_URL}/user/product/:product_id/reviews`, getProductReviews);
app.get(`${BASE_URL}/user/product/:product_id/review-eligibility`, getReviewEligibility);
app.post(`${BASE_URL}/user/review`, submitReview);
app.put(`${BASE_URL}/user/review/:id`, editReview);
app.delete(`${BASE_URL}/user/review/:id`, deleteOwnReview);
app.get(`${BASE_URL}/user/my-reviews`, getMyReviews);

// V2-042: Review & Rating System — Admin
app.get(`${BASE_URL}/admin/reviews`, adminListReviews);
app.get(`${BASE_URL}/admin/reviews/product-summary`, adminProductReviewSummary);
app.get(`${BASE_URL}/admin/reviews/:id`, adminGetReview);
app.post(`${BASE_URL}/admin/reviews/:id/reply`, adminReplyReview);
app.patch(`${BASE_URL}/admin/reviews/:id/pin`, adminTogglePin);
app.patch(`${BASE_URL}/admin/reviews/:id/hide`, adminToggleHide);
app.delete(`${BASE_URL}/admin/reviews/:id`, adminDeleteReview);



// app.get(`*`, (req, res) => {
//   res.sendFile(path.join(__dirname, "index.html"));
// });



http.createServer(app).listen(app.get("port"), async function () {
  console.log(`Server listening on http://localhost:${app.get("port")}`);

  // Seed any missing permission_config rows with their defaults.
  // This runs once per startup and is idempotent (INSERT IGNORE).
  try {
    const database = require('./utils/connection');
    const conn = await database.getConnection();
    await ensurePermissionDefaults(conn);

    // V2-054: Add config_version column if missing (idempotent)
    try {
      await conn.query(`ALTER TABLE firebase_push_credentials ADD COLUMN config_version INT NOT NULL DEFAULT 1`);
      console.log('[Startup] Added config_version column to firebase_push_credentials.');
    } catch (e) {
      if (!e.message?.includes('Duplicate column')) throw e;
      // Column already exists — fine
    }

    await conn.release();
    console.log('[Startup] Permission defaults ensured.');

    // Start the announcement auto-send scheduler (in-process timer, zero external deps)
    startAnnouncementScheduler();

    try {
      require('./services/licenseClient').startLicenseClient();
    } catch (e) {
      console.error('[Startup] licenseClient failed:', e.message);
    }
  } catch (err) {
    console.error('[Startup] ensurePermissionDefaults failed:', err.message);
  }
});

