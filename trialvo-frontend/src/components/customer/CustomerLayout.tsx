import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { User, ShoppingBag, Heart, Settings, LogOut, ChevronRight } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const navItems = [
  { label: 'Dashboard', path: '/account', icon: User },
  { label: 'Orders', path: '/account/orders', icon: ShoppingBag },
  { label: 'Wishlist', path: '/account/wishlist', icon: Heart },
  { label: 'Settings', path: '/account/settings', icon: Settings },
];

const CustomerLayout: React.FC = () => {
  const { customer, logout } = useCustomerAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 pt-24 md:pt-28">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft-sm">
              {/* User info */}
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{customer?.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{customer?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{customer?.email}</p>
                </div>
              </div>

              {/* Nav */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                    </Link>
                  );
                })}
                <button
                  onClick={logout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CustomerLayout;
