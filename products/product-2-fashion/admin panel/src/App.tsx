import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";

import SignIn from "./pages/AuthPages/SignIn";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import PushNotificationProvider from "./providers/PushNotificationProvider";


import Home from "./pages/Dashboard/Home";
import NewSale from "./pages/Sales/NewSale";

import AllOrders from "./pages/Orders/AllOrders";
import GuestOrders from "./pages/Orders/GuestOrders";
import SinglePageOrders from "./pages/Orders/SinglePageOrders";
import OrderEditor from "./pages/Orders/OrderEditor";

import AllProducts from "./pages/Products/AllProducts";
import ProductCategory from "./pages/Products/ProductCategory";
import ProductAttributes from "./pages/Products/ProductAttributes";
import CreateProduct from "./pages/Products/CreateProduct";

import CustomersList from "./pages/Customers/CustomersList";
import CreateCustomerPage from "./pages/Customers/CreateCustomerPage";

import AdminsList from "./pages/Admins/AdminsList";
import CreateAdmin from "./pages/Admins/CreateAdmin";

import DeliverySettings from "./pages/BusinessSettings/DeliverySettings";
import CurrierSettings from "./pages/BusinessSettings/CurrierSettings";
import CouponCode from "./pages/BusinessSettings/CouponCode";
import PaymentSettings from "./pages/BusinessSettings/PaymentSettings";
import AnalyticsSettings from "./pages/BusinessSettings/AnalyticsSettings";

import BannersSettings from "./pages/WebsiteSettings/BannersSettings";
import BannerVideoSettings from "./pages/WebsiteSettings/BannerVideoSettings";
import ContactPage from "./pages/WebsiteSettings/ContactPage";
import FooterSettings from "./pages/WebsiteSettings/footer-settings";

import MyProfile from "./pages/MyProfile/MyProfile";

import ProductReports from "./pages/Reports/ProductReports";
import OrderReport from "./pages/Reports/OrderReport";
import StockReport from "./pages/Reports/StockReport";
import VisitorReport from "./pages/Reports/VisitorReport";

import NotFound from "./pages/OtherPage/NotFound";

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicOnlyRoute from "./routes/PublicOnlyRoute";
import OrderInvoice from "./pages/Orders/OrderInvoice";
import SupportPage from "./pages/SupportPage";
import BusinessServicePage from "./pages/BusinessSettings/service";

