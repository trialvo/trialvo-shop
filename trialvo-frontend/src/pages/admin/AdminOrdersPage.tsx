import React, { useState } from 'react';
import { Search, Eye, Loader2 } from 'lucide-react';
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
import { useAdminOrders, useUpdateOrderStatus, type Order } from '@/hooks/admin/useAdminOrders';

const statusOptions = ['pending', 'confirmed', 'completed', 'cancelled'];

const statusColors: Record<string, string> = {
 pending: 'bg-warning/10 text-warning border-warning/20',
 confirmed: 'bg-info/10 text-info border-info/20',
 completed: 'bg-success/10 text-success border-success/20',
 cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const AdminOrdersPage: React.FC = () => {
 const { toast } = useToast();
 const { data: orders, isLoading } = useAdminOrders();
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

 return (
  <div className="space-y-6">
   <div>
    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Orders</h1>
    <p className="text-sm text-muted-foreground mt-1">Manage customer orders</p>
   </div>

   <div className="flex flex-col sm:flex-row gap-3">
    <div className="relative flex-1 max-w-sm">
     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
     <Input
      placeholder="Search orders..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/25"
     />
    </div>
    <Select value={statusFilter} onValueChange={setStatusFilter}>
     <SelectTrigger className="w-40 bg-background border-border text-foreground hover:bg-muted/30">
      <SelectValue placeholder="All statuses" />
     </SelectTrigger>
     <SelectContent className="bg-popover border-border">
      <SelectItem value="all">All Statuses</SelectItem>
      {statusOptions.map((s) => (
       <SelectItem key={s} value={s} className="capitalize hover:bg-muted focus:bg-muted">{s}</SelectItem>
      ))}
     </SelectContent>
    </Select>
   </div>

   <Card className="bg-card border-border card-shadow">
    <CardContent className="p-0">
     {isLoading ? (
      <div className="p-6 space-y-3">
       {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 bg-muted" />
       ))}
      </div>
     ) : (
      <>
       {/* Mobile Card View */}
       <div className="md:hidden p-4 space-y-4">
        {filtered?.map((order) => (
         <div key={order.id} className="rounded-xl border border-border bg-muted/20 p-4 space-y-4 shadow-soft-sm">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
           <span className="font-mono text-sm font-semibold text-foreground">{order.order_id}</span>
           <Badge variant="outline" className={`text-[11px] font-semibold tracking-wide uppercase ${statusColors[order.status] || ''}`}>
            {order.status}
           </Badge>
          </div>
          <div className="flex items-center justify-between">
           <div>
            <p className="text-sm font-medium text-foreground">{order.customer_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{order.customer_phone}</p>
           </div>
           <span className="text-base font-bold text-primary">৳{order.total_bdt.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
           <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
           <div className="flex items-center gap-2">
            <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v)}>
             <SelectTrigger className="w-32 h-8 text-xs bg-background border-border hover:bg-muted/30 transition-colors">
              <SelectValue />
             </SelectTrigger>
             <SelectContent className="bg-popover border-border">
              {statusOptions.map((s) => (
               <SelectItem key={s} value={s} className="capitalize text-sm">{s}</SelectItem>
              ))}
             </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent hover:shadow-soft-sm transition-all" onClick={() => setViewOrder(order)}>
             <Eye className="w-4 h-4" />
            </Button>
           </div>
          </div>
         </div>
        ))}
        {filtered?.length === 0 && (
         <div className="text-center py-12 text-muted-foreground">No orders found</div>
        )}
       </div>

       {/* Desktop Table View */}
       <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
         <thead>
          <tr className="border-b border-border">
           <th className="text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider py-4 px-5">Order ID</th>
           <th className="text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider py-4 px-5">Customer</th>
           <th className="text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider py-4 px-5 hidden lg:table-cell">Product</th>
           <th className="text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider py-4 px-5">Amount</th>
           <th className="text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider py-4 px-5">Status</th>
           <th className="text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider py-4 px-5 hidden lg:table-cell">Date</th>
           <th className="text-right text-xs text-muted-foreground font-semibold uppercase tracking-wider py-4 px-5">Actions</th>
          </tr>
         </thead>
         <tbody>
          {filtered?.map((order) => (
           <tr key={order.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
            <td className="py-4 px-5">
             <span className="font-mono text-sm font-medium text-foreground">{order.order_id}</span>
            </td>
            <td className="py-4 px-5">
             <div>
              <p className="text-sm font-medium text-foreground">{order.customer_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{order.customer_phone}</p>
             </div>
            </td>
            <td className="py-4 px-5 hidden lg:table-cell">
             <span className="text-sm text-muted-foreground">
              {order.products?.name?.en || 'N/A'}
             </span>
            </td>
            <td className="py-4 px-5">
             <span className="text-sm font-bold text-primary">৳{order.total_bdt.toLocaleString()}</span>
            </td>
            <td className="py-4 px-5">
             <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v)}>
              <SelectTrigger className="w-32 h-8 text-xs bg-background border-border hover:bg-muted/30 transition-colors">
               <Badge variant="outline" className={`text-[11px] font-semibold tracking-wide uppercase ${statusColors[order.status] || ''}`}>
                {order.status}
               </Badge>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
               {statusOptions.map((s) => (
                <SelectItem key={s} value={s} className="capitalize text-sm focus:bg-muted">{s}</SelectItem>
               ))}
              </SelectContent>
             </Select>
            </td>
            <td className="py-4 px-5 hidden lg:table-cell">
             <span className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString()}
             </span>
            </td>
            <td className="py-4 px-5">
             <div className="flex justify-end">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent hover:shadow-soft-sm transition-all" onClick={() => setViewOrder(order)}>
               <Eye className="w-4 h-4" />
              </Button>
             </div>
            </td>
           </tr>
          ))}
         </tbody>
        </table>
        {filtered?.length === 0 && (
         <div className="text-center py-12 text-muted-foreground font-medium">No orders found</div>
        )}
       </div>
      </>
     )}
    </CardContent>
   </Card>

   {/* View Order Dialog */}
   <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
    <DialogContent className="bg-card border-border shadow-soft-xl max-w-lg">
     <DialogHeader className="border-b border-border pb-4">
      <DialogTitle className="text-foreground">Order Details</DialogTitle>
     </DialogHeader>
     {viewOrder && (
      <div className="space-y-5 mt-4">
       <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
         <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Order ID</span>
         <p className="font-mono font-medium text-foreground mt-1">{viewOrder.order_id}</p>
        </div>
        <div>
         <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Status</span>
         <p className="mt-1"><Badge variant="outline" className={`font-semibold tracking-wide uppercase ${statusColors[viewOrder.status]}`}>{viewOrder.status}</Badge></p>
        </div>
        <div>
         <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Customer</span>
         <p className="font-medium text-foreground mt-1">{viewOrder.customer_name}</p>
        </div>
        <div>
         <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Phone</span>
         <p className="text-foreground mt-1">{viewOrder.customer_phone}</p>
        </div>
        <div>
         <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Email</span>
         <p className="text-foreground mt-1">{viewOrder.customer_email}</p>
        </div>
        <div>
         <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Amount</span>
         <p className="font-bold text-lg text-primary mt-1">৳{viewOrder.total_bdt.toLocaleString()}</p>
        </div>
        <div>
         <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Payment</span>
         <p className="capitalize text-foreground mt-1">{viewOrder.payment_method}</p>
        </div>
        <div>
         <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Hosting</span>
         <p className="text-foreground mt-1">{viewOrder.needs_hosting ? 'Yes' : 'No'}</p>
        </div>
       </div>
       {viewOrder.company && (
        <div className="text-sm">
         <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Company</span>
         <p className="text-foreground mt-1">{viewOrder.company}</p>
        </div>
       )}
       {viewOrder.notes && (
        <div className="text-sm">
         <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Notes</span>
         <p className="bg-muted/50 p-4 rounded-lg mt-2 text-foreground/90 border border-border leading-relaxed shadow-soft-sm">{viewOrder.notes}</p>
        </div>
       )}
       <div className="text-sm border-t border-border pt-4">
        <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Date</span>
        <p className="text-foreground mt-1">{new Date(viewOrder.created_at).toLocaleString()}</p>
       </div>
      </div>
     )}
    </DialogContent>
   </Dialog>
  </div>
 );
};

export default AdminOrdersPage;
