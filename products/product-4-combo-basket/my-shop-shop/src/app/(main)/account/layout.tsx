"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  ShoppingBag,
  MapPin,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
} from "lucide-react";

const navItems = [
  {
    href: "/account",
    label: "My Profile",
    icon: User,
    exact: true,
  },
  {
    href: "/account/orders",
    label: "My Orders",
    icon: ShoppingBag,
    badge: "3",
  },
  {
    href: "/account/address",
    label: "My Addresses",
    icon: MapPin,
  },
  {
    href: "/account/settings",
    label: "Settings",
    icon: Settings,
  },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="animate-fade-in-down mb-8">
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
            <Link href="/" className="transition-colors hover:text-[#e91e63]">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#e91e63]">My Account</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a]">My Account</h1>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Sidebar */}
          <aside className="w-full shrink-0 lg:w-72">
            {/* Profile Card */}
            <div className="shadow-card animate-fade-in-left mb-4 overflow-hidden rounded-2xl bg-white">
              <div className="relative h-20 bg-gradient-to-br from-[#e91e63] to-[#9c27b0]">
                <div className="absolute -bottom-8 left-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-[#e91e63] to-[#ff4081] shadow-lg">
                    <User className="h-7 w-7 text-white" />
                  </div>
                </div>
                {/* Notification Bell */}
                <button className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30">
                  <Bell className="h-4 w-4" />
                </button>
              </div>
              <div className="px-5 pt-10 pb-5">
                <h3 className="text-base font-semibold text-[#0f172a]">
                  Guest User
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  guest@myshop.com
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full bg-[#e91e63]/10 px-3 py-1 text-[10px] font-semibold tracking-wide text-[#e91e63] uppercase">
                    Premium Member
                  </span>
                </div>
              </div>
            </div>

            {/* Nav Menu */}
            <nav
              className="shadow-card animate-fade-in-left overflow-hidden rounded-2xl bg-white"
              style={{ animationDelay: "60ms" }}
            >
              <ul>
                {navItems.map((item, i) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <li
                      key={item.href}
                      className={
                        i !== navItems.length - 1
                          ? "border-b border-slate-50"
                          : ""
                      }
                    >
                      <Link
                        href={item.href}
                        className={`group flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all duration-200 ${
                          active
                            ? "bg-[#e91e63]/5 text-[#e91e63]"
                            : "text-slate-600 hover:bg-slate-50 hover:text-[#e91e63]"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 ${
                            active
                              ? "bg-[#e91e63]/10 text-[#e91e63]"
                              : "bg-slate-100 text-slate-400 group-hover:bg-[#e91e63]/10 group-hover:text-[#e91e63]"
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                        </span>
                        {item.label}
                        {item.badge && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e91e63] px-1.5 text-[10px] font-bold text-white">
                            {item.badge}
                          </span>
                        )}
                        {!item.badge && (
                          <ChevronRight
                            className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                              active
                                ? "text-[#e91e63]"
                                : "text-slate-300 group-hover:text-[#e91e63]"
                            }`}
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-slate-100 p-2">
                <button className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 transition-all duration-200 hover:bg-red-50 hover:text-red-500">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition-all duration-200 group-hover:bg-red-100 group-hover:text-red-500">
                    <LogOut className="h-4 w-4" />
                  </span>
                  Sign Out
                </button>
              </div>
            </nav>

            {/* Help Card */}
            <div
              className="shadow-card animate-fade-in-left mt-4 rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-5"
              style={{ animationDelay: "120ms" }}
            >
              <p className="mb-1 text-xs font-semibold tracking-wider text-white/80 uppercase">
                Need Help?
              </p>
              <p className="mb-3 text-xs text-slate-400">
                Our support team is ready 24/7.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#e91e63] px-4 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-[#d81b60]"
              >
                Contact Support
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </aside>

          {/* Main Content */}
          <main className="animate-fade-in-right min-w-0 flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