// ✅ V2 new pages
import FirebaseCredentialPage from "./pages/BusinessSettings/FirebaseCredentialPage";
import PermissionsPage from "./pages/Admins/PermissionsPage";
import PoliciesPage from "./pages/WebsiteSettings/PoliciesPage";
import SubscribersPage from "./pages/WebsiteSettings/SubscribersPage";
import DiscountRulesPage from "./pages/BusinessSettings/DiscountRulesPage";
import OrderDistributionPage from "./pages/BusinessSettings/OrderDistributionPage";
import NotificationHistoryPage from "./pages/BusinessSettings/NotificationHistoryPage";
import AdminAuditLogsPage from "./pages/Admins/AdminAuditLogsPage";
import UserAuditLogsPage from "./pages/Admins/UserAuditLogsPage";
import AnnouncementsListPage from "./pages/Announcements/AnnouncementsListPage";
import CreateAnnouncementPage from "./pages/Announcements/CreateAnnouncementPage";
import ReportsPage from "./pages/SupportMessages/ReportsPage";
import ReviewsPage from "./pages/Products/ReviewsPage";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <PushNotificationProvider />

        <Routes>
          {/* ✅ Public-only: login page (if already logged in -> redirect to /dashboard) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/" element={<SignIn />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
          <Route path="/support" element={<SupportPage />} />

          {/* ✅ Auth required for everything inside */}
          <Route element={<ProtectedRoute redirectTo="/" />}>
            <Route path="/order-invoice/:orderId" element={<OrderInvoice />} />

            <Route element={<AppLayout />}>
              {/* Dashboard */}
              <Route path="/dashboard" element={<Home />} />
              <Route path="/new-sale" element={<NewSale />} />

              {/* Orders */}
              <Route path="/all-orders" element={<AllOrders />} />
              <Route path="/order-editor" element={<OrderEditor />} />
              <Route path="/guest-orders" element={<GuestOrders />} />
              <Route path="/single-page-orders" element={<SinglePageOrders />} />

              {/* Products */}
              <Route path="/all-products" element={<AllProducts />} />
              <Route path="/product-category" element={<ProductCategory />} />
              <Route
                path="/product-attributes"
                element={<ProductAttributes />}
              />
              <Route path="/create-product" element={<CreateProduct />} />

              {/* Customers */}
              <Route path="/customers-list" element={<CustomersList />} />
              <Route path="/create-customer" element={<CreateCustomerPage />} />

              {/* Website Settings */}
              <Route path="/banners-settings" element={<BannersSettings />} />
              <Route
                path="/banner-video-settings"
                element={<BannerVideoSettings />}
              />
              <Route path="/contact-page"      element={<ContactPage />} />
              <Route path="/contact-messages"  element={<ContactPage />} />
              <Route path="/footer-settings" element={<FooterSettings />} />

              {/* Reports */}
              <Route path="/product-reports" element={<ProductReports />} />
              <Route path="/order-reports" element={<OrderReport />} />
              <Route path="/stock-reports" element={<StockReport />} />
              <Route path="/visitor-report" element={<VisitorReport />} />

              {/* Profile */}
              <Route path="/my-profile" element={<MyProfile />} />

              {/* ✅ Admin & Permission — SUPER_ADMIN + admin.manage */}
              <Route
                element={
                  <ProtectedRoute
                    roles={["SUPER_ADMIN"]}
                    permissions={["admin.manage"]}
                    inPageDenied
                    deniedTitle="Admin Management Restricted"
                    deniedDescription="Only Super Admins can manage admin accounts and create new administrators."
                    deniedHint="Contact your Super Admin to request access or role elevation."
                  />
                }
              >
                <Route path="/admins-list" element={<AdminsList />} />
                <Route path="/create-admin" element={<CreateAdmin />} />
              </Route>

              {/* Business Settings (keep protected; you can add more permissions later) */}
              <Route path="/delivery-settings" element={<DeliverySettings />} />
              <Route
                element={
                  <ProtectedRoute
                    roles={["SUPER_ADMIN"]}
                    inPageDenied
                    deniedTitle="Access Restricted"
                    deniedDescription="Only Super Admins can manage this setting."
                    deniedHint="Contact your Super Admin for access."
                  />
                }
              >
                <Route path="/currier-settings" element={<CurrierSettings />} />
                <Route path="/service-settings" element={<BusinessServicePage />} />
                <Route path="/payment-settings" element={<PaymentSettings />} />
              </Route>
              <Route path="/coupon-code" element={<CouponCode />} />
              <Route path="/analytics-settings" element={<AnalyticsSettings />} />

              {/* ✅ V2: Firebase — SUPER_ADMIN only */}
              <Route
                element={
                  <ProtectedRoute
                    roles={["SUPER_ADMIN"]}
                    inPageDenied
                    deniedTitle="Firebase Configuration Restricted"
                    deniedDescription="Only Super Admins can manage Firebase push notification credentials."
                    deniedHint="Contact your Super Admin if you need to update Firebase settings."
                  />
                }
              >
                <Route path="/firebase-credential" element={<FirebaseCredentialPage />} />
              </Route>
              <Route path="/discount-rules" element={<DiscountRulesPage />} />
              <Route path="/order-distribution" element={<OrderDistributionPage />} />
              <Route path="/notification-history" element={<NotificationHistoryPage />} />

              {/* ✅ V2: Website Settings */}
              <Route path="/policies" element={<PoliciesPage />} />
              <Route path="/subscribers" element={<SubscribersPage />} />

              {/* ✅ V2: Admin & Permissions */}
              <Route path="/notification-permissions" element={<PermissionsPage />} />
              <Route path="/permissions" element={<PermissionsPage />} />
              <Route path="/admin-audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="/user-audit-logs" element={<UserAuditLogsPage />} />

              {/* ✅ V2: Announcements */}
              <Route path="/announcements" element={<AnnouncementsListPage />} />
              <Route path="/create-announcement" element={<CreateAnnouncementPage />} />
              <Route path="/edit-announcement/:id" element={<CreateAnnouncementPage edit />} />

              {/* ✅ V2-036: Support Reports */}
              <Route path="/support-reports" element={<ReportsPage />} />

              {/* ✅ V2-050: Product Reviews */}
              <Route path="/product-reviews" element={<ReviewsPage />} />
            </Route>
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

