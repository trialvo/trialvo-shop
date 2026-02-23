import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, MessageSquare, Star, TrendingUp, Clock, DollarSign, ArrowUpRight, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminProducts } from '@/hooks/admin/useAdminProducts';
import { useAdminOrders, useOrderStats } from '@/hooks/admin/useAdminOrders';
import { useUnreadCount } from '@/hooks/admin/useAdminMessages';
import { useAdminTestimonials } from '@/hooks/admin/useAdminTestimonials';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

const StatCard: React.FC<{
 title: string;
 value: string | number;
 icon: React.ElementType;
 trend?: string;
 color: string;
 link: string;
 delay?: number;
}> = ({ title, value, icon: Icon, trend, color, link, delay = 0 }) => (
 <Link to={link}>
  <div className="admin-stat group cursor-pointer" style={{ animationDelay: `${delay}ms` }}>
   <CardContent className="p-5">
    <div className="flex items-start justify-between">
     <div className="flex-1">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">{title}</p>
      <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{value}</p>
      {trend && (
       <div className="flex items-center gap-1 mt-2">
        <TrendingUp className="w-3 h-3 text-success" />
        <span className="text-xs text-success font-medium">{trend}</span>
       </div>
      )}
     </div>
     <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-soft-sm ${color}`}>
      <Icon className="w-5 h-5 text-white" />
     </div>
    </div>
    <div className="flex items-center gap-1 mt-3 text-muted-foreground text-[11px] group-hover:text-primary transition-colors font-medium">
     <span>View details</span>
     <ArrowUpRight className="w-3 h-3" />
    </div>
   </CardContent>
  </div>
 </Link>
);

const DashboardPage: React.FC = () => {
 const { data: products, isLoading: productsLoading } = useAdminProducts();
 const { data: orders, isLoading: ordersLoading } = useAdminOrders();
 const { data: stats, isLoading: statsLoading } = useOrderStats();
 const { data: unreadCount, isLoading: unreadLoading } = useUnreadCount();
 const { data: testimonials, isLoading: testimonialsLoading } = useAdminTestimonials();
 const { adminProfile } = useAuth();

 const isLoading = productsLoading || ordersLoading || statsLoading || unreadLoading || testimonialsLoading;

 const statusBadgeClass: Record<string, string> = {
  pending: 'admin-badge admin-badge-pending',
  confirmed: 'admin-badge admin-badge-confirmed',
  completed: 'admin-badge admin-badge-completed',
  cancelled: 'admin-badge admin-badge-cancelled',
 };

 const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
 };

 return (
  <div className="space-y-6 animate-fade-in">
   {/* Welcome Banner */}
   <div className="admin-welcome">
    <div className="relative z-10">
     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
       <h1 className="text-xl sm:text-2xl font-bold text-white/95">
        {greeting()}, {adminProfile?.full_name?.split(' ')[0] || 'Admin'} 👋
       </h1>
       <p className="text-sm text-white/60 mt-1">Here's what's happening with your store today.</p>
      </div>
      <div className="flex items-center gap-2">
       <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
        <Activity className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs text-white/80 font-medium">System Online</span>
       </div>
      </div>
     </div>
    </div>
    {/* Decorative circles */}
    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
    <div className="absolute -bottom-14 -left-14 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
   </div>

   {/* Stats Grid */}
   <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
    {isLoading ? (
     Array.from({ length: 4 }).map((_, i) => (
      <Card key={i} className="bg-card border-border">
       <CardContent className="p-5">
        <Skeleton className="h-3 w-20 mb-3 bg-muted" />
        <Skeleton className="h-7 w-16 bg-muted" />
       </CardContent>
      </Card>
     ))
    ) : (
     <>
      <StatCard
       title="Total Products"
       value={products?.length || 0}
       icon={Package}
       color="bg-gradient-to-br from-violet-500 to-purple-600"
       link="/admin/products"
       delay={0}
      />
      <StatCard
       title="Total Orders"
       value={stats?.total || 0}
       icon={ShoppingCart}
       trend={`${stats?.pending || 0} pending`}
       color="bg-gradient-to-br from-blue-500 to-cyan-600"
       link="/admin/orders"
       delay={50}
      />
      <StatCard
       title="Unread Messages"
       value={unreadCount || 0}
       icon={MessageSquare}
       color="bg-gradient-to-br from-amber-500 to-orange-600"
       link="/admin/messages"
       delay={100}
      />
      <StatCard
       title="Revenue"
       value={`৳${(stats?.revenue || 0).toLocaleString()}`}
       icon={DollarSign}
       trend={`${stats?.completed || 0} completed`}
       color="bg-gradient-to-br from-emerald-500 to-green-600"
       link="/admin/orders"
       delay={150}
      />
     </>
    )}
   </div>

   {/* Recent Orders */}
   <div className="admin-card">
    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
     <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
       <Clock className="w-4 h-4 text-blue-500" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">Recent Orders</h3>
     </div>
     <Link
      to="/admin/orders"
      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors font-medium"
     >
      View all <ArrowUpRight className="w-3 h-3" />
     </Link>
    </div>
    <div>
     {ordersLoading ? (
      <div className="p-5 space-y-3">
       {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 bg-muted" />
       ))}
      </div>
     ) : orders && orders.length > 0 ? (
      <div className="overflow-x-auto">
       <table className="w-full">
        <thead>
         <tr className="admin-table-header">
          <th>Order ID</th>
          <th>Customer</th>
          <th className="hidden sm:table-cell">Amount</th>
          <th>Status</th>
          <th className="hidden md:table-cell">Date</th>
         </tr>
        </thead>
        <tbody>
         {orders.slice(0, 5).map((order) => (
          <tr key={order.id} className="admin-table-row">
           <td>
            <span className="font-mono text-sm font-medium text-foreground">{order.order_id}</span>
           </td>
           <td>
            <div className="flex items-center gap-2.5">
             <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-primary">{order.customer_name.charAt(0).toUpperCase()}</span>
             </div>
             <span className="text-sm text-foreground/80 font-medium">{order.customer_name}</span>
            </div>
           </td>
           <td className="hidden sm:table-cell">
            <span className="text-sm font-bold text-foreground">৳{order.total_bdt.toLocaleString()}</span>
           </td>
           <td>
            <span className={statusBadgeClass[order.status] || 'admin-badge'}>
             <span className="w-1.5 h-1.5 rounded-full bg-current" />
             {order.status}
            </span>
           </td>
           <td className="hidden md:table-cell">
            <span className="text-xs text-muted-foreground">
             {new Date(order.created_at).toLocaleDateString()}
            </span>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     ) : (
      <div className="admin-empty">
       <ShoppingCart />
       <p>No orders yet</p>
      </div>
     )}
    </div>
   </div>

   {/* Quick Stats Row */}
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Testimonials Summary */}
    <div className="admin-card">
     <div className="flex items-center justify-between px-5 py-4 border-b border-border">
      <div className="flex items-center gap-2.5">
       <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
        <Star className="w-4 h-4 text-amber-500" />
       </div>
       <h3 className="text-sm font-semibold text-foreground">Testimonials</h3>
      </div>
      <Link
       to="/admin/testimonials"
       className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors font-medium"
      >
       Manage <ArrowUpRight className="w-3 h-3" />
      </Link>
     </div>
     <div className="p-5">
      <div className="flex items-center gap-8">
       <div>
        <p className="text-3xl font-bold text-foreground">{testimonials?.length || 0}</p>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">Total reviews</p>
       </div>
       <div className="h-10 w-px bg-border" />
       <div>
        <p className="text-3xl font-bold text-success">
         {testimonials?.filter((t) => t.is_active).length || 0}
        </p>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">Active</p>
       </div>
       {/* Progress bar */}
       <div className="flex-1 hidden sm:block">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1 font-medium">
         <span>Active ratio</span>
         <span>{testimonials?.length ? Math.round((testimonials.filter(t => t.is_active).length / testimonials.length) * 100) : 0}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
         <div
          className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-500"
          style={{ width: `${testimonials?.length ? (testimonials.filter(t => t.is_active).length / testimonials.length) * 100 : 0}%` }}
         />
        </div>
       </div>
      </div>
     </div>
    </div>

    {/* Products Summary */}
    <div className="admin-card">
     <div className="flex items-center justify-between px-5 py-4 border-b border-border">
      <div className="flex items-center gap-2.5">
       <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
        <Package className="w-4 h-4 text-violet-500" />
       </div>
       <h3 className="text-sm font-semibold text-foreground">Products</h3>
      </div>
      <Link
       to="/admin/products"
       className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors font-medium"
      >
       Manage <ArrowUpRight className="w-3 h-3" />
      </Link>
     </div>
     <div className="p-5">
      <div className="flex items-center gap-8">
       <div>
        <p className="text-3xl font-bold text-foreground">{products?.length || 0}</p>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">Total products</p>
       </div>
       <div className="h-10 w-px bg-border" />
       <div>
        <p className="text-3xl font-bold text-accent">
         {products?.filter((p) => p.isFeatured).length || 0}
        </p>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">Featured</p>
       </div>
       {/* Progress bar */}
       <div className="flex-1 hidden sm:block">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1 font-medium">
         <span>Featured ratio</span>
         <span>{products?.length ? Math.round((products.filter(p => p.isFeatured).length / products.length) * 100) : 0}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
         <div
          className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-500"
          style={{ width: `${products?.length ? (products.filter(p => p.isFeatured).length / products.length) * 100 : 0}%` }}
         />
        </div>
       </div>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
};

export default DashboardPage;
