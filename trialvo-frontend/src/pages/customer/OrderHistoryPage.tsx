import React, { useState } from 'react';
import { customerApiHelper } from '@/contexts/CustomerAuthContext';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronRight, Search, Clock, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
 Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import InvoiceDownloadButton from '@/components/InvoiceDownloadButton';

const OrderHistoryPage: React.FC = () => {
 const [search, setSearch] = useState('');
 const [selectedOrder, setSelectedOrder] = useState<any>(null);

 const { data: orders, isLoading } = useQuery({
  queryKey: ['customer', 'orders'],
  queryFn: () => customerApiHelper.get('/customer/orders') as Promise<any[]>,
 });

 const { data: orderDetail } = useQuery({
  queryKey: ['customer', 'order', selectedOrder?.id],
  queryFn: () => customerApiHelper.get(`/customer/orders/${selectedOrder?.id}`) as Promise<{ order: any; timeline: any[] }>,
  enabled: !!selectedOrder?.id,
 });

 const filtered = orders?.filter(o =>
  o.order_id.toLowerCase().includes(search.toLowerCase()) ||
  o.customer_name.toLowerCase().includes(search.toLowerCase())
 );

 const statusColor: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-200',
  confirmed: 'bg-blue-500/10 text-blue-600 border-blue-200',
  processing: 'bg-purple-500/10 text-purple-600 border-purple-200',
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  cancelled: 'bg-red-500/10 text-red-600 border-red-200',
 };

 return (
  <div className="space-y-5">
   <div>
    <h1 className="text-xl font-bold text-foreground">My Orders</h1>
    <p className="text-sm text-muted-foreground mt-0.5">Track and manage your orders</p>
   </div>

   <div className="relative max-w-sm">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <Input
     placeholder="Search by order ID..."
     value={search}
     onChange={(e) => setSearch(e.target.value)}
     className="pl-9 bg-background border-border"
    />
   </div>

   {isLoading ? (
    <div className="space-y-3">
     {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
       <div className="h-4 w-32 bg-muted rounded mb-2" />
       <div className="h-3 w-48 bg-muted rounded" />
      </div>
     ))}
    </div>
   ) : filtered && filtered.length > 0 ? (
    <div className="space-y-3">
     {filtered.map((order: any) => (
      <button
       key={order.id}
       onClick={() => setSelectedOrder(order)}
       className="w-full text-left rounded-xl border border-border bg-card p-4 sm:p-5 hover:border-primary/20 hover:shadow-soft-sm transition-all group"
      >
       <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
         {order.product?.thumbnail ? (
          <img src={order.product.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover" />
         ) : (
          <Package className="w-5 h-5 text-muted-foreground" />
         )}
        </div>
        <div className="flex-1 min-w-0">
         <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-foreground font-mono">{order.order_id}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${statusColor[order.status] || ''}`}>
           {order.status}
          </span>
         </div>
         <p className="text-xs text-muted-foreground mt-0.5">
          {order.product?.name ? (typeof order.product.name === 'string' ? JSON.parse(order.product.name).en : order.product.name.en) : 'Product'}
          {' · '}{new Date(order.created_at).toLocaleDateString()}
         </p>
        </div>
        <div className="text-right flex-shrink-0">
         <p className="text-sm font-bold text-foreground">৳{Number(order.total_bdt).toLocaleString()}</p>
         <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 group-hover:text-primary transition-colors">
          <Eye className="w-3 h-3" /> Details
         </div>
        </div>
       </div>
      </button>
     ))}
    </div>
   ) : (
    <div className="text-center py-16 rounded-2xl border border-border bg-card">
     <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
     <p className="text-muted-foreground font-medium">No orders found</p>
    </div>
   )}

   {/* Order Detail Dialog */}
   <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
    <DialogContent className="max-w-lg bg-card border-border">
     <DialogHeader>
      <div className="flex items-center justify-between">
       <DialogTitle className="font-mono">{selectedOrder?.order_id}</DialogTitle>
       {orderDetail && <InvoiceDownloadButton order={orderDetail.order} />}
      </div>
     </DialogHeader>

     {orderDetail && (
      <div className="space-y-5 mt-2">
       <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
         <p className="text-xs text-muted-foreground mb-0.5">Status</p>
         <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${statusColor[orderDetail.order.status] || ''}`}>
          {orderDetail.order.status}
         </span>
        </div>
        <div>
         <p className="text-xs text-muted-foreground mb-0.5">Amount</p>
         <p className="font-bold text-foreground">৳{Number(orderDetail.order.total_bdt).toLocaleString()}</p>
        </div>
        <div>
         <p className="text-xs text-muted-foreground mb-0.5">Payment</p>
         <p className="text-foreground capitalize">{orderDetail.order.payment_method}</p>
        </div>
        <div>
         <p className="text-xs text-muted-foreground mb-0.5">Date</p>
         <p className="text-foreground">{new Date(orderDetail.order.created_at).toLocaleDateString()}</p>
        </div>
        {orderDetail.order.tracking_number && (
         <div className="col-span-2">
          <p className="text-xs text-muted-foreground mb-0.5">Tracking Number</p>
          <p className="text-foreground font-mono">{orderDetail.order.tracking_number}</p>
         </div>
        )}
       </div>

       {/* Timeline */}
       {orderDetail.timeline && orderDetail.timeline.length > 0 && (
        <div>
         <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Timeline</p>
         <div className="space-y-3">
          {orderDetail.timeline.map((entry: any, i: number) => (
           <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
             <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1" />
             {i < orderDetail.timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
            </div>
            <div className="pb-3">
             <p className="text-sm text-foreground capitalize">{entry.to_status}</p>
             <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p>
             {entry.comment && <p className="text-xs text-muted-foreground mt-0.5">{entry.comment}</p>}
            </div>
           </div>
          ))}
         </div>
        </div>
       )}
      </div>
     )}
    </DialogContent>
   </Dialog>
  </div>
 );
};

export default OrderHistoryPage;
