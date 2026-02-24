import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { User, ShoppingBag, Heart, Settings, LogOut, ChevronRight, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const navItems = [
  { label: 'Dashboard', path: '/account', icon: User, description: 'Overview & stats' },
  { label: 'My Orders', path: '/account/orders', icon: ShoppingBag, description: 'Order history' },
  { label: 'Wishlist', path: '/account/wishlist', icon: Heart, description: 'Saved items' },
  { label: 'Settings', path: '/account/settings', icon: Settings, description: 'Profile & security' },
];

const CustomerLayout: React.FC = () => {
  const { customer, logout } = useCustomerAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 md:pt-20">
        {/* Account Header Banner */}
        <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b border-border/40">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-2xl font-bold text-primary-foreground">{customer?.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                  <Shield className="w-2.5 h-2.5 text-white" />
                </div>
              </motion.div>
              {/* Info */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-xl md:text-2xl font-bold text-foreground">{customer?.name}</h1>
                <p className="text-sm text-muted-foreground">{customer?.email}</p>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-72 flex-shrink-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden sticky top-24 shadow-sm"
              >
                {/* Nav */}
                <nav className="p-3">
                  <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em] px-3 pt-1 pb-3">
                    Account Menu
                  </p>
                  <div className="space-y-1">
                    {navItems.map((item, i) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <motion.div
                          key={item.path}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.05 }}
                        >
                          <Link
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/15'
                              : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                              }`}
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isActive
                              ? 'bg-primary-foreground/15'
                              : 'bg-muted group-hover:bg-background'
                              }`}>
                              <item.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[13px]">{item.label}</p>
                              <p className={`text-[11px] ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}>
                                {item.description}
                              </p>
                            </div>
                            {isActive && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </nav>

                {/* Logout */}
                <div className="border-t border-border/50 p-3">
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all w-full group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-destructive/5 group-hover:bg-destructive/10 flex items-center justify-center flex-shrink-0 transition-colors">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span>Logout</span>
                  </button>
                </div>
              </motion.div>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CustomerLayout;
