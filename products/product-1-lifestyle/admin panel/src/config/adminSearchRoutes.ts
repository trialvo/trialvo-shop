/**
 * Flat searchable admin routes for the header command search.
 * Paths mirror AppSidebar — navigation only, no API calls.
 */

export type AdminSearchRoute = {
  /** i18n key under `sidebar.*` */
  nameKey: string;
  path: string;
  /** Parent group i18n key for context in results */
  groupKey: string;
  superAdminOnly?: boolean;
};

export const ADMIN_SEARCH_ROUTES: AdminSearchRoute[] = [
  { nameKey: "dashboard", path: "/dashboard", groupKey: "menu" },
  { nameKey: "newSale", path: "/new-sale", groupKey: "menu" },

  { nameKey: "allOrders", path: "/all-orders", groupKey: "orders" },
  { nameKey: "editOrder", path: "/order-editor", groupKey: "orders" },
  { nameKey: "guestOrders", path: "/guest-orders", groupKey: "orders" },
  { nameKey: "orderDistribution", path: "/order-distribution", groupKey: "orders" },

  { nameKey: "allProducts", path: "/all-products", groupKey: "products" },
  { nameKey: "createProduct", path: "/create-product", groupKey: "products" },
  { nameKey: "productCategory", path: "/product-category", groupKey: "products" },
  { nameKey: "productAttributes", path: "/product-attributes", groupKey: "products" },
  { nameKey: "discountRules", path: "/discount-rules", groupKey: "products" },
  { nameKey: "productReviews", path: "/product-reviews", groupKey: "products" },

  { nameKey: "productReports", path: "/product-reports", groupKey: "report" },
  { nameKey: "orderReport", path: "/order-reports", groupKey: "report" },
  { nameKey: "stockReports", path: "/stock-reports", groupKey: "report" },
  { nameKey: "visitorReport", path: "/visitor-report", groupKey: "report" },

  { nameKey: "customersList", path: "/customers-list", groupKey: "customer" },
  { nameKey: "createCustomer", path: "/create-customer", groupKey: "customer" },

  { nameKey: "adminsList", path: "/admins-list", groupKey: "adminPermission" },
  { nameKey: "createAdmin", path: "/create-admin", groupKey: "adminPermission" },
  { nameKey: "permissions", path: "/permissions", groupKey: "adminPermission" },

  {
    nameKey: "payment",
    path: "/payment-settings",
    groupKey: "businessSetting",
    superAdminOnly: true,
  },
  { nameKey: "delivery", path: "/delivery-settings", groupKey: "businessSetting" },
  {
    nameKey: "currier",
    path: "/currier-settings",
    groupKey: "businessSetting",
    superAdminOnly: true,
  },
  { nameKey: "couponCode", path: "/coupon-code", groupKey: "businessSetting" },
  {
    nameKey: "serviceSettings",
    path: "/service-settings",
    groupKey: "businessSetting",
    superAdminOnly: true,
  },
  {
    nameKey: "analyticsSettings",
    path: "/analytics-settings",
    groupKey: "businessSetting",
  },
  {
    nameKey: "firebaseCredential",
    path: "/firebase-credential",
    groupKey: "businessSetting",
    superAdminOnly: true,
  },
  {
    nameKey: "notificationHistory",
    path: "/notification-history",
    groupKey: "businessSetting",
  },

  { nameKey: "banners", path: "/banners-settings", groupKey: "websiteSettings" },
  {
    nameKey: "bannerVideo",
    path: "/banner-video-settings",
    groupKey: "websiteSettings",
  },
  { nameKey: "policies", path: "/policies", groupKey: "websiteSettings" },
  { nameKey: "subscribers", path: "/subscribers", groupKey: "websiteSettings" },

  {
    nameKey: "allAnnouncements",
    path: "/announcements",
    groupKey: "announcements",
  },
  {
    nameKey: "createAnnouncement",
    path: "/create-announcement",
    groupKey: "announcements",
  },

  {
    nameKey: "contactMessages",
    path: "/contact-messages",
    groupKey: "supportMessages",
  },
  {
    nameKey: "supportReports",
    path: "/support-reports",
    groupKey: "supportMessages",
  },

  { nameKey: "adminAuditLogs", path: "/admin-audit-logs", groupKey: "auditLogs" },
  { nameKey: "userAuditLogs", path: "/user-audit-logs", groupKey: "auditLogs" },

  { nameKey: "myProfile", path: "/my-profile", groupKey: "others" },
];
