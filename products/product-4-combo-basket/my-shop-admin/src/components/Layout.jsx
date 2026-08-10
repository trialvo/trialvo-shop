import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Ticket,
  Settings2,
  HelpCircle,
  Mail,
  LogOut,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Gift,
  ClipboardList,
  Layers,
  Rss,
  Menu,
  X,
  CreditCard,
  Truck,
  BarChart3,
  MessageSquare,
  Bell,
  Search,
  Bike,
  Tags,
  Video,
  ShieldCheck,
  Zap,
  Globe,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

// ─── Navigation Structure ─────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    id: "dashboard",
    label: "ড্যাশবোর্ড",
    icon: LayoutDashboard,
    to: "/",
    exact: true,
  },
  {
    id: "orders",
    label: "অর্ডার ম্যানেজমেন্ট",
    icon: ShoppingBag,
    children: [
      { to: "/orders", label: "সব অর্ডার", icon: ShoppingBag, exact: true },
      { to: "/orders/guest", label: "গেস্ট অর্ডার", icon: Users },
    ],
  },
  {
    id: "products",
    label: "পণ্য ম্যানেজমেন্ট",
    icon: Package,
    children: [
      { to: "/products", label: "সব পণ্য", icon: Package, exact: true },
      { to: "/products/new", label: "নতুন পণ্য যোগ", icon: Package },
      { to: "/categories", label: "ক্যাটাগরি", icon: Tags },
      { to: "/combo-bundles", label: "কম্বো বান্ডেল", icon: Gift },
    ],
  },
  {
    id: "customers",
    label: "গ্রাহক ম্যানেজমেন্ট",
    icon: Users,
    children: [
      { to: "/customers", label: "সকল গ্রাহক", icon: Users, exact: true },
      { to: "/subscribers", label: "সাবস্ক্রাইবার", icon: Rss },
    ],
  },
  { divider: true },
  {
    id: "admin-perm",
    label: "এডমিন অ্যাকাউন্ট",
    icon: ShieldCheck,
    to: "/settings",
  },
  {
    id: "business",
    label: "ব্যবসায়িক সেটিংস",
    icon: Settings2,
    children: [
      { to: "/shop-config", label: "শপ কনফিগ", icon: Gift },
      { to: "/payment", label: "পেমেন্ট সেটিংস", icon: CreditCard },
      { to: "/delivery", label: "ডেলিভারি সেটিংস", icon: Truck },
      { to: "/courier", label: "কুরিয়ার", icon: Bike },
      { to: "/coupons", label: "কুপন কোড", icon: Ticket },
      { to: "/services", label: "SMS / ইমেইল সার্ভিস", icon: Zap },
      { to: "/analytics", label: "বিশ্লেষণ রিপোর্ট", icon: BarChart3 },
    ],
  },
  { divider: true },
  {
    id: "website",
    label: "ওয়েবসাইট",
    icon: Globe,
    children: [
      { to: "/website-settings", label: "ওয়েবসাইট সেটিংস", icon: Globe },
      { to: "/sliders", label: "ব্যানার স্লাইডার", icon: Layers },
      { to: "/banner-video", label: "ব্যানার ভিডিও", icon: Video },
      { to: "/messages", label: "যোগাযোগ বার্তা", icon: MessageSquare },
      { to: "/faqs", label: "সাধারণ জিজ্ঞাসা", icon: HelpCircle },
    ],
  },
  { divider: true },
  { id: "audit", label: "অডিট লগ", icon: ClipboardList, to: "/audit-log" },
];

const PATH_GROUP_MAP = {
  "/orders": "orders",
  "/orders/guest": "orders",
  "/products": "products",
  "/products/new": "products",
  "/categories": "products",
  "/combo-bundles": "products",
  "/customers": "customers",
  "/subscribers": "customers",
  "/shop-config": "business",
  "/payment": "business",
  "/delivery": "business",
  "/courier": "business",
  "/coupons": "business",
  "/services": "business",
  "/analytics": "business",
  "/website-settings": "website",
  "/sliders": "website",
  "/banner-video": "website",
  "/messages": "website",
  "/faqs": "website",
};

const ROUTE_LABELS = {
  "": "ড্যাশবোর্ড",
  orders: "অর্ডার",
  guest: "গেস্ট অর্ডার",
  products: "পণ্য",
  new: "নতুন পণ্য",
  categories: "ক্যাটাগরি",
  customers: "গ্রাহক",
  subscribers: "সাবস্ক্রাইবার",
  coupons: "কুপন কোড",
  "shop-config": "শপ কনফিগ",
  payment: "পেমেন্ট",
  delivery: "ডেলিভারি",
  courier: "কুরিয়ার",
  services: "সার্ভিস",
  analytics: "বিশ্লেষণ",
  settings: "এডমিন সেটিংস",
  sliders: "ব্যানার",
  "banner-video": "ব্যানার ভিডিও",
  messages: "যোগাযোগ",
  faqs: "সাধারণ জিজ্ঞাসা",
  "website-settings": "ওয়েবসাইট",
  "audit-log": "অডিট লগ",
  "combo-bundles": "কম্বো বান্ডেল",
};

