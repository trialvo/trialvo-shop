import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Settings, ChevronRight, Package, Clock, TrendingUp, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCustomerAuth, customerApiHelper } from '@/contexts/CustomerAuthContext';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

const AccountDashboard: React.FC = () => {
 const { customer } = useCustomerAuth();

 const { data: orders } = useQuery({
  queryKey: ['customer', 'orders'],
  queryFn: () => customerApiHelper.get<any[]>('/customer/orders'),
 });

 const recentOrders = orders?.slice(0, 5);
 const pendingCount = orders?.filter(o => o.status === 'pending').length || 0;
 const completedCount = orders?.filter(o => o.status === 'completed').length || 0;
 const totalSpent = orders?.reduce((sum, o) => sum + Number(o.total_bdt), 0) || 0;

 const statusColor: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  confirmed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  processing: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
 };

 const statusIcon: Record<string, React.ReactNode> = {
  pending: <AlertCircle className="w-3 h-3" />,
  confirmed: <CheckCircle2 className="w-3 h-3" />,
  processing: <Clock className="w-3 h-3" />,
  completed: <CheckCircle2 className="w-3 h-3" />,
  cancelled: <AlertCircle className="w-3 h-3" />,
 };

 const stats = [
  {
   label: 'Total Orders',
   value: orders?.length || 0,
   icon: ShoppingBag,
   color: 'from-blue-500 to-blue-600',
   bgColor: 'bg-blue-500/10',
   textColor: 'text-blue-500',
  },
  {
   label: 'Pending',
   value: pendingCount,
   icon: Clock,
   color: 'from-amber-500 to-amber-600',
   bgColor: 'bg-amber-500/10',
   textColor: 'text-amber-500',
  },
  {
   label: 'Completed',
   value: completedCount,
   icon: CheckCircle2,
   color: 'from-emerald-500 to-emerald-600',
   bgColor: 'bg-emerald-500/10',
   textColor: 'text-emerald-500',
  },
  {
   label: 'Total Spent',
   value: `৳${totalSpent.toLocaleString()}`,
   icon: TrendingUp,
   color: 'from-primary to-primary/70',
   bgColor: 'bg-primary/10',
   textColor: 'text-primary',
  },
 ];

 const quickActions = [
  {
   to: '/account/orders',
   icon: ShoppingBag,
   label: 'My Orders',
   desc: 'View order history & track',
   color: 'from-blue-500/10 to-blue-600/5',
   iconBg: 'bg-blue-500/10',
   iconColor: 'text-blue-500',
  },
  {
   to: '/account/wishlist',
   icon: Heart,
   label: 'Wishlist',
   desc: 'Your saved products',
   color: 'from-rose-500/10 to-rose-600/5',
   iconBg: 'bg-rose-500/10',
   iconColor: 'text-rose-500',
  },
  {
   to: '/account/settings',
   icon: Settings,
   label: 'Settings',
   desc: 'Profile & security',
   color: 'from-gray-500/10 to-gray-600/5',
   iconBg: 'bg-muted',
   iconColor: 'text-muted-foreground',
  },
 ];

 return (
  <div className="space-y-6">
   {/* Welcome Banner */}
   <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-6 md:p-8"
   >
    <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[100px] opacity-20" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.2), transparent 70%)' }} />
    <div className="relative z-10">
     <div className="flex items-center gap-2 mb-2">
      <Sparkles className="w-4 h-4 text-accent" />
      <span className="text-xs font-semibold text-accent uppercase tracking-wider">Dashboard</span>
     </div>
     <h1 className="text-2xl font-bold text-foreground mb-1">
      Welcome back, {customer?.name?.split(' ')[0]}! 👋
     </h1>
     <p className="text-sm text-muted-foreground">
      Here's a quick overview of your account activity and recent orders.
     </p>
    </div>
   </motion.div>

   {/* Stats Grid */}
   <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {stats.map((stat, i) => (
     <motion.div
      key={stat.label}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + i * 0.05 }}
      className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
     >
      <div className="flex items-center justify-between mb-3">
       <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
        <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
       </div>
      </div>
      <p className="text-2xl font-extrabold text-foreground">{stat.value}</p>
      <p className="text-xs text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
     </motion.div>
    ))}
   </div>

   {/* Quick Actions */}
   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    {quickActions.map((action, i) => (
     <motion.div
      key={action.to}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + i * 0.05 }}
     >
      <Link
       to={action.to}
       className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 hover:border-primary/30 hover:shadow-md transition-all duration-300 group"
      >
       <div className={`w-12 h-12 rounded-xl ${action.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
        <action.icon className={`w-5 h-5 ${action.iconColor}`} />
       </div>
       <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">{action.label}</p>
        <p className="text-xs text-muted-foreground">{action.desc}</p>
       </div>
       <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </Link>
     </motion.div>
    ))}
   </div>

   {/* Recent Orders */}
   <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.35 }}
    className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm"
   >
    <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
     <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
       <Clock className="w-4 h-4 text-primary" />
      </div>
      <h3 className="text-sm font-bold text-foreground">Recent Orders</h3>
      {orders && orders.length > 0 && (
       <Badge variant="secondary" className="text-[10px] px-2 py-0">
        {orders.length}
       </Badge>
      )}
     </div>
     <Link to="/account/orders" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 group">
      View all
      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
     </Link>
    </div>

    {recentOrders && recentOrders.length > 0 ? (
     <div className="divide-y divide-border/40">
      {recentOrders.map((order: any, i: number) => (
       <motion.div
        key={order.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 + i * 0.05 }}
        className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
       >
        <div className="w-10 h-10 rounded-xl bg-muted/70 flex items-center justify-center flex-shrink-0">
         {order.product?.thumbnail ? (
          <img src={order.product.thumbnail} alt="" className="w-10 h-10 rounded-xl object-cover" />
         ) : (
          <Package className="w-4 h-4 text-muted-foreground" />
         )}
        </div>
        <div className="flex-1 min-w-0">
         <p className="text-sm font-semibold text-foreground font-mono">{order.order_id}</p>
         <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <Badge
         variant="secondary"
         className={`${statusColor[order.status] || ''} text-[10px] font-semibold px-2.5 py-0.5 rounded-full border capitalize gap-1`}
        >
         {statusIcon[order.status]}
         {order.status}
        </Badge>
        <span className="text-sm font-bold text-foreground min-w-[80px] text-right">
         ৳{Number(order.total_bdt).toLocaleString()}
        </span>
       </motion.div>
      ))}
     </div>
    ) : (
     <div className="py-12 text-center">
      <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground font-medium">No orders yet</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Your orders will appear here</p>
     </div>
    )}
   </motion.div>
  </div>
 );
};

export default AccountDashboard;
