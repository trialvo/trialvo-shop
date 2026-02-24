import React, { useState } from 'react';
import { customerApiHelper } from '@/contexts/CustomerAuthContext';
import { useQuery } from '@tanstack/react-query';
import { Package, Search, Clock, Eye, CheckCircle2, AlertCircle, Filter, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
 Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import InvoiceDownloadButton from '@/components/InvoiceDownloadButton';

const OrderHistoryPage: React.FC = () => {
 const [search, setSearch] = useState('');
 const [selectedOrder, setSelectedOrder] = useState<any>(null);
 const [statusFilter, setStatusFilter] = useState<string>('all');

 const { data: orders, isLoading } = useQuery({
  queryKey: ['customer', 'orders'],
  queryFn: () => customerApiHelper.get('/customer/orders') as Promise<any[]>,
 });

 const { data: orderDetail } = useQuery({
  queryKey: ['customer', 'order', selectedOrder?.id],
  queryFn: () => customerApiHelper.get(`/customer/orders/${selectedOrder?.id}`) as Promise<{ order: any; timeline: any[] }>,
  enabled: !!selectedOrder?.id,
 });

 const filtered = orders?.filter(o => {
  const matchesSearch = o.order_id.toLowerCase().includes(search.toLowerCase()) ||
   o.customer_name.toLowerCase().includes(search.toLowerCase());
  const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
  return matchesSearch && matchesStatus;
 });

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
  cancelled: <X className="w-3 h-3" />,
 };

 const statuses = ['all', 'pending', 'confirmed', 'processing', 'completed', 'cancelled'];

 return (
  <div className="space-y-6">
   {/* Header */}
   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
    <p className="text-sm text-muted-foreground mt-1">Track and manage all your orders</p>
   </motion.div>

   {/* Search & Filters */}
   <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.05 }}
    className="space-y-3"
   >
    <div className="flex flex-col sm:flex-row gap-3">
     <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
       placeholder="Search by order ID or name..."
       value={search}
       onChange={(e) => setSearch(e.target.value)}
       className="pl-9 bg-card/80 border-border/60 rounded-xl h-11"
      />
     </div>
    </div>
    {/* Status filter pills */}
    <div className="flex items-center gap-2 flex-wrap">
     <Filter className="w-3.5 h-3.5 text-muted-foreground" />
     {statuses.map(s => (
      <button
       key={s}
       onClick={() => setStatusFilter(s)}
       className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border ${statusFilter === s
         ? 'bg-primary text-primary-foreground border-primary shadow-sm'
         : 'bg-card/60 text-muted-foreground border-border/60 hover:bg-muted/70 hover:text-foreground'
        }`}
      >
       {s === 'all' ? `All (${orders?.length || 0})` : `${s} (${orders?.filter(o => o.status === s).length || 0})`}
      </button>
     ))}
    </div>
   </motion.div>

   {/* Orders List */}
   {isLoading ? (
    <div className="space-y-3">
     {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-border/60 bg-card p-5 animate-pulse">
       <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
         <div className="h-4 w-32 bg-muted rounded" />
         <div className="h-3 w-48 bg-muted rounded" />
        </div>
        <div className="h-6 w-20 bg-muted rounded-full" />
       </div>
      </div>
     ))}
    </div>
   ) : filtered && filtered.length > 0 ? (
    <div className="space-y-3">
     <AnimatePresence>
      {filtered.map((order: any, i: number) => (
       <motion.button
        key={order.id}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.04 }}
        onClick={() => setSelectedOrder(order)}
        className="w-full text-left rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 sm:p-5 hover:border-primary/25 hover:shadow-md transition-all group"
       >
        <div className="flex items-center gap-4">
         <div className="w-12 h-12 rounded-xl bg-muted/70 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {order.product?.thumbnail ? (
           <img src={order.product.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover" />
          ) : (
           <Package className="w-5 h-5 text-muted-foreground" />
          )}
         </div>
         <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
           <span className="text-sm font-bold text-foreground font-mono">{order.order_id}</span>
           <Badge
            variant="secondary"
            className={`${statusColor[order.status] || ''} text-[10px] font-semibold px-2 py-0 rounded-full border capitalize gap-1`}
           >
            {statusIcon[order.status]}
            {order.status}
           </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
           {order.product?.name
            ? (typeof order.product.name === 'string' ? JSON.parse(order.product.name).en : order.product.name.en)
            : 'Product'
           }
           <span className="mx-1.5">·</span>
           {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
         </div>
         <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-foreground">৳{Number(order.total_bdt).toLocaleString()}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 group-hover:text-primary transition-colors justify-end">
           <Eye className="w-3 h-3" />
           <span>Details</span>
          </div>
         </div>
        </div>
       </motion.button>
      ))}
     </AnimatePresence>
    </div>
   ) : (
    <motion.div
     initial={{ opacity: 0, scale: 0.95 }}
     animate={{ opacity: 1, scale: 1 }}
     className="text-center py-16 rounded-2xl border border-border/60 bg-card/80"
    >
     <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
      <Package className="w-8 h-8 text-muted-foreground/40" />
     </div>
     <p className="text-foreground font-semibold text-lg">No orders found</p>
     <p className="text-sm text-muted-foreground mt-1">
      {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Your orders will appear here'}
     </p>
    </motion.div>
   )}

   {/* Order Detail Dialog */}
   <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
    <DialogContent className="max-w-lg bg-card border-border/60 rounded-2xl">
     <DialogHeader>
      <div className="flex items-center justify-between">
       <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
         <FileText className="w-4 h-4 text-primary" />
        </div>
        <DialogTitle className="font-mono text-base">{selectedOrder?.order_id}</DialogTitle>
       </div>
       {orderDetail && <InvoiceDownloadButton order={orderDetail.order} />}
      </div>
     </DialogHeader>

     {orderDetail && (
      <div className="space-y-5 mt-2">
       <div className="grid grid-cols-2 gap-3">
        {[
         {
          label: 'Status', value: (
           <Badge variant="secondary" className={`${statusColor[orderDetail.order.status] || ''} text-[10px] font-semibold px-2.5 py-0.5 rounded-full border capitalize gap-1`}>
            {statusIcon[orderDetail.order.status]}
            {orderDetail.order.status}
           </Badge>
          )
         },
         { label: 'Amount', value: <span className="font-bold text-foreground text-lg">৳{Number(orderDetail.order.total_bdt).toLocaleString()}</span> },
         { label: 'Payment', value: <span className="text-foreground capitalize">{orderDetail.order.payment_method}</span> },
         { label: 'Date', value: <span className="text-foreground">{new Date(orderDetail.order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span> },
        ].map((item, i) => (
         <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border/30">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">{item.label}</p>
          {item.value}
         </div>
        ))}
        {orderDetail.order.tracking_number && (
         <div className="col-span-2 p-3 rounded-xl bg-muted/30 border border-border/30">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Tracking Number</p>
          <p className="text-foreground font-mono font-semibold">{orderDetail.order.tracking_number}</p>
         </div>
        )}
       </div>

       {/* Timeline */}
       {orderDetail.timeline && orderDetail.timeline.length > 0 && (
        <div>
         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Order Timeline</p>
         <div className="space-y-0">
          {orderDetail.timeline.map((entry: any, i: number) => (
           <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
             <div className={`w-3 h-3 rounded-full mt-1.5 ${i === 0 ? 'bg-primary shadow-sm shadow-primary/30' : 'bg-muted-foreground/30'}`} />
             {i < orderDetail.timeline.length - 1 && <div className="w-px flex-1 bg-border/50 mt-1" />}
            </div>
            <div className="pb-4">
             <p className="text-sm text-foreground capitalize font-semibold">{entry.to_status}</p>
             <p className="text-[11px] text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p>
             {entry.comment && <p className="text-[11px] text-muted-foreground/70 mt-0.5 italic">{entry.comment}</p>}
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
