"use client";

import { User, Bell, Shield, MapPin, LogOut, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { User as UserType } from "@/types";

export type SettingsTab = "profile" | "security" | "addresses" | "notifications" | "orders";

const tabs: { id: SettingsTab; label: string; icon: LucideIcon }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "orders", label: "My Orders", icon: Package },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];


interface SettingsSidebarProps {
  user: UserType;
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  onLogout: () => void;
}

export function SettingsSidebar({ user, activeTab, onTabChange, onLogout }: SettingsSidebarProps) {
  return (
    <div className="lg:w-64 flex-shrink-0">
      {/* User card */}
      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-border shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-display font-semibold">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 text-[10px] lg:text-xs tracking-[0.1em] uppercase transition-colors whitespace-nowrap rounded lg:rounded-none lg:w-full ${
              activeTab === tab.id
                ? "bg-secondary text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <tab.icon size={15} className="shrink-0" />
            {tab.label}
          </button>
        ))}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 text-[10px] lg:text-xs tracking-[0.1em] uppercase text-destructive hover:bg-destructive/10 transition-colors whitespace-nowrap lg:w-full"
        >
          <LogOut size={15} className="shrink-0" /> Sign Out
        </button>
      </nav>
    </div>
  );
}