// ─── Sidebar Content ──────────────────────────────────────────────────────────
function SidebarContent({ onClose }) {
  const location = useLocation();
  const activeGroup = PATH_GROUP_MAP[location.pathname];
  const [open, setOpen] = useState(() =>
    activeGroup ? { [activeGroup]: true } : {},
  );
  const toggle = (id) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div
      className="flex flex-col h-full w-64 shrink-0"
      style={{ background: "var(--sidebar-bg)" }}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center justify-between px-4 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg shadow-pink-900/40"
            style={{ background: "linear-gradient(135deg, #e91e63, #f06292)" }}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight tracking-tight">
              ComboBasket
            </p>
            <p
              className="text-[10px] leading-tight"
              style={{ color: "rgba(148,163,184,0.7)" }}
            >
              Admin Dashboard
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-white transition-colors md:hidden"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5 scrollbar-hide">
        {NAV_GROUPS.map((item, idx) => {
          if (item.divider) {
            return (
              <div
                key={`div-${idx}`}
                className="my-1.5 mx-2 h-px"
                style={{ background: "var(--sidebar-border)" }}
              />
            );
          }

          // Single link
          if (item.to) {
            return (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.exact}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 select-none ${
                    isActive
                      ? "text-[#e91e63] font-semibold"
                      : "text-slate-400 hover:text-slate-100"
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive
                    ? "var(--sidebar-active)"
                    : "transparent",
                })}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-[#e91e63]" : "text-slate-500 group-hover:text-slate-300"}`}
                    />
                    <span className="truncate flex-1">{item.label}</span>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#e91e63] shrink-0" />
                    )}
                  </>
                )}
              </NavLink>
            );
          }

          // Group
          const isGroupActive = item.children?.some((c) =>
            c.exact
              ? location.pathname === c.to
              : location.pathname.startsWith(c.to),
          );
          const isOpen = open[item.id];

          return (
            <div key={item.id}>
              <button
                onClick={() => toggle(item.id)}
                className={`group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 select-none ${
                  isGroupActive
                    ? "text-slate-100"
                    : "text-slate-400 hover:text-slate-100"
                }`}
                style={{
                  background:
                    isGroupActive && !isOpen
                      ? "rgba(255,255,255,0.04)"
                      : "transparent",
                }}
              >
                <item.icon
                  className={`h-4 w-4 shrink-0 ${isGroupActive ? "text-[#e91e63]" : "text-slate-500 group-hover:text-slate-300"}`}
                />
                <span className="flex-1 truncate text-left">{item.label}</span>
                {isGroupActive && !isOpen && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e91e63] mr-0.5" />
                )}
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-slate-600 ${isOpen ? "rotate-180 text-slate-400" : ""}`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}
              >
                <div
                  className="mt-0.5 ml-3.5 pl-3 space-y-0.5 py-1"
                  style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {item.children.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      end={child.exact}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                          isActive
                            ? "text-[#e91e63] font-semibold"
                            : "text-slate-500 hover:text-slate-200"
                        }`
                      }
                      style={({ isActive }) => ({
                        background: isActive
                          ? "rgba(233,30,99,0.12)"
                          : "transparent",
                      })}
                    >
                      {({ isActive }) => (
                        <>
                          <child.icon
                            className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-[#e91e63]" : "text-slate-600"}`}
                          />
                          <span className="truncate">{child.label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── User Footer ── */}
      <UserFooter />
    </div>
  );
}

function UserFooter() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  return (
    <div
      className="shrink-0 p-3"
      style={{ borderTop: "1px solid var(--sidebar-border)" }}
    >
      <div
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-md"
          style={{ background: "linear-gradient(135deg, #e91e63, #f06292)" }}
        >
          {user?.name?.[0]?.toUpperCase() || "A"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">
            {user?.name || "Admin"}
          </p>
          <p
            className="truncate text-[10px]"
            style={{ color: "rgba(148,163,184,0.6)" }}
          >
            {user?.role || "Super Admin"}
          </p>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          title="লগ আউট"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors text-slate-500 hover:text-red-400"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function buildBreadcrumbs(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [{ label: ROUTE_LABELS[""] || "Home", to: "/" }];
  let path = "";
  parts.forEach((p) => {
    path += `/${p}`;
    const label = ROUTE_LABELS[p];
    if (label) crumbs.push({ label, to: path });
  });
  return crumbs;
}

function Topbar({ onMenuClick }) {
  const location = useLocation();
  const { user } = useAuthStore();
  const crumbs = buildBreadcrumbs(location.pathname);

  return (
    <header
      className="shrink-0 bg-white px-4 sm:px-6 py-3 flex items-center gap-4"
      style={{
        borderBottom: "1px solid #f1f5f9",
        boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
      }}
    >
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors md:hidden shrink-0"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
            )}
            <span
              className={`truncate text-sm ${i === crumbs.length - 1 ? "font-semibold text-[#0f172a]" : "text-slate-400 text-xs"}`}
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </div>

      {/* Right items */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search */}
        <div className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400 w-52 cursor-pointer hover:border-slate-300 transition-colors">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">Quick search...</span>
          <kbd className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-mono">
            ⌘K
          </kbd>
        </div>

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#e91e63] ring-2 ring-white animate-pulse" />
        </button>

        {/* Live status */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 px-3 py-2 text-xs text-emerald-700 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>

        {/* User avatar */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 cursor-default select-none">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #e91e63, #f06292)" }}
          >
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <span className="text-xs font-semibold text-[#0f172a]">
            {user?.name || "Admin"}
          </span>
        </div>
      </div>
    </header>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#f0f2f7" }}
    >
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        </div>
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 transition-transform duration-300 ease-in-out md:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
