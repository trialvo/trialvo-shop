"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useCallback, useMemo, useState } from "react";
import {
  ChevronRight,
  Home,
  Info,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Package,
  UserPlus,
  X,
} from "lucide-react";
import type {
  CategoryFlyoutModel,
  NavMainCategory,
} from "@/lib/adapters/navCategory";
import { RightArrowIcon } from "@/components/shared/RightArrowIcon";
import { useAuthContext } from "@/context/AuthContext";
import { toHeaderAccountViewModel } from "@/lib/adapters/authUser";
import { HeaderUserAvatar } from "@/components/layout/header/HeaderUserAvatar";
import { HeaderAccountSkeleton } from "@/components/layout/header/HeaderAccountSkeleton";

type HeaderMobileMenuProps = {
  open: boolean;
  onClose: () => void;
  categories: NavMainCategory[];
  flyout: CategoryFlyoutModel;
  isLoading?: boolean;
};

const HeaderMobileMenu = ({
  open,
  onClose,
  categories,
  flyout,
  isLoading = false,
}: HeaderMobileMenuProps) => {
  const router = useRouter();
  const [mobileTab, setMobileTab] = useState<"categories" | "navigation">(
    "categories",
  );
  const [expandedMainId, setExpandedMainId] = useState<string | null>(null);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const { isAuthenticated, isUserLoading, user, signOut, isSigningOut } =
    useAuthContext();

  const account = useMemo(
    () => (user ? toHeaderAccountViewModel(user) : null),
    [user],
  );

  const navigateTo = useCallback(
    (href: string) => {
      try {
        router.prefetch(href);
      } catch {
        /* ignore */
      }
      startTransition(() => {
        router.push(href);
        window.setTimeout(() => onClose(), 80);
      });
    },
    [router, onClose],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px] transition-opacity" onClick={onClose} />
      <div
        className="absolute left-0 top-0 bottom-0 w-[300px] bg-card flex flex-col shadow-product-hover animate-slide-in-right"
        style={{ animationName: "slideInLeft" }}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground">
          <Link
            href="/"
            className="font-heading text-lg font-bold"
            onClick={onClose}
          >
            ShopLink<span className="text-accent">BD</span>
          </Link>
          <span className="font-heading text-sm font-semibold opacity-90">
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="opacity-90 hover:opacity-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setMobileTab("categories")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              mobileTab === "categories"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground"
            }`}
          >
            <Menu className="h-4 w-4" /> Categories
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("navigation")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              mobileTab === "navigation"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground"
            }`}
          >
            <ChevronRight className="h-4 w-4" /> Navigation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {mobileTab === "categories" ? (
            <div>
              <div className="px-4 py-2.5 bg-primary/5 border-b border-border">
                <p className="text-[10px] uppercase tracking-wider text-primary font-bold">
                  {flyout.layout === "multi-main"
                    ? "Main → Sub → Child"
                    : "All categories"}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {flyout.railHeading}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigateTo("/shop")}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-secondary border-b border-border text-left"
              >
                <Menu className="h-4 w-4 text-primary" /> Browse all products
              </button>

              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3 border-b border-border"
                    >
                      <div className="h-7 w-7 rounded-sm bg-muted animate-pulse" />
                      <div className="h-3 flex-1 max-w-[140px] bg-muted animate-pulse rounded-sm" />
                    </div>
                  ))
                : categories.map((main) => {
                    const mainOpen = expandedMainId === main.id;
                    return (
                      <div key={main.id} className="border-b border-border">
                        {/* Main — same pattern as desktop rail */}
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => navigateTo(main.href)}
                            className="flex-1 flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-secondary min-w-0 text-left"
                          >
                            {main.image ? (
                              <img
                                src={main.image}
                                alt=""
                                className="w-7 h-7 rounded-sm object-cover bg-secondary border border-border shrink-0"
                                loading="lazy"
                              />
                            ) : (
                              <span className="h-7 w-7 rounded-sm bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0">
                                📦
                              </span>
                            )}
                            <span className="truncate">{main.name}</span>
                          </button>
                          {main.subs.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedMainId(mainOpen ? null : main.id);
                                setExpandedSubId(null);
                              }}
                              className="px-4 py-3 text-muted-foreground hover:text-primary"
                              aria-expanded={mainOpen}
                            >
                              <ChevronRight
                                className={`h-4 w-4 transition-transform duration-200 ${
                                  mainOpen ? "rotate-90" : ""
                                }`}
                              />
                            </button>
                          ) : null}
                        </div>

                        {/* Subs — same list pattern */}
                        {mainOpen
                          ? main.subs.map((sub) => {
                              const subOpen = expandedSubId === sub.id;
                              return (
                                <div
                                  key={sub.id}
                                  className="bg-secondary/40 border-t border-border/60"
                                >
                                  <div className="flex items-center">
                                    <button
                                      type="button"
                                      onClick={() => navigateTo(sub.href)}
                                      className="flex-1 flex items-center gap-2.5 px-5 py-2.5 text-sm text-left min-w-0 hover:bg-secondary"
                                    >
                                      {sub.image ? (
                                        <img
                                          src={sub.image}
                                          alt=""
                                          className="w-6 h-6 rounded-sm object-cover border border-border shrink-0"
                                          loading="lazy"
                                        />
                                      ) : (
                                        <span className="w-6 h-6 rounded-sm bg-card border border-border flex items-center justify-center text-[10px] shrink-0">
                                          📦
                                        </span>
                                      )}
                                      <span className="truncate text-foreground font-medium">
                                        {sub.name}
                                      </span>
                                    </button>
                                    {sub.children.length > 0 ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedSubId(
                                            subOpen ? null : sub.id,
                                          )
                                        }
                                        className="px-3 py-2.5 text-muted-foreground hover:text-primary"
                                        aria-expanded={subOpen}
                                      >
                                        <ChevronRight
                                          className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                            subOpen ? "rotate-90" : ""
                                          }`}
                                        />
                                      </button>
                                    ) : null}
                                  </div>

                                  {/* Children — Alibaba-like dense links */}
                                  {subOpen ? (
                                    <div className="bg-card/80 px-2 pb-2">
                                      <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Shop by type
                                      </p>
                                      <div className="grid grid-cols-1 gap-0.5">
                                        {sub.children.map((child) => (
                                          <button
                                            key={child.id}
                                            type="button"
                                            onClick={() =>
                                              navigateTo(child.href)
                                            }
                                            className="flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:text-primary hover:bg-secondary rounded-sm text-left"
                                          >
                                            {child.image ? (
                                              <img
                                                src={child.image}
                                                alt=""
                                                className="w-7 h-7 rounded-sm object-cover bg-muted border border-border shrink-0"
                                                loading="lazy"
                                              />
                                            ) : (
                                              <span className="w-7 h-7 rounded-sm flex items-center justify-center text-[10px] shrink-0 border border-border bg-card">
                                                📦
                                              </span>
                                            )}
                                            <span className="truncate font-medium">
                                              {child.name}
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => navigateTo(sub.href)}
                                        className="mx-3 mt-1 mb-1 inline-flex items-center gap-1 text-[11px] font-semibold text-primary"
                                      >
                                        View all in {sub.name}
                                        <RightArrowIcon className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })
                          : null}
                      </div>
                    );
                  })}
            </div>
          ) : (
            <div>
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-secondary border-b border-border"
              >
                <Home className="h-4 w-4 text-muted-foreground" /> Home
              </Link>
              <Link
                href="/about"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-secondary border-b border-border"
              >
                <Info className="h-4 w-4 text-muted-foreground" /> About
              </Link>
              <Link
                href="/contact"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-secondary border-b border-border"
              >
                <Mail className="h-4 w-4 text-muted-foreground" /> Contact
              </Link>
              <Link
                href="/order-tracking"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-secondary border-b border-border"
              >
                <Package className="h-4 w-4 text-muted-foreground" /> Track Order
              </Link>

              <div className="mt-4 px-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
                  ACCOUNT
                </p>
              </div>
              {(() => {
                if (isAuthenticated && isUserLoading) {
                  return (
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                      <HeaderAccountSkeleton />
                      <span className="text-sm text-muted-foreground">
                        Loading account…
                      </span>
                    </div>
                  );
                }

                if (isAuthenticated && account) {
                  return (
                    <>
                      <Link
                        href="/account"
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-secondary border-b border-border"
                      >
                        <HeaderUserAvatar account={account} />
                        <span className="min-w-0">
                          <span className="block truncate">
                            {account.displayName}
                          </span>
                          {account.email ? (
                            <span className="block text-[11px] font-normal text-muted-foreground truncate">
                              {account.email}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                      <button
                        type="button"
                        disabled={isSigningOut}
                        onClick={async () => {
                          try {
                            await signOut();
                          } finally {
                            onClose();
                          }
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-secondary border-b border-border text-left disabled:opacity-60"
                      >
                        <LogOut className="h-4 w-4 text-muted-foreground" />
                        {isSigningOut ? "Signing out…" : "Sign Out"}
                      </button>
                    </>
                  );
                }

                return (
                  <>
                    <Link
                      href="/account"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-secondary border-b border-border"
                    >
                      <LogIn className="h-4 w-4 text-muted-foreground" /> Sign
                      In
                    </Link>
                    <Link
                      href="/account"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-secondary border-b border-border"
                    >
                      <UserPlus className="h-4 w-4 text-muted-foreground" />{" "}
                      Register
                    </Link>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderMobileMenu;
