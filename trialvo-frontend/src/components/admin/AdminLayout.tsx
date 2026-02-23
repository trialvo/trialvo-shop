import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  Star,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ShieldCheck,
  Tag,
  ExternalLink,
  ChevronRight,
  Calendar,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useUnreadCount } from '@/hooks/admin/useAdminMessages';

// Nav groups with section labels
const navGroups = [
  {
    label: 'Main',
    items: [
      { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Management',
    items: [
      { path: '/admin/products', label: 'Products', icon: Package },
      { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { path: '/admin/coupons', label: 'Coupons', icon: Tag },
    ],
  },
  {
    label: 'Communication',
    items: [
      { path: '/admin/messages', label: 'Messages', icon: MessageSquare, badge: true },
      { path: '/admin/testimonials', label: 'Testimonials', icon: Star },
    ],
  },
  {
    label: 'Account',
    items: [
      { path: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const allNavItems = navGroups.flatMap((g) => g.items);

const AdminLayout: React.FC = () => {
  const { adminProfile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: unreadCount } = useUnreadCount();

  // Lock body scroll when mobile sidebar is open
  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  // Get current nav item for breadcrumb
  const currentNavItem = allNavItems.find((item) => isActive(item.path, item.exact));
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg, hsl(var(--sidebar-background)) 0%, hsl(var(--sidebar-background) / 0.95) 100%)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border/50">
        <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center flex-shrink-0 shadow-soft-md">
          <ShieldCheck className="w-5 h-5 text-primary-foreground" />
        </div>
        {(sidebarOpen || isMobile) && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-sidebar-foreground text-sm whitespace-nowrap tracking-tight">Trialvo</h1>
            <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-[0.15em] font-semibold">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            {(sidebarOpen || isMobile) && (
              <div className="admin-nav-group">{group.label}</div>
            )}
            {!sidebarOpen && !isMobile && <div className="pt-4" />}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.path, item.exact);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group',
                      active
                        ? 'bg-sidebar-accent text-sidebar-foreground shadow-soft-sm'
                        : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                  >
                    {/* Active left accent */}
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary"
                        style={{ background: 'var(--gradient-accent)' }}
                      />
                    )}
                    <item.icon className={cn('w-[18px] h-[18px] flex-shrink-0 transition-colors', active ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80')} />
                    {(sidebarOpen || isMobile) && (
                      <span className="whitespace-nowrap flex-1">{item.label}</span>
                    )}
                    {/* Unread badge for Messages */}
                    {item.badge && unreadCount && unreadCount > 0 && (sidebarOpen || isMobile) && (
                      <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                    {item.badge && unreadCount && unreadCount > 0 && !sidebarOpen && !isMobile && (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-destructive ring-2 ring-sidebar" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-3 border-t border-sidebar-border/50 space-y-2">
        {/* Visit Store Link */}
        {(sidebarOpen || isMobile) && (
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Visit Store</span>
          </a>
        )}

        {/* User section */}
        {adminProfile && (
          <div className={cn(
            'flex items-center gap-3 rounded-xl bg-sidebar-accent/70 transition-all',
            sidebarOpen || isMobile ? 'px-3 py-2.5' : 'p-2 justify-center'
          )}>
            <Avatar className="w-8 h-8 border-2 border-primary/30 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {adminProfile.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {(sidebarOpen || isMobile) && (
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate leading-tight">{adminProfile.full_name}</p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate capitalize font-medium">{adminProfile.role.replace('_', ' ')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-sidebar-border/50 bg-sidebar transition-all duration-300 relative',
          sidebarOpen ? 'w-64' : 'w-[72px]'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden transition-opacity duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        <aside
          className={cn(
            'absolute left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border shadow-2xl transition-transform duration-300 ease-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <SidebarContent isMobile />
        </aside>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border/50 bg-background/95 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20"
          style={{ borderImage: 'linear-gradient(90deg, transparent, hsl(var(--border)), transparent) 1' }}
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-accent h-9 w-9"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex text-muted-foreground hover:text-foreground hover:bg-accent h-9 w-9"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground/60 font-medium">Admin</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
              <span className="text-foreground font-semibold">{currentNavItem?.label || 'Page'}</span>
            </div>
            <h2 className="sm:hidden text-base font-semibold text-foreground">
              {currentNavItem?.label || 'Admin'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Date display */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{currentDate}</span>
            </div>

            {/* Notifications bell */}
            <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={() => navigate('/admin/messages')}
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount && unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive ring-2 ring-background" />
              )}
            </Button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-accent h-9 px-2">
                  <Avatar className="w-7 h-7 border-2 border-primary/30">
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                      {adminProfile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium">{adminProfile?.full_name || 'Admin'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-border shadow-xl">
                <DropdownMenuItem asChild className="text-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer">
                  <Link to="/admin/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
