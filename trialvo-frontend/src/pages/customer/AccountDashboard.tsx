import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Settings, ChevronRight, Package, Clock } from 'lucide-react';
import { useCustomerAuth, customerApiHelper } from '@/contexts/CustomerAuthContext';
import { useQuery } from '@tanstack/react-query';

const AccountDashboard: React.FC = () => {
 const { customer } = useCustomerAuth();

 const { data: orders } = useQuery({
  queryKey: ['customer', 'orders'],
  queryFn: () => customerApiHelper.get<any[]>('/customer/orders'),
 });

 const recentOrders = orders?.slice(0, 3);
 const pendingCount = orders?.filter(o => o.status === 'pending').length || 0;
 const completedCount = orders?.filter(o => o.status === 'completed').length || 0;

 const statusColor: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-200',
  confirmed: 'bg-blue-500/10 text-blue-600 border-blue-200',
  processing: 'bg-purple-500/10 text-purple-600 border-purple-200',
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  cancelled: 'bg-red-500/10 text-red-600 border-red-200',
 };

 return (
  <div className="space-y-6">
   {/* Welcome */}
   <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/5 to-primary/10 p-6">
    <h1 className="text-xl font-bold text-foreground">Welcome, {customer?.name}!</h1>
    <p className="text-sm text-muted-foreground mt-1">Manage your orders and account from here.</p>
   </div>

   {/* Quick Stats */}
   <div className="grid grid-cols-3 gap-3">
    <div className="rounded-xl border border-border bg-card p-4 text-center">
     <p className="text-2xl font-bold text-foreground">{orders?.length || 0}</p>
     <p className="text-xs text-muted-foreground mt-0.5">Total Orders</p>
    </div>
    <div className="rounded-xl border border-amber-200 bg-amber-500/5 p-4 text-center">
     <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
     <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
    </div>
    <div className="rounded-xl border border-emerald-200 bg-emerald-500/5 p-4 text-center">
     <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
     <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
    </div>
   </div>

   {/* Quick Actions */}
   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <Link to="/account/orders" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-soft-sm transition-all group">
     <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-blue-500" /></div>
     <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground">My Orders</p>
      <p className="text-xs text-muted-foreground">View order history</p>
     </div>
     <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
    <Link to="/account/wishlist" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-soft-sm transition-all group">
     <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center"><Heart className="w-5 h-5 text-rose-500" /></div>
     <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground">Wishlist</p>
      <p className="text-xs text-muted-foreground">Saved products</p>
     </div>
     <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
    <Link to="/account/settings" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-soft-sm transition-all group">
     <div className="w-10 h-10 rounded-xl bg-gray-500/10 flex items-center justify-center"><Settings className="w-5 h-5 text-gray-500" /></div>
     <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground">Settings</p>
      <p className="text-xs text-muted-foreground">Profile & password</p>
     </div>
     <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
   </div>

   {/* Recent Orders */}
   {recentOrders && recentOrders.length > 0 && (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
     <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
      <div className="flex items-center gap-2">
       <Clock className="w-4 h-4 text-muted-foreground" />
       <h3 className="text-sm font-semibold text-foreground">Recent Orders</h3>
      </div>
      <Link to="/account/orders" className="text-xs text-primary hover:underline font-medium">View all</Link>
     </div>
     <div className="divide-y divide-border">
      {recentOrders.map((order: any) => (
       <div key={order.id} className="flex items-center gap-4 px-5 py-3.5">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
         <Package className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
         <p className="text-sm font-medium text-foreground">{order.order_id}</p>
         <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${statusColor[order.status] || ''}`}>
         {order.status}
        </span>
        <span className="text-sm font-bold text-foreground">৳{Number(order.total_bdt).toLocaleString()}</span>
       </div>
      ))}
     </div>
    </div>
   )}
  </div>
 );
};

export default AccountDashboard;
