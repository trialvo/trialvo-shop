"use client";

import ConfirmationModal from "@/components/shared/ConfirmationModal";
import { useLogout } from "@/hooks/useLogout";
import type { HeaderUser } from "@/lib/auth/user-display";
import { cn } from "@/lib/utils";
import { DROPDOWN_PANEL_CLASSES, DROPDOWN_ITEM_CLASSES, ICON_CONTAINER_CLASSES } from "@/lib/theme";
import { ChevronRight, Heart, LogIn, LogOut, Package, Settings, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface AccountDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  user: HeaderUser | null;
}

const authItems = [
  { icon: Package,  label: "My Orders", href: "/orders",   desc: "Track your purchases"  },
  { icon: Heart,    label: "Wishlist",  href: "/wishlist", desc: "Items you love"         },
  { icon: Settings, label: "Settings", href: "/settings", desc: "Profile & preferences"  },
] as const;

const AccountDropdown = ({
  isOpen,
  onClose,
  isAuthenticated,
  user,
}: AccountDropdownProps) => {
  const { logout: doLogout } = useLogout();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const panelRef   = useRef<HTMLDivElement>(null);

  /**
   * Close on outside CLICK (not mousedown).
   *
   * Using "click" means this fires AFTER the trigger button's onClick.
   * So if the trigger already toggled isOpen to false, calling onClose()
   * is a no-op (false → false). No jump, no double-flip.
   */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Slight delay so the opening click itself doesn't immediately close
    const id = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("click", handler);
    };
  }, [isOpen, onClose]);

  const fullName = user?.displayName ?? "";
  const initials = user?.initials ?? "?";

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.avatarUrl]);

  return (
    <>
      {/**
       * Keep the panel always in the DOM so CSS transitions run on both
       * open AND close. pointer-events-none when closed prevents stray clicks.
       */}
      <div
        ref={panelRef}
        className={cn(
          /* position */
          "absolute right-0 top-[calc(100%+10px)] w-[252px] z-50",
          /* chrome */
          DROPDOWN_PANEL_CLASSES,
          "shadow-[0_8px_32px_-4px_rgba(0,0,0,0.18),0_2px_8px_-2px_rgba(0,0,0,0.10)]",
          /* smooth scale+fade from top-right origin */
          "transition-[opacity,transform] duration-200 ease-out origin-top-right",
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        )}
        aria-hidden={!isOpen}
        inert={!isOpen}
        role="menu"
        aria-label="Account menu"
      >
        {/* ── Profile header ───────────────────────────────────────── */}
        <div className="px-4 pt-4 pb-3 border-b border-border/50">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className={cn(ICON_CONTAINER_CLASSES, "w-9 h-9 overflow-hidden border border-border")}>
                {user?.avatarUrl && !avatarFailed ? (
                  <img
                    src={user.avatarUrl}
                    alt={fullName || "avatar"}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-accent/12 text-accent flex items-center justify-center text-[12px] font-display font-bold tracking-wide">
                    {initials}
                  </div>
                )}
              </div>
              {/* Text */}
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground leading-tight truncate">{fullName}</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">{user?.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className={cn(ICON_CONTAINER_CLASSES, "w-9 h-9 bg-accent/10 border border-accent/20")}>
                <User size={16} className="text-accent" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground leading-tight">Welcome</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">Sign in for the best experience</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Nav items ────────────────────────────────────────────── */}
        {isAuthenticated ? (
          <div className="p-1.5 space-y-0.5">
            {authItems.map(({ icon: Icon, label, href, desc }) => (
              <Link
                key={label}
                href={href}
                onClick={onClose}
                role="menuitem"
                className={cn("group", DROPDOWN_ITEM_CLASSES)}
              >
                {/* Icon chip */}
                <span className="w-7 h-7 rounded-lg bg-secondary group-hover:bg-accent/10 flex items-center justify-center shrink-0 transition-colors">
                  <Icon
                    size={13}
                    strokeWidth={1.75}
                    className="text-muted-foreground group-hover:text-accent transition-colors"
                  />
                </span>
                {/* Label + description */}
                <span className="flex-1 min-w-0">
                  <span className="block text-[12.5px] font-medium text-foreground/85 group-hover:text-foreground transition-colors leading-tight">
                    {label}
                  </span>
                  <span className="block text-[10.5px] text-muted-foreground/60 leading-tight mt-0.5">{desc}</span>
                </span>
                {/* Hover arrow */}
                <ChevronRight
                  size={11}
                  className="shrink-0 text-muted-foreground/30 opacity-0 -translate-x-0.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150"
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-2.5 space-y-2">
            {/* Sign In — primary CTA */}
            <Link
              href="/auth"
              onClick={onClose}
              role="menuitem"
              className="flex items-center justify-center gap-2 h-9 w-full rounded-xl bg-accent text-accent-foreground text-[12px] font-semibold tracking-[0.08em] uppercase hover:bg-accent/90 transition-colors"
            >
              <LogIn size={14} strokeWidth={2} />
              Sign In
            </Link>
            {/* Create Account — secondary */}
            <Link
              href="/auth?mode=signup"
              onClick={onClose}
              role="menuitem"
              className="flex items-center justify-center gap-2 h-9 w-full rounded-xl border border-border text-foreground/80 text-[12px] font-medium tracking-[0.06em] uppercase hover:bg-secondary/80 hover:text-foreground transition-colors"
            >
              <UserPlus size={14} strokeWidth={1.75} />
              Create Account
            </Link>
            {/* Divider + Browse link */}
            <div className="pt-1 border-t border-border/40">
              <Link
                href="/shop"
                onClick={onClose}
                role="menuitem"
                className={cn("group", DROPDOWN_ITEM_CLASSES)}
              >
                <span className="w-7 h-7 rounded-lg bg-secondary group-hover:bg-accent/10 flex items-center justify-center shrink-0 transition-colors">
                  <Package size={13} strokeWidth={1.75} className="text-muted-foreground group-hover:text-accent transition-colors" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[12.5px] font-medium text-foreground/85 group-hover:text-foreground transition-colors leading-tight">
                    Browse Shop
                  </span>
                  <span className="block text-[10.5px] text-muted-foreground/60 leading-tight mt-0.5">Explore our collection</span>
                </span>
                <ChevronRight
                  size={11}
                  className="shrink-0 text-muted-foreground/30 opacity-0 -translate-x-0.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150"
                />
              </Link>
            </div>
          </div>
        )}

        {/* ── Sign out ─────────────────────────────────────────────── */}
        {isAuthenticated && (
          <div className="p-1.5 pt-1.25 border-t border-border/50 mt-0.5">
            <button
              type="button"
              onClick={() => { onClose(); setShowLogoutConfirm(true); }}
              role="menuitem"
              className={cn(DROPDOWN_ITEM_CLASSES, "w-full text-destructive hover:bg-destructive/8 group cursor-pointer")}
            >
              <span className="w-7 h-7 rounded-lg bg-destructive/8 group-hover:bg-destructive/14 flex items-center justify-center shrink-0 transition-colors">
                <LogOut size={13} strokeWidth={1.75} />
              </span>
              <span className="text-[12.5px] font-medium leading-tight">Sign Out</span>
            </button>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => { doLogout(); toast.success("Signed out"); }}
        title="Sign Out?"
        message="Are you sure you want to sign out of your account?"
        confirmLabel="Sign Out"
        variant="warning"
      />
    </>
  );
};

export default AccountDropdown;
