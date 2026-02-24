import React from 'react';
import { BarChart3, ShoppingCart, Users, Tag, TrendingUp, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface AnalyticsData {
 ordersByStatus: { status: string; count: number; revenue: number }[];
 dailyOrders: { date: string; count: number; revenue: number }[];
 topProducts: { name: string; thumbnail: string; order_count: number; revenue: number }[];
 customers: { total_customers: number; new_this_week: number };
 topCoupons: { code: string; type: string; value: number; used_count: number; max_uses: number | null }[];
}

const AdminAnalyticsPage: React.FC = () => {
 const { data, isLoading } = useQuery({
  queryKey: ['admin', 'analytics'],
  queryFn: () => api.get<AnalyticsData>('/admin/analytics'),
 });

 if (isLoading) {
  return (
   <div className="flex items-center justify-center py-20">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
   </div>
  );
 }

 if (!data) return null;

 const totalOrders = data.ordersByStatus.reduce((s, r) => s + r.count, 0);
 const totalRevenue = data.ordersByStatus.reduce((s, r) => s + Number(r.revenue), 0);
 const maxDailyRevenue = Math.max(...data.dailyOrders.map(d => Number(d.revenue)), 1);

 return (
  <div className="space-y-5 animate-fade-in">
   <div>
    <h1 className="text-xl font-bold text-foreground">Analytics</h1>
    <p className="text-sm text-muted-foreground">Overview of store performance</p>
   </div>

   {/* Top Stats */}
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div className="rounded-xl border border-border bg-card p-4 text-center">
     <ShoppingCart className="w-5 h-5 mx-auto mb-1 text-primary" />
     <p className="text-lg font-bold text-foreground">{totalOrders}</p>
     <p className="text-xs text-muted-foreground">Total Orders</p>
    </div>
    <div className="rounded-xl border border-emerald-200 bg-emerald-500/5 p-4 text-center">
     <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
     <p className="text-lg font-bold text-emerald-600">৳{totalRevenue.toLocaleString()}</p>
     <p className="text-xs text-muted-foreground">Total Revenue</p>
    </div>
    <div className="rounded-xl border border-blue-200 bg-blue-500/5 p-4 text-center">
     <Users className="w-5 h-5 mx-auto mb-1 text-blue-600" />
     <p className="text-lg font-bold text-blue-600">{data.customers.total_customers}</p>
     <p className="text-xs text-muted-foreground">Customers</p>
    </div>
    <div className="rounded-xl border border-amber-200 bg-amber-500/5 p-4 text-center">
     <Users className="w-5 h-5 mx-auto mb-1 text-amber-600" />
     <p className="text-lg font-bold text-amber-600">{data.customers.new_this_week}</p>
     <p className="text-xs text-muted-foreground">New This Week</p>
    </div>
   </div>

   {/* Order Status Breakdown */}
   <div className="admin-card">
    <div className="p-5">
     <h3 className="text-sm font-semibold text-foreground mb-3">Orders by Status</h3>
     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {data.ordersByStatus.map(s => {
       const colors: Record<string, string> = {
        pending: 'text-amber-600 bg-amber-500/10 border-amber-200',
        confirmed: 'text-blue-600 bg-blue-500/10 border-blue-200',
        processing: 'text-purple-600 bg-purple-500/10 border-purple-200',
        completed: 'text-emerald-600 bg-emerald-500/10 border-emerald-200',
        cancelled: 'text-red-500 bg-red-500/10 border-red-200',
       };
       return (
        <div key={s.status} className={`rounded-lg border p-3 ${colors[s.status] || 'border-border bg-muted/50'}`}>
         <p className="text-lg font-bold">{s.count}</p>
         <p className="text-xs capitalize">{s.status}</p>
         <p className="text-[10px] opacity-70">৳{Number(s.revenue).toLocaleString()}</p>
        </div>
       );
      })}
     </div>
    </div>
   </div>

   <div className="grid md:grid-cols-2 gap-4">
    {/* Revenue Chart (simple bar) */}
    <div className="admin-card">
     <div className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3">Revenue (Last 30 Days)</h3>
      <div className="flex items-end gap-1 h-32">
       {data.dailyOrders.map((d, i) => (
        <div key={i} className="flex-1 group relative">
         <div
          className="bg-primary/80 rounded-t hover:bg-primary transition-colors min-h-[2px]"
          style={{ height: `${(Number(d.revenue) / maxDailyRevenue) * 100}%` }}
          title={`${d.date}: ৳${Number(d.revenue).toLocaleString()} (${d.count} orders)`}
         />
        </div>
       ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
       <span>{data.dailyOrders[0]?.date?.split('-').slice(1).join('/')}</span>
       <span>{data.dailyOrders[data.dailyOrders.length - 1]?.date?.split('-').slice(1).join('/')}</span>
      </div>
     </div>
    </div>

    {/* Top Products */}
    <div className="admin-card">
     <div className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3">Top Products</h3>
      <div className="space-y-3">
       {data.topProducts.map((p, i) => {
        const pName = typeof p.name === 'string' ? p.name : (p.name as any)?.en || 'Product';
        return (
         <div key={i} className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
          <img src={p.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover" />
          <div className="flex-1 min-w-0">
           <p className="text-xs font-medium text-foreground truncate">{pName}</p>
           <p className="text-[10px] text-muted-foreground">{p.order_count} orders</p>
          </div>
          <span className="text-xs font-bold text-emerald-600">৳{Number(p.revenue).toLocaleString()}</span>
         </div>
        );
       })}
       {data.topProducts.length === 0 && <p className="text-xs text-muted-foreground">No data yet</p>}
      </div>
     </div>
    </div>
   </div>

   {/* Top Coupons */}
   {data.topCoupons.length > 0 && (
    <div className="admin-card">
     <div className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3">Most Used Coupons</h3>
      <div className="space-y-2">
       {data.topCoupons.map((c, i) => (
        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border">
         <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs font-bold">{c.code}</span>
          <span className="text-[10px] text-muted-foreground">
           {c.type === 'percent' ? `${c.value}%` : `৳${c.value}`}
          </span>
         </div>
         <span className="text-xs text-foreground font-medium">
          {c.used_count}{c.max_uses ? `/${c.max_uses}` : ''} uses
         </span>
        </div>
       ))}
      </div>
     </div>
    </div>
   )}
  </div>
 );
};

export default AdminAnalyticsPage;
