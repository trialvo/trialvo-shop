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
 X,
 ChevronLeft,
 ShieldCheck,
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

const navItems = [
 { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
 { path: '/admin/products', label: 'Products', icon: Package },
 { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
 { path: '/admin/messages', label: 'Messages', icon: MessageSquare },
 { path: '/admin/testimonials', label: 'Testimonials', icon: Star },
 { path: '/admin/settings', label: 'Settings', icon: Settings },
];

const AdminLayout: React.FC = () => {
 const { adminProfile, signOut } = useAuth();
 const location = useLocation();
 const navigate = useNavigate();
 const [sidebarOpen, setSidebarOpen] = useState(true);
 const [mobileOpen, setMobileOpen] = useState(false);

 const handleLogout = async () => {
  await signOut();
  navigate('/admin/login');
 };

 const isActive = (path: string, exact = false) => {
  if (exact) return location.pathname === path;
  return location.pathname.startsWith(path);
 };

 const SidebarContent = () => (
  <div className="flex flex-col h-full">
   {/* Logo */}
   <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
     <ShieldCheck className="w-5 h-5 text-white" />
    </div>
    {sidebarOpen && (
     <div className="overflow-hidden">
      <h1 className="font-bold text-white text-sm whitespace-nowrap">eShop Market</h1>
      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Admin Panel</p>
     </div>
    )}
   </div>

   {/* Navigation */}
   <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
    {navItems.map((item) => {
     const active = isActive(item.path, item.exact);
     return (
      <Link
       key={item.path}
       to={item.path}
       onClick={() => setMobileOpen(false)}
       className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
        active
         ? 'bg-primary/15 text-primary'
         : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
       )}
      >
       <item.icon className={cn('w-5 h-5 flex-shrink-0', active && 'text-primary')} />
       {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
      </Link>
     );
    })}
   </nav>

   {/* User section */}
   {sidebarOpen && adminProfile && (
    <div className="px-3 py-4 border-t border-slate-700/50">
     <div className="flex items-center gap-3 px-3 py-2">
      <Avatar className="w-8 h-8">
       <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
        {adminProfile.full_name.charAt(0).toUpperCase()}
       </AvatarFallback>
      </Avatar>
      <div className="overflow-hidden">
       <p className="text-sm font-medium text-white truncate">{adminProfile.full_name}</p>
       <p className="text-[11px] text-slate-400 truncate">{adminProfile.role.replace('_', ' ')}</p>
      </div>
     </div>
    </div>
   )}
  </div>
 );

 return (
  <div className="min-h-screen bg-slate-900 flex">
   {/* Desktop Sidebar */}
   <aside
    className={cn(
     'hidden lg:flex flex-col border-r border-slate-700/50 bg-slate-800/50 backdrop-blur-sm transition-all duration-300',
     sidebarOpen ? 'w-64' : 'w-[72px]'
    )}
   >
    <SidebarContent />
   </aside>

   {/* Mobile Sidebar Overlay */}
   {mobileOpen && (
    <div className="fixed inset-0 z-50 lg:hidden">
     <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
     <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-800 border-r border-slate-700/50">
      <SidebarContent />
     </aside>
    </div>
   )}

   {/* Main Content */}
   <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
    {/* Top Bar */}
    <header className="h-16 border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6">
     <div className="flex items-center gap-3">
      {/* Mobile menu */}
      <Button
       variant="ghost"
       size="icon"
       className="lg:hidden text-slate-400 hover:text-white"
       onClick={() => setMobileOpen(true)}
      >
       <Menu className="w-5 h-5" />
      </Button>

      {/* Desktop collapse */}
      <Button
       variant="ghost"
       size="icon"
       className="hidden lg:flex text-slate-400 hover:text-white"
       onClick={() => setSidebarOpen(!sidebarOpen)}
      >
       {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      <h2 className="text-lg font-semibold text-white">
       {navItems.find((item) => isActive(item.path, item.exact))?.label || 'Admin'}
      </h2>
     </div>

     <div className="flex items-center gap-3">
      <DropdownMenu>
       <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 text-slate-300 hover:text-white">
         <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
           {adminProfile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
          </AvatarFallback>
         </Avatar>
         <span className="hidden md:inline text-sm">{adminProfile?.full_name || 'Admin'}</span>
        </Button>
       </DropdownMenuTrigger>
       <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700">
        <DropdownMenuItem asChild className="text-slate-300 hover:text-white focus:text-white focus:bg-slate-700">
         <Link to="/admin/settings">
          <Settings className="w-4 h-4 mr-2" />
          Settings
         </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-700" />
        <DropdownMenuItem
         onClick={handleLogout}
         className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-slate-700"
        >
         <LogOut className="w-4 h-4 mr-2" />
         Logout
        </DropdownMenuItem>
       </DropdownMenuContent>
      </DropdownMenu>
     </div>
    </header>

    {/* Page Content */}
    <main className="flex-1 overflow-y-auto p-4 lg:p-6">
     <Outlet />
    </main>
   </div>
  </div>
 );
};

export default AdminLayout;
