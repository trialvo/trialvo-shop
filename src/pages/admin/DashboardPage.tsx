import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, MessageSquare, Star, TrendingUp, Clock, DollarSign, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminProducts } from '@/hooks/admin/useAdminProducts';
import { useAdminOrders, useOrderStats } from '@/hooks/admin/useAdminOrders';
import { useUnreadCount } from '@/hooks/admin/useAdminMessages';
import { useAdminTestimonials } from '@/hooks/admin/useAdminTestimonials';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard: React.FC<{
 title: string;
 value: string | number;
 icon: React.ElementType;
 trend?: string;
 color: string;
 link: string;
}> = ({ title, value, icon: Icon, trend, color, link }) => (
 <Link to={link}>
  <Card className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-all hover:-translate-y-0.5 hover:shadow-lg group cursor-pointer">
   <CardContent className="p-6">
    <div className="flex items-start justify-between">
     <div>
      <p className="text-sm text-slate-400 mb-1">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {trend && (
       <div className="flex items-center gap-1 mt-2">
        <TrendingUp className="w-3 h-3 text-emerald-400" />
        <span className="text-xs text-emerald-400">{trend}</span>
       </div>
      )}
     </div>
     <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
     </div>
    </div>
    <div className="flex items-center gap-1 mt-3 text-slate-500 text-xs group-hover:text-primary transition-colors">
     <span>View details</span>
     <ArrowUpRight className="w-3 h-3" />
    </div>
   </CardContent>
  </Card>
 </Link>
);

const DashboardPage: React.FC = () => {
 const { data: products, isLoading: productsLoading } = useAdminProducts();
 const { data: orders, isLoading: ordersLoading } = useAdminOrders();
 const { data: stats, isLoading: statsLoading } = useOrderStats();
 const { data: unreadCount, isLoading: unreadLoading } = useUnreadCount();
 const { data: testimonials, isLoading: testimonialsLoading } = useAdminTestimonials();

 const isLoading = productsLoading || ordersLoading || statsLoading || unreadLoading || testimonialsLoading;

 const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
 };

 return (
  <div className="space-y-6">
   {/* Stats Grid */}
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {isLoading ? (
     Array.from({ length: 4 }).map((_, i) => (
      <Card key={i} className="bg-slate-800/50 border-slate-700/50">
       <CardContent className="p-6">
        <Skeleton className="h-4 w-20 mb-2 bg-slate-700" />
        <Skeleton className="h-8 w-16 bg-slate-700" />
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
      />
      <StatCard
       title="Total Orders"
       value={stats?.total || 0}
       icon={ShoppingCart}
       trend={`${stats?.pending || 0} pending`}
       color="bg-gradient-to-br from-blue-500 to-cyan-600"
       link="/admin/orders"
      />
      <StatCard
       title="Unread Messages"
       value={unreadCount || 0}
       icon={MessageSquare}
       color="bg-gradient-to-br from-amber-500 to-orange-600"
       link="/admin/messages"
      />
      <StatCard
       title="Revenue"
       value={`৳${(stats?.revenue || 0).toLocaleString()}`}
       icon={DollarSign}
       trend={`${stats?.completed || 0} completed`}
       color="bg-gradient-to-br from-emerald-500 to-green-600"
       link="/admin/orders"
      />
     </>
    )}
   </div>

   {/* Recent Orders */}
   <Card className="bg-slate-800/50 border-slate-700/50">
    <CardHeader className="pb-3">
     <div className="flex items-center justify-between">
      <CardTitle className="text-lg text-white flex items-center gap-2">
       <Clock className="w-5 h-5 text-slate-400" />
       Recent Orders
      </CardTitle>
      <Link
       to="/admin/orders"
       className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
      >
       View all <ArrowUpRight className="w-3 h-3" />
      </Link>
     </div>
    </CardHeader>
    <CardContent>
     {ordersLoading ? (
      <div className="space-y-3">
       {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 bg-slate-700" />
       ))}
      </div>
     ) : orders && orders.length > 0 ? (
      <div className="overflow-x-auto">
       <table className="w-full">
        <thead>
         <tr className="border-b border-slate-700/50">
          <th className="text-left text-xs text-slate-400 font-medium pb-3 px-2">Order ID</th>
          <th className="text-left text-xs text-slate-400 font-medium pb-3 px-2">Customer</th>
          <th className="text-left text-xs text-slate-400 font-medium pb-3 px-2">Amount</th>
          <th className="text-left text-xs text-slate-400 font-medium pb-3 px-2">Status</th>
          <th className="text-left text-xs text-slate-400 font-medium pb-3 px-2">Date</th>
         </tr>
        </thead>
        <tbody>
         {orders.slice(0, 5).map((order) => (
          <tr key={order.id} className="border-b border-slate-700/30 last:border-0">
           <td className="py-3 px-2">
            <span className="font-mono text-sm text-white">{order.order_id}</span>
           </td>
           <td className="py-3 px-2">
            <span className="text-sm text-slate-300">{order.customer_name}</span>
           </td>
           <td className="py-3 px-2">
            <span className="text-sm font-medium text-white">৳{order.total_bdt.toLocaleString()}</span>
           </td>
           <td className="py-3 px-2">
            <Badge variant="outline" className={`text-[11px] ${statusColors[order.status] || ''}`}>
             {order.status}
            </Badge>
           </td>
           <td className="py-3 px-2">
            <span className="text-xs text-slate-400">
             {new Date(order.created_at).toLocaleDateString()}
            </span>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     ) : (
      <div className="text-center py-8 text-slate-500">
       <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-40" />
       <p className="text-sm">No orders yet</p>
      </div>
     )}
    </CardContent>
   </Card>

   {/* Quick Stats Row */}
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Testimonials Summary */}
    <Card className="bg-slate-800/50 border-slate-700/50">
     <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
       <CardTitle className="text-lg text-white flex items-center gap-2">
        <Star className="w-5 h-5 text-amber-400" />
        Testimonials
       </CardTitle>
       <Link
        to="/admin/testimonials"
        className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
       >
        Manage <ArrowUpRight className="w-3 h-3" />
       </Link>
      </div>
     </CardHeader>
     <CardContent>
      <div className="flex items-center gap-6">
       <div>
        <p className="text-3xl font-bold text-white">{testimonials?.length || 0}</p>
        <p className="text-sm text-slate-400">Total reviews</p>
       </div>
       <div>
        <p className="text-3xl font-bold text-emerald-400">
         {testimonials?.filter((t) => t.is_active).length || 0}
        </p>
        <p className="text-sm text-slate-400">Active</p>
       </div>
      </div>
     </CardContent>
    </Card>

    {/* Products Summary */}
    <Card className="bg-slate-800/50 border-slate-700/50">
     <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
       <CardTitle className="text-lg text-white flex items-center gap-2">
        <Package className="w-5 h-5 text-violet-400" />
        Products
       </CardTitle>
       <Link
        to="/admin/products"
        className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
       >
        Manage <ArrowUpRight className="w-3 h-3" />
       </Link>
      </div>
     </CardHeader>
     <CardContent>
      <div className="flex items-center gap-6">
       <div>
        <p className="text-3xl font-bold text-white">{products?.length || 0}</p>
        <p className="text-sm text-slate-400">Total products</p>
       </div>
       <div>
        <p className="text-3xl font-bold text-amber-400">
         {products?.filter((p) => p.isFeatured).length || 0}
        </p>
        <p className="text-sm text-slate-400">Featured</p>
       </div>
      </div>
     </CardContent>
    </Card>
   </div>
  </div>
 );
};

export default DashboardPage;
