import React, { useState } from 'react';
import { Search, Eye, Loader2, ShoppingCart, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from '@/components/ui/dialog';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminOrders, useUpdateOrderStatus, useOrderStats, type Order } from '@/hooks/admin/useAdminOrders';

const statusOptions = ['pending', 'confirmed', 'completed', 'cancelled'];

const statusBadgeClass: Record<string, string> = {
 pending: 'admin-badge admin-badge-pending',
 confirmed: 'admin-badge admin-badge-confirmed',
 completed: 'admin-badge admin-badge-completed',
 cancelled: 'admin-badge admin-badge-cancelled',
};

const statusIcons: Record<string, React.ElementType> = {
 pending: Clock,
 confirmed: AlertCircle,
 completed: CheckCircle2,
 cancelled: XCircle,
};

const AdminOrdersPage: React.FC = () => {
 const { toast } = useToast();
 const { data: orders, isLoading } = useAdminOrders();
 const { data: stats } = useOrderStats();
 const updateStatus = useUpdateOrderStatus();
 const [search, setSearch] = useState('');
 const [statusFilter, setStatusFilter] = useState('all');
 const [viewOrder, setViewOrder] = useState<Order | null>(null);

 const filtered = orders?.filter((o) => {
  const matchesSearch =
   o.order_id.toLowerCase().includes(search.toLowerCase()) ||
   o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
   o.customer_email.toLowerCase().includes(search.toLowerCase());
  const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
  return matchesSearch && matchesStatus;
 });

 const handleStatusChange = async (id: string, status: string) => {
  try {
   await updateStatus.mutateAsync({ id, status });
   toast({ title: `Order status updated to ${status}` });
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
 };

 const statPills = [
  { label: 'Total', value: stats?.total || 0, color: 'text-foreground' },
  { label: 'Pending', value: stats?.pending || 0, color: 'text-amber-500' },
  { label: 'Completed', value: stats?.completed || 0, color: 'text-emerald-500' },
  { label: 'Cancelled', value: stats?.cancelled || 0, color: 'text-red-400' },
 ];

 return (
  <div className="space-y-5 animate-fade-in">
   {/* Header with stat pills */}
   <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
    <div className="admin-page-header">
     <h1>Orders</h1>
     <p>Manage customer orders and track fulfillment</p>
    </div>
    <div className="flex items-center gap-2 flex-wrap">
     {statPills.map((pill) => (
      <div key={pill.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
       <span className="text-[11px] text-muted-foreground font-medium">{pill.label}</span>
       <span className={`text-sm font-bold ${pill.color}`}>{pill.value}</span>
      </div>
     ))}
    </div>
   </div>

   {/* Search & Filters */}
   <div className="flex flex-col sm:flex-row gap-3">
    <div className="admin-search flex-1 max-w-sm">
     <Search />
     <Input
      placeholder="Search orders..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
     />
    </div>
    <div className="flex items-center gap-1.5 flex-wrap">
     <button
      onClick={() => setStatusFilter('all')}
      className={`admin-filter-pill ${statusFilter === 'all' ? 'admin-filter-pill-active' : 'admin-filter-pill-inactive'}`}
     >
      All
     </button>
     {statusOptions.map((s) => (
      <button
       key={s}
       onClick={() => setStatusFilter(s)}
       className={`admin-filter-pill capitalize ${statusFilter === s ? 'admin-filter-pill-active' : 'admin-filter-pill-inactive'}`}
      >
       {s}
      </button>
     ))}
    </div>
   </div>

   <div className="admin-card">
    {isLoading ? (
     <div className="p-5 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
       <Skeleton key={i} className="h-14 bg-muted" />
      ))}
     </div>
    ) : (
     <>
      {/* Mobile Card View */}
      <div className="md:hidden p-3 space-y-3">
       {filtered?.map((order) => (
        <div key={order.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
         <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <span className="font-mono text-sm font-semibold text-foreground">{order.order_id}</span>
          <span className={statusBadgeClass[order.status] || 'admin-badge'}>
           <span className="w-1.5 h-1.5 rounded-full bg-current" />
           {order.status}
          </span>
         </div>
         <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
           <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary">{order.customer_name.charAt(0).toUpperCase()}</span>
           </div>
           <div>
            <p className="text-sm font-medium text-foreground">{order.customer_name}</p>
            <p className="text-[11px] text-muted-foreground">{order.customer_phone}</p>
           </div>
          </div>
          <span className="text-base font-bold text-foreground">৳{order.total_bdt.toLocaleString()}</span>
         </div>
         <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <span className="text-[11px] text-muted-foreground font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
          <div className="flex items-center gap-2">
           <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v)}>
            <SelectTrigger className="w-28 h-7 text-[11px] bg-muted/50 border-border hover:bg-muted transition-colors rounded-lg">
             <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
             {statusOptions.map((s) => (
              <SelectItem key={s} value={s} className="capitalize text-sm">{s}</SelectItem>
             ))}
            </SelectContent>
           </Select>
           <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => setViewOrder(order)}>
            <Eye className="w-3.5 h-3.5" />
           </Button>
          </div>
         </div>
        </div>
       ))}
       {filtered?.length === 0 && (
        <div className="admin-empty">
         <ShoppingCart />
         <p>No orders found</p>
        </div>
       )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
       <table className="w-full">
        <thead>
         <tr className="admin-table-header">
          <th>Order ID</th>
          <th>Customer</th>
          <th className="hidden lg:table-cell">Product</th>
          <th>Amount</th>
          <th>Status</th>
          <th className="hidden lg:table-cell">Date</th>
          <th className="text-right">Actions</th>
         </tr>
        </thead>
        <tbody>
         {filtered?.map((order) => (
          <tr key={order.id} className="admin-table-row group">
           <td>
            <span className="font-mono text-sm font-medium text-foreground">{order.order_id}</span>
           </td>
           <td>
            <div className="flex items-center gap-2.5">
             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-primary">{order.customer_name.charAt(0).toUpperCase()}</span>
             </div>
             <div>
              <p className="text-sm font-medium text-foreground">{order.customer_name}</p>
              <p className="text-[11px] text-muted-foreground">{order.customer_phone}</p>
             </div>
            </div>
           </td>
           <td className="hidden lg:table-cell">
            <span className="text-sm text-muted-foreground">
             {order.products?.name?.en || 'N/A'}
            </span>
           </td>
           <td>
            <span className="text-sm font-bold text-foreground">৳{order.total_bdt.toLocaleString()}</span>
           </td>
           <td>
            <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v)}>
             <SelectTrigger className="w-32 h-8 text-xs bg-transparent border-none shadow-none p-0 hover:bg-transparent">
              <span className={statusBadgeClass[order.status] || 'admin-badge'}>
               <span className="w-1.5 h-1.5 rounded-full bg-current" />
               {order.status}
              </span>
             </SelectTrigger>
             <SelectContent className="bg-popover border-border">
              {statusOptions.map((s) => (
               <SelectItem key={s} value={s} className="capitalize text-sm focus:bg-muted">{s}</SelectItem>
              ))}
             </SelectContent>
            </Select>
           </td>
           <td className="hidden lg:table-cell">
            <span className="text-xs text-muted-foreground">
             {new Date(order.created_at).toLocaleDateString()}
            </span>
           </td>
           <td>
            <div className="flex justify-end">
             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent opacity-0 group-hover:opacity-100 transition-all" onClick={() => setViewOrder(order)}>
              <Eye className="w-4 h-4" />
             </Button>
            </div>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
       {filtered?.length === 0 && (
        <div className="admin-empty">
         <ShoppingCart />
         <p>No orders found</p>
        </div>
       )}
      </div>
     </>
    )}
   </div>

   {/* View Order Dialog */}
   <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
    <DialogContent className="bg-card border-border shadow-soft-xl max-w-lg">
     <DialogHeader className="border-b border-border pb-4">
      <div className="flex items-center gap-3">
       <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <ShoppingCart className="w-5 h-5 text-primary" />
       </div>
       <div>
        <DialogTitle className="text-foreground">Order Details</DialogTitle>
        <p className="text-xs text-muted-foreground mt-0.5">#{viewOrder?.order_id}</p>
       </div>
      </div>
     </DialogHeader>
     {viewOrder && (
      <div className="space-y-5 mt-2">
       {/* Status */}
       <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</span>
        <span className={statusBadgeClass[viewOrder.status]}>
         <span className="w-1.5 h-1.5 rounded-full bg-current" />
         {viewOrder.status}
        </span>
       </div>

       {/* Customer Info */}
       <div>
        <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">Customer Info</h4>
        <div className="grid grid-cols-2 gap-3">
         <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Name</span>
          <p className="text-sm font-medium text-foreground mt-0.5">{viewOrder.customer_name}</p>
         </div>
         <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Phone</span>
          <p className="text-sm text-foreground mt-0.5">{viewOrder.customer_phone}</p>
         </div>
         <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Email</span>
          <p className="text-sm text-foreground mt-0.5 truncate">{viewOrder.customer_email}</p>
         </div>
         <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Amount</span>
          <p className="text-lg font-bold text-foreground mt-0.5">৳{viewOrder.total_bdt.toLocaleString()}</p>
         </div>
        </div>
       </div>

       {/* Billing Info */}
       <div>
        <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">Billing</h4>
        <div className="grid grid-cols-2 gap-3">
         <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Payment</span>
          <p className="text-sm capitalize text-foreground mt-0.5">{viewOrder.payment_method}</p>
         </div>
         <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Hosting</span>
          <p className="text-sm text-foreground mt-0.5">{viewOrder.needs_hosting ? 'Yes' : 'No'}</p>
         </div>
        </div>
       </div>

       {viewOrder.company && (
        <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
         <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Company</span>
         <p className="text-sm text-foreground mt-0.5">{viewOrder.company}</p>
        </div>
       )}

       {viewOrder.notes && (
        <div>
         <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Notes</h4>
         <p className="bg-muted/30 p-4 rounded-xl text-sm text-foreground/90 border border-border/50 leading-relaxed">{viewOrder.notes}</p>
        </div>
       )}

       <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
        <span>Order Date</span>
        <span className="font-medium">{new Date(viewOrder.created_at).toLocaleString()}</span>
       </div>
      </div>
     )}
    </DialogContent>
   </Dialog>
  </div>
 );
};

export default AdminOrdersPage;
