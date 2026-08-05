import React from "react";
import {
  Package,
  Layers,
  Truck,
  Users,
  ShoppingCart,
  User,
  BarChart,
  Percent,
  Boxes,
  Tag,
  Map,
  CreditCard,
  FileText,
  Bell,
  Settings,
  Shield,
  Globe,
  Calendar,
  Wallet,
  Store,
} from "lucide-react";

export interface QuickAccessItem {
  id: number;
  name: string;
  icon: React.ReactNode;
  color: string;
  path: string;
  pinned: boolean;
}

export const quickAccessList: QuickAccessItem[] = [
  { id: 1, name: "Product", icon: <Package size={20} />, color: "bg-red-500", path: "/products", pinned: true },
  { id: 2, name: "Category", icon: <Layers size={20} />, color: "bg-green-500", path: "/categories", pinned: true },
  { id: 3, name: "Supplier", icon: <Truck size={20} />, color: "bg-orange-500", path: "/suppliers", pinned: true },
  { id: 4, name: "Customer", icon: <Users size={20} />, color: "bg-purple-500", path: "/customers", pinned: true },
  { id: 5, name: "Order", icon: <ShoppingCart size={20} />, color: "bg-blue-500", path: "/orders", pinned: true },
  { id: 6, name: "Account", icon: <User size={20} />, color: "bg-indigo-500", path: "/account", pinned: true },

  { id: 7, name: "Reports", icon: <BarChart size={20} />, color: "bg-cyan-500", path: "/reports", pinned: false },
  { id: 8, name: "Discounts", icon: <Percent size={20} />, color: "bg-pink-500", path: "/discounts", pinned: false },
  { id: 9, name: "Inventory", icon: <Boxes size={20} />, color: "bg-yellow-500", path: "/inventory", pinned: false },
  { id: 10, name: "Tags", icon: <Tag size={20} />, color: "bg-teal-500", path: "/tags", pinned: false },
  { id: 11, name: "Locations", icon: <Map size={20} />, color: "bg-lime-500", path: "/locations", pinned: false },
  { id: 12, name: "Payments", icon: <CreditCard size={20} />, color: "bg-sky-500", path: "/payments", pinned: false },
  { id: 13, name: "Invoices", icon: <FileText size={20} />, color: "bg-slate-500", path: "/invoices", pinned: false },
  { id: 14, name: "Notifications", icon: <Bell size={20} />, color: "bg-rose-500", path: "/notifications", pinned: false },
  { id: 15, name: "Settings", icon: <Settings size={20} />, color: "bg-gray-500", path: "/settings", pinned: false },
  { id: 16, name: "Roles", icon: <Shield size={20} />, color: "bg-emerald-500", path: "/roles", pinned: false },
  { id: 17, name: "Domains", icon: <Globe size={20} />, color: "bg-violet-500", path: "/domains", pinned: false },
  { id: 18, name: "Calendar", icon: <Calendar size={20} />, color: "bg-fuchsia-500", path: "/calendar", pinned: false },
  { id: 19, name: "Wallet", icon: <Wallet size={20} />, color: "bg-amber-500", path: "/wallet", pinned: false },
  { id: 20, name: "Store", icon: <Store size={20} />, color: "bg-stone-500", path: "/store", pinned: false },
];
