"use client";

import AccountMenu from "@/components/header/account-menu/AccountMenu";
import LangToggleButton from "@/components/header/LangToggleButton";
import NotificationBell from "@/components/header/NotificationBell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import AuthCookies from "@/lib/auth/cookies";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import Link from "next/link";
import React from "react";
import { CiHeart, CiSearch, CiUser } from "react-icons/ci";
import { FiX } from "react-icons/fi";
import { PiShoppingCartLight } from "react-icons/pi";

type HeaderActionProps = {
  cartCount?: number;
  isAuthenticated?: boolean;
  isAuthLoading?: boolean;

  onSearchClick?: () => void;
  onCartClick?: () => void;
  searchOpen?: boolean;

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
        <div className="flex w-41.5 items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-33.5 rounded-full" />
        </div>
      );
    }

    if (!effectiveAuthenticated) {
      return (
        <Link
          href="/sign-in"
          className={cn("flex items-center gap-2 text-sm font-medium text-[#6A6678] transition")}
        >
          <CiUser className="h-6 w-6 transition hover:text-foreground" />
          <span className="hidden text-sm font-normal sm:inline">{t("header.signIn")}</span>
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
    <div className="flex items-center gap-6 pr-2 sm:pr-0">
      <button
        aria-label={searchOpen ? "Close search" : "Search"}
        onClick={onSearchClick}
        className="cursor-pointer"
        type="button"
        data-search-toggle
      >
        {searchOpen ? (
          <FiX className="h-6 w-6 text-[#6A6678] transition hover:text-foreground" />
        ) : (
          <CiSearch className="h-6 w-6 text-[#6A6678] transition hover:text-foreground" />
        )}
      </button>

      {/* Desktop: full pill toggle + wishlist + account */}
      <div className="hidden min-[500px]:flex min-[500px]:items-center min-[500px]:gap-6">
        <LangToggleButton />
        {
          isAuthed && (
            <NotificationBell />
          )
        }
        {
          isAuthed && (
            <Link href="/account/favorites/" aria-label="Wishlist" type="button" className="cursor-pointer">
              <CiHeart className="h-6 w-6 text-[#6A6678] transition hover:text-foreground" />
            </Link>
          )
        }

        {accountSlot}
      </div>

      <button
        type="button"
        onClick={onCartClick}
        aria-label="Open cart"
        className="relative cursor-pointer"
      >
        <PiShoppingCartLight className="h-6 w-6 text-[#6A6678] transition hover:text-foreground" />

        {cartCount > 0 ? (
          <Badge
            variant="destructive"
            className="absolute -right-3.5 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs"
          >
            {cartCount}
          </Badge>
        ) : null}
      </button>
    </div>
  );
};

export default HeaderAction;
