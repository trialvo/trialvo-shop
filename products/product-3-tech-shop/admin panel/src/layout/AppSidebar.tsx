import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Package,
  BarChart3,
  Users,
  Star,
  Shield,
  Settings,
  PanelsTopLeft,
  UserCircle,
  ChevronDownIcon,
  Flame,
  Bell,
  FileText,
  Tag,
  Truck,
  History,
  ScrollText,
  Megaphone,
  Mail,
  MessageCircle,
  ClipboardCheck,
} from "lucide-react";

import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthProvider";
import { HorizontaLDots } from "../icons";
import BrandLogo from "../components/common/BrandLogo";

type NavItem = {
  nameKey: string;
  icon: React.ReactNode;
  path?: string;
  superAdminOnly?: boolean;
  subItems?: {
    nameKey: string;
    path: string;
    pro?: boolean;
    new?: boolean;
    superAdminOnly?: boolean;
  }[];
};

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard />,
    nameKey: "dashboard",
    path: "/dashboard",
  },
  {
    icon: <ShoppingCart />,
    nameKey: "newSale",
    path: "/new-sale",
  },
  {
    icon: <ClipboardList />,
    nameKey: "orders",
    subItems: [
      { nameKey: "allOrders", path: "/all-orders", pro: false },
      { nameKey: "editOrder", path: "/order-editor", pro: false },
      { nameKey: "guestOrders", path: "/guest-orders", pro: false },
      { nameKey: "orderDistribution", path: "/order-distribution", pro: false },
    ],
  },
  {
    nameKey: "products",
    icon: <Package />,
    subItems: [
      { nameKey: "allProducts", path: "/all-products", pro: false },
      { nameKey: "createProduct", path: "/create-product", pro: false },
      { nameKey: "productCategory", path: "/product-category", pro: false },
      { nameKey: "productAttributes", path: "/product-attributes", pro: false },
      { nameKey: "discountRules", path: "/discount-rules", pro: false },
      { nameKey: "productReviews", path: "/product-reviews", pro: false, new: true },
    ],
  },
  {
    nameKey: "report",
    icon: <BarChart3 />,
    subItems: [
      { nameKey: "productReports", path: "/product-reports", pro: false },
      { nameKey: "orderReport", path: "/order-reports", pro: false },
      { nameKey: "stockReports", path: "/stock-reports", pro: false },
      { nameKey: "visitorReport", path: "/visitor-report", pro: false },
    ],
  },
  {
    nameKey: "customer",
    icon: <Users />,
    subItems: [
      { nameKey: "customersList", path: "/customers-list", pro: false },
      { nameKey: "createCustomer", path: "/create-customer", pro: false },
      // { nameKey: "Blocked Customer", path: "/blocked-customer", pro: false },
    ],
  },
  // {
  //   icon: <Star />,
  //   nameKey: "Customer review",
  //   path: "/customer-review",
  // },
];

const othersItems: NavItem[] = [
  {
    icon: <Shield />,
    nameKey: "adminPermission",
    subItems: [
      { nameKey: "adminsList", path: "/admins-list", pro: false },
      { nameKey: "createAdmin", path: "/create-admin", pro: false },
      { nameKey: "permissions", path: "/permissions", pro: false },
    ],
  },
  {
    icon: <Settings />,
    nameKey: "businessSetting",
    subItems: [
      { nameKey: "payment", path: "/payment-settings", pro: false, superAdminOnly: true },
      { nameKey: "delivery", path: "/delivery-settings", pro: false },
      { nameKey: "currier", path: "/currier-settings", pro: false, superAdminOnly: true },
      { nameKey: "couponCode", path: "/coupon-code", pro: false },
      { nameKey: "serviceSettings", path: "/service-settings", pro: false, superAdminOnly: true },
      { nameKey: "analyticsSettings", path: "/analytics-settings", pro: false },
      { nameKey: "firebaseCredential", path: "/firebase-credential", pro: false, superAdminOnly: true },
      { nameKey: "notificationHistory", path: "/notification-history", pro: false },
    ],
  },
  {
    icon: <PanelsTopLeft />,
    nameKey: "websiteSettings",
    subItems: [
      { nameKey: "banners", path: "/banners-settings", pro: false },
      { nameKey: "bannerVideo", path: "/banner-video-settings", pro: false },
      { nameKey: "policies", path: "/policies", pro: false },
      { nameKey: "subscribers", path: "/subscribers", pro: false },
    ],
  },
  {
    icon: <Megaphone />,
    nameKey: "announcements",
    subItems: [
      { nameKey: "allAnnouncements", path: "/announcements", pro: false },
      { nameKey: "createAnnouncement", path: "/create-announcement", pro: false },
    ],
  },
  {
    icon: <MessageCircle />,
    nameKey: "supportMessages",
    subItems: [
      { nameKey: "contactMessages", path: "/contact-messages", pro: false },
      { nameKey: "supportReports",  path: "/support-reports",  pro: false, new: true },
    ],
  },
  {
    icon: <ClipboardCheck />,
    nameKey: "auditLogs",
    subItems: [
      { nameKey: "adminAuditLogs", path: "/admin-audit-logs", pro: false },
      { nameKey: "userAuditLogs",  path: "/user-audit-logs",  pro: false },
    ],
  },
  {
    icon: <UserCircle />,
    nameKey: "myProfile",
    path: "/my-profile",
  },
];

const AppSidebar: React.FC = () => {
  const { t } = useTranslation();
  const { hasAnyRole } = useAuth();
  const isSuperAdmin = hasAnyRole(["SUPER_ADMIN"]);
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    toggleMobileSidebar,
  } = useSidebar();
  const location = useLocation();
  const previousBodyOverflow = useRef("");

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {},
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname],
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  useEffect(() => {
    if (!isMobileOpen) {
      document.body.style.overflow = previousBodyOverflow.current || "";
      return;
    }

    previousBodyOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow.current || "";
    };
  }, [isMobileOpen]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const handleMobileItemClick = useCallback(() => {
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
  }, [isMobileOpen, toggleMobileSidebar]);

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => {
    // Filter out superAdminOnly items for non-super-admins
    const filtered = items.map(nav => {
      if (nav.superAdminOnly && !isSuperAdmin) return null;
      if (nav.subItems) {
        const filteredSubs = nav.subItems.filter(sub => !sub.superAdminOnly || isSuperAdmin);
        if (filteredSubs.length === 0 && !nav.path) return null;
        return { ...nav, subItems: filteredSubs };
      }
      return nav;
    }).filter(Boolean) as NavItem[];

    return (
    <ul className="flex flex-col gap-4">
      {filtered.map((nav, index) => (
        <li key={nav.nameKey}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={`menu-item-icon-size  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{t(`sidebar.${nav.nameKey}`)}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                onClick={handleMobileItemClick}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{t(`sidebar.${nav.nameKey}`)}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.nameKey}>
                    <Link
                      to={subItem.path}
                      onClick={handleMobileItemClick}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {t(`sidebar.${subItem.nameKey}`)}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            {t("sidebar.badgeNew")}
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            {t("sidebar.badgePro")}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
    );
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen overflow-hidden transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
    >
      <div className="flex justify-start py-8">
        <Link to="/" className="inline-flex items-center">
          {isExpanded || isHovered || isMobileOpen ? (
            <BrandLogo width={150} height={40} className="h-10 w-auto" />
          ) : (
            <BrandLogo
              variant="icon"
              width={32}
              height={32}
              className="h-8 w-8"
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-26">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  t("sidebar.menu")
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  t("sidebar.others")
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
