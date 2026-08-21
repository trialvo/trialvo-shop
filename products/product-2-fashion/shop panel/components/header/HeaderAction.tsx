"use client";

import AccountMenu from "@/components/header/account-menu/AccountMenu";
import LangToggleButton from "@/components/header/LangToggleButton";
import NotificationBell from "@/components/header/NotificationBell";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import AuthCookies from "@/lib/auth/cookies";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import Link from "next/link";
import React from "react";
import { CiSearch } from "react-icons/ci";
import { FiHeart, FiShoppingBag, FiX } from "react-icons/fi";

/** Alibaba.com header typeface: Open Sans + their fallback stack */
const alibabaFont =
  "var(--font-open-sans), 'Helvetica Neue', Helvetica, Tahoma, Arial, sans-serif";

type HeaderActionProps = {
  cartCount?: number;
  isAuthenticated?: boolean;
  isAuthLoading?: boolean;

  onSearchClick?: () => void;
  onCartClick?: () => void;
  searchOpen?: boolean;
  showSearch?: boolean;

  avatarSrc?: string;
  onLogout?: () => void | Promise<void>;
  userName?: string | null;
  firstName?: string;
};

type CookieAuthState = "unknown" | "authed" | "guest";

/** Compact two-label toggle for mobile header */
const CompactLangToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const isBn = language === "bn";
  return (
    <button
      type="button"
      onClick={() => setLanguage(isBn ? "en" : "bn")}
      aria-label={isBn ? "Switch to English" : "বাংলায় দেখুন"}
      className="flex items-center h-7 px-2 gap-1 border border-border bg-muted text-[10px] font-semibold tracking-wide cursor-pointer select-none transition-colors hover:bg-black hover:text-white hover:border-black"
      style={{ borderRadius: 3 }}
    >
      <span style={{ color: isBn ? "#fff" : undefined, background: isBn ? "#111" : undefined, borderRadius: 2, padding: "1px 5px", transition: "all .15s" }}>বা</span>
      <span style={{ color: !isBn ? "#fff" : undefined, background: !isBn ? "#111" : undefined, borderRadius: 2, padding: "1px 5px", transition: "all .15s" }}>EN</span>
    </button>
  );
};

const HeaderAction: React.FC<HeaderActionProps> = ({
  cartCount = 0,
  isAuthenticated = false,
  isAuthLoading = false,
  avatarSrc,
  onSearchClick,
  onCartClick,
  searchOpen = false,
  showSearch = true,
  onLogout,
  userName = null,
  firstName,
}) => {

  const { isAuthenticated: isAuthed } = useAuth();
  const { t } = useTranslation();

  const [cookieAuth, setCookieAuth] = React.useState<CookieAuthState>("unknown");

  React.useEffect(() => {
    const authedByCookie = AuthCookies.isAuthenticated();
    setCookieAuth(authedByCookie ? "authed" : "guest");
  }, []);

  const hasUserData = typeof userName === "string" && userName.trim().length > 0;

  const effectiveAuthenticated =
    cookieAuth === "unknown" ? false : cookieAuth === "authed" ? true : isAuthenticated;

  const shouldShowAccountSkeleton =
    cookieAuth === "unknown" || isAuthLoading || (effectiveAuthenticated && !hasUserData);

  const accountSlot = (() => {
    if (shouldShowAccountSkeleton) {
      return (
        <Skeleton className="h-4 w-32 rounded" />
      );
    }

    if (!effectiveAuthenticated) {
      return (
        <Link
          href="/sign-in"
          className={cn("whitespace-nowrap text-[13px] font-normal text-foreground transition hover:opacity-70 min-[992px]:text-sm")}
          style={{ fontFamily: alibabaFont }}
        >
          {t("header.signIn")}
        </Link>
      );
    }

    return (
      <AccountMenu
        userName={userName ?? undefined}
        firstName={firstName}
        avatarSrc={avatarSrc ?? undefined}
        onLogout={async () => {
          await onLogout?.();
        }}
      />
    );
  })();

  return (
    <div className="flex items-center gap-3 pr-2 min-[576px]:gap-4 min-[768px]:gap-5 min-[768px]:pr-0 min-[992px]:gap-5 min-[1200px]:gap-6">
      {showSearch ? (
        <button
          aria-label={searchOpen ? "Close search" : "Search"}
          onClick={onSearchClick}
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-[#6A6678] transition-colors duration-200 hover:bg-black/[0.06] hover:text-foreground min-[992px]:h-10 min-[992px]:w-10"
          type="button"
          data-search-toggle
        >
          {searchOpen ? (
            <FiX className="h-5 w-5 min-[992px]:h-6 min-[992px]:w-6" />
          ) : (
            <CiSearch className="h-5 w-5 min-[992px]:h-6 min-[992px]:w-6" />
          )}
        </button>
      ) : null}

      {showSearch ? (
        <div className="hidden min-[768px]:flex min-[768px]:items-center min-[768px]:gap-4 min-[992px]:gap-5 min-[1200px]:gap-6">
          <LangToggleButton />
          {isAuthed ? <NotificationBell /> : null}
        </div>
      ) : null}

      <div
        className="flex items-center gap-4 min-[992px]:gap-5 min-[1200px]:gap-6"
        style={{ fontFamily: alibabaFont }}
      >
        <div className="hidden min-[768px]:flex min-[768px]:items-center">
          {accountSlot}
        </div>

        <Link
          href="/account/favorites/"
          aria-label="Wishlist"
          className="hidden min-[768px]:grid min-[768px]:h-8 min-[768px]:w-8 min-[768px]:place-items-center min-[768px]:text-[#E8A090] min-[768px]:transition-opacity min-[768px]:hover:opacity-70"
        >
          <FiHeart className="h-5 w-5 fill-current min-[992px]:h-[22px] min-[992px]:w-[22px]" />
        </Link>

        <button
          type="button"
          onClick={onCartClick}
          aria-label="Open cart"
          className="inline-flex cursor-pointer items-center gap-1.5 text-foreground transition-opacity hover:opacity-70"
        >
          <FiShoppingBag className="h-5 w-5 min-[992px]:h-[22px] min-[992px]:w-[22px]" />
          <span className="text-[13px] font-normal min-[992px]:text-sm">{cartCount}</span>
        </button>
      </div>
    </div>
  );
};

export default HeaderAction;
