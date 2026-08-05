// src/layout/AppLayout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { useGlobalNotificationSync } from "@/hooks/useGlobalNotificationSync"; // V2-036

const LayoutContent: React.FC = () => {
  const { isExpanded, isMobileOpen } = useSidebar();

  // V2-036: auto-invalidate React Query caches when a push notification arrives.
  // This gives every admin page real-time data refresh (cross-tab safe).
  useGlobalNotificationSync();

  return (
    <div className="min-h-screen overflow-x-hidden xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>

      <div
        className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${
          isExpanded ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />

        {/* ✅ Responsive max width container (prevents outside scrolling) */}
         <div className="w-full px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4">
          <div className="mx-auto w-full max-w-full sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1440px]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
