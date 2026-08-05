import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import HeaderSearch from "../components/header/HeaderSearch";
import BrandLogo from "../components/common/BrandLogo";
import LanguageToggle from "@/components/common/LanguageToggle";
import { cn } from "@/lib/utils";

/**
 * Header UI only. Sidebar toggle behavior matches the original header
 * (desktop expand / mobile open) — no sidebar visual changes.
 */
const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { t } = useTranslation();
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-99 w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Desktop / main bar */}
      <div className="flex min-h-[72px] items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5 lg:px-6">
        {/* Original sidebar toggle control (icons unchanged) */}
        <button
          type="button"
          onClick={handleToggle}
          aria-label="Toggle Sidebar"
          className={cn(
            "z-99999 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500",
            "transition-colors hover:bg-gray-50 hover:text-gray-700",
            "dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.04] dark:hover:text-gray-200",
          )}
        >
          {isMobileOpen ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          ) : (
            <svg
              width="16"
              height="12"
              viewBox="0 0 16 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>

        <Link to="/" className="shrink-0 lg:hidden" aria-label="Admin">
          <BrandLogo width={170} height={44} className="h-9 w-auto" />
        </Link>

        {/* Search — primary header focal point on desktop */}
        <div className="hidden min-w-0 flex-1 lg:block">
          <HeaderSearch />
        </div>

        {/* Mobile: open tools row */}
        <button
          type="button"
          onClick={() => setApplicationMenuOpen((v) => !v)}
          className={cn(
            "z-99999 ml-auto flex h-11 w-11 items-center justify-center rounded-lg text-gray-600",
            "hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden",
          )}
          aria-expanded={isApplicationMenuOpen}
          aria-label={t("header.applicationMenu")}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
              fill="currentColor"
            />
          </svg>
        </button>

        {/* Desktop actions */}
        <div className="ml-auto hidden items-center gap-2 lg:flex xl:gap-3">
          <LanguageToggle />
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/70 p-1 dark:border-gray-800 dark:bg-white/[0.03]">
            <ThemeToggleButton />
            <NotificationDropdown />
          </div>
          <UserDropdown />
        </div>
      </div>

      {/* Mobile tools panel */}
      <div
        className={cn(
          "border-t border-gray-200 bg-gray-50/80 px-3 py-3 dark:border-gray-800 dark:bg-gray-950/40 lg:hidden",
          isApplicationMenuOpen ? "block" : "hidden",
        )}
      >
        <div className="space-y-3">
          <HeaderSearch className="max-w-none" />
          <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggleButton />
              <NotificationDropdown />
            </div>
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
