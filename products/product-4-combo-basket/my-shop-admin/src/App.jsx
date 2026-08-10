import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/Layout";

// Pages
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import ProductsPage from "./pages/Products";
import ProductFormPage from "./pages/ProductForm";
import CategoriesPage from "./pages/Categories";
import OrdersPage from "./pages/Orders";
import OrderDetailPage from "./pages/OrderDetail";
import CustomersPage from "./pages/Customers";
import CustomerDetailPage from "./pages/CustomerDetail";
import CouponsPage from "./pages/Coupons";
import ShopConfigPage from "./pages/ShopConfig";
import FAQsPage from "./pages/FAQs";
import MessagesPage from "./pages/Messages";
import SettingsPage from "./pages/Settings";
import AuditLogPage from "./pages/AuditLog";
import SlidersPage from "./pages/Sliders";
import SubscribersPage from "./pages/Subscribers";
import GuestOrdersPage from "./pages/GuestOrders";
import AnalyticsPage from "./pages/Analytics";
import PaymentPage from "./pages/Payment";
import DeliveryPage from "./pages/Delivery";
import CourierPage from "./pages/Courier";
import ServicesPage from "./pages/Services";
import BannerVideoPage from "./pages/BannerVideo";
import WebsiteSettingsPage from "./pages/WebsiteSettings";
import ComboBundlesPage from "./pages/ComboBundles";
import ComboFormPage from "./pages/ComboForm";

// ─── QueryClient with global MutationCache callbacks ─────────────────────────
// MutationCache is the correct React Query v5 way to intercept every mutation.

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
  mutationCache: new MutationCache({
    onSuccess: (_data, _vars, _ctx, mutation) => {
      const msg = mutation.meta?.successMessage;
      // msg === false  → caller wants no toast
      // msg is string  → use custom message
      // msg is undefined → generic fallback
      if (msg !== false) {
        toast.success(msg || "সফলভাবে সম্পন্ন হয়েছে!", {
          duration: 3000,
        });
      }
    },
    onError: (error, _vars, _ctx, mutation) => {
      const msg =
        mutation.meta?.errorMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "কিছু একটা সমস্যা হয়েছে!";
      toast.error(msg, { duration: 4000 });
    },
  }),
});

// ─── Route guard ─────────────────────────────────────────────────────────────

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ── Sonner Toaster ── */}
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        expand={false}
        toastOptions={{
          style: {
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "13px",
            borderRadius: "14px",
            boxShadow:
              "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          },
        }}
      />

      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardPage />} />

            {/* Orders */}
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/guest" element={<GuestOrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />

            {/* Products */}
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/:id/edit" element={<ProductFormPage />} />
            <Route path="categories" element={<CategoriesPage />} />

            {/* Customers */}
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="subscribers" element={<SubscribersPage />} />

            {/* Business */}
            <Route path="shop-config" element={<ShopConfigPage />} />
            <Route path="coupons" element={<CouponsPage />} />
            <Route path="payment" element={<PaymentPage />} />
            <Route path="delivery" element={<DeliveryPage />} />
            <Route path="courier" element={<CourierPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />

            {/* Admin */}
            <Route path="settings" element={<SettingsPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />

            {/* Website */}
            <Route path="website-settings" element={<WebsiteSettingsPage />} />
            <Route path="sliders" element={<SlidersPage />} />
            <Route path="banner-video" element={<BannerVideoPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="faqs" element={<FAQsPage />} />
            <Route path="combo-bundles" element={<ComboBundlesPage />} />
            <Route path="combo-bundles/new" element={<ComboFormPage />} />
            <Route path="combo-bundles/:id/edit" element={<ComboFormPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
