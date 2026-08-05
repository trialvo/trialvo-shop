"use client";

import Link from "next/link";
import { Search, ShoppingBag, Heart, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconBadge } from "@/components/layout/IconBadge";
import AccountDropdown from "@/components/layout/AccountDropdown";
import { HeaderAccountAvatar } from "@/components/layout/HeaderAccountAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { HeaderUser } from "@/lib/auth/user-display";

interface HeaderActionsProps {
  /* counts */
  totalItems: number;
  wishlistCount: number;
  /* auth state */
  isAuthenticated: boolean;
  isAuthPending: boolean;
  user: HeaderUser | null;
  /* open/close callbacks */
  accountOpen: boolean;
  onAccountToggle: () => void;
  onAccountClose: () => void;
  onSearchOpen: () => void;
  onCartOpen: () => void;
}

type HeaderResolvedAuthActionsProps = Pick<
  HeaderActionsProps,
  | "accountOpen"
  | "isAuthenticated"
  | "onAccountClose"
  | "onAccountToggle"
  | "user"
  | "wishlistCount"
>;

/** Right-side icon cluster: search · wishlist · account · cart · sign-in CTA */
export function HeaderActions({
  totalItems,
  wishlistCount,
  isAuthenticated,
  isAuthPending,
  user,
  accountOpen,
  onAccountToggle,
  onAccountClose,
  onSearchOpen,
  onCartOpen,
}: HeaderActionsProps) {
  return (
    <div
      className="flex items-center gap-1 sm:gap-2 ml-auto lg:ml-0"
      aria-busy={isAuthPending}
    >

      {/* Search — hidden below md (BottomNav owns it) */}
      <button
        type="button"
        onClick={onSearchOpen}
        className="hidden md:flex lg:hidden w-9 h-9 items-center justify-center cursor-pointer text-header-muted hover:text-header-foreground transition-colors rounded-full hover:bg-header-border/40"
        aria-label="Search"
      >
        <Search size={19} strokeWidth={1.5} />
      </button>

      {isAuthPending ? (
        <HeaderAuthActionSkeleton />
      ) : (
        <HeaderResolvedAuthActions
          accountOpen={accountOpen}
          isAuthenticated={isAuthenticated}
          onAccountClose={onAccountClose}
          onAccountToggle={onAccountToggle}
          user={user}
          wishlistCount={wishlistCount}
        />
      )}

      {/* Cart — hidden below md (BottomNav owns it) */}
      <button
        type="button"
        onClick={onCartOpen}
        className="relative hidden md:flex items-center gap-1.5 h-9 px-2 rounded-full cursor-pointer text-header-muted hover:text-header-foreground hover:bg-header-border/40 transition-colors"
        aria-label="Cart"
      >
        <ShoppingBag size={19} strokeWidth={1.5} />
        <IconBadge count={totalItems} />
        {totalItems > 0 && (
          <span className="hidden xl:block text-xs tracking-wide font-medium text-header-foreground">
            ({totalItems})
          </span>
        )}
      </button>
    </div>
  );
}

function HeaderResolvedAuthActions({
  accountOpen,
  isAuthenticated,
  onAccountClose,
  onAccountToggle,
  user,
  wishlistCount,
}: Readonly<HeaderResolvedAuthActionsProps>) {
  return (
    <>
      {/* Wishlist — hidden below md (BottomNav owns it) */}
      <Link
        href={isAuthenticated ? "/wishlist" : "/auth"}
        className="relative hidden md:flex lg:flex w-9 h-9 items-center justify-center text-header-muted hover:text-header-foreground transition-colors rounded-full hover:bg-header-border/40"
        aria-label="Wishlist"
      >
        <Heart size={19} strokeWidth={1.5} />
        {isAuthenticated && <IconBadge count={wishlistCount} />}
      </Link>

      {/* Account — always visible sm+ */}
      <div className="relative block">
        <button
          type="button"
          onClick={onAccountToggle}
          className={cn(
            "flex items-center gap-1.5 h-9 px-2 rounded-full cursor-pointer transition-colors",
            "text-header-muted hover:text-header-foreground hover:bg-header-border/40",
            accountOpen && "text-header-foreground bg-header-border/40"
          )}
          aria-label="Account"
          aria-expanded={accountOpen}
          aria-haspopup="menu"
        >
          <HeaderAccountAvatar
            isAuthenticated={isAuthenticated}
            avatarUrl={user?.avatarUrl}
            name={user?.displayName}
          />
          <span className="block text-xs tracking-wide max-w-[80px] truncate">
            {isAuthenticated ? user?.firstName ?? "Account" : "Sign In"}
          </span>
          <ChevronDown
            size={12}
            className={cn("block opacity-50 transition-transform duration-200", accountOpen && "rotate-180")}
          />
        </button>
        <AccountDropdown
          isOpen={accountOpen}
          onClose={onAccountClose}
          isAuthenticated={isAuthenticated}
          user={user}
        />
      </div>
    </>
  );
}

function HeaderAuthActionSkeleton() {
  return (
    <>
      <div
        aria-hidden="true"
        className="relative hidden md:flex lg:flex w-9 h-9 items-center justify-center rounded-full"
      >
        <Skeleton className="w-5 h-5 rounded-full bg-header-border/60" />
      </div>

      <div
        aria-hidden="true"
        className="flex items-center gap-1.5 h-9 px-2 rounded-full"
      >
        <Skeleton className="w-6 h-6 rounded-full bg-header-border/60" />
        <Skeleton className="h-3 w-12 rounded-full bg-header-border/60" />
        <Skeleton className="h-3 w-3 rounded-full bg-header-border/60" />
      </div>
    </>
  );
}
