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
 pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
 confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
 completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
 cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
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
    <h1 className="text-2xl font-bold text-white">Orders</h1>
    <p className="text-sm text-slate-400">Manage customer orders</p>
   </div>

   <div className="flex flex-col sm:flex-row gap-3">
    <div className="relative flex-1 max-w-sm">
     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
     <Input
      placeholder="Search orders..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
     />
    </div>
    <Select value={statusFilter} onValueChange={setStatusFilter}>
     <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700 text-white">
      <SelectValue placeholder="All statuses" />
     </SelectTrigger>
     <SelectContent className="bg-slate-800 border-slate-700">
      <SelectItem value="all">All Statuses</SelectItem>
      {statusOptions.map((s) => (
       <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
      ))}
     </SelectContent>
    </Select>
   </div>

   <Card className="bg-slate-800/50 border-slate-700/50">
    <CardContent className="p-0">
     {isLoading ? (
      <div className="p-6 space-y-3">
       {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 bg-slate-700" />
       ))}
      </div>
     ) : (
      <div className="overflow-x-auto">
       <table className="w-full">
        <thead>
         <tr className="border-b border-slate-700/50">
          <th className="text-left text-xs text-slate-400 font-medium py-3 px-4">Order ID</th>
          <th className="text-left text-xs text-slate-400 font-medium py-3 px-4">Customer</th>
          <th className="text-left text-xs text-slate-400 font-medium py-3 px-4">Product</th>
          <th className="text-left text-xs text-slate-400 font-medium py-3 px-4">Amount</th>
          <th className="text-left text-xs text-slate-400 font-medium py-3 px-4">Status</th>
          <th className="text-left text-xs text-slate-400 font-medium py-3 px-4">Date</th>
          <th className="text-right text-xs text-slate-400 font-medium py-3 px-4">Actions</th>
         </tr>
        </thead>
        <tbody>
         {filtered?.map((order) => (
          <tr key={order.id} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-700/20">
           <td className="py-3 px-4">
            <span className="font-mono text-sm text-white">{order.order_id}</span>
           </td>
           <td className="py-3 px-4">
            <div>
             <p className="text-sm text-white">{order.customer_name}</p>
             <p className="text-xs text-slate-400">{order.customer_phone}</p>
            </div>
           </td>
           <td className="py-3 px-4">
            <span className="text-sm text-slate-300">
             {order.products?.name?.en || 'N/A'}
            </span>
           </td>
           <td className="py-3 px-4">
            <span className="text-sm font-medium text-white">৳{order.total_bdt.toLocaleString()}</span>
           </td>
           <td className="py-3 px-4">
            <Select
             value={order.status}
             onValueChange={(v) => handleStatusChange(order.id, v)}
            >
             <SelectTrigger className="w-32 h-8 text-xs bg-transparent border-slate-600">
              <Badge variant="outline" className={`text-[11px] ${statusColors[order.status] || ''}`}>
               {order.status}
              </Badge>
             </SelectTrigger>
             <SelectContent className="bg-slate-800 border-slate-700">
              {statusOptions.map((s) => (
               <SelectItem key={s} value={s} className="capitalize text-sm">{s}</SelectItem>
              ))}
             </SelectContent>
            </Select>
           </td>
           <td className="py-3 px-4">
            <span className="text-xs text-slate-400">
             {new Date(order.created_at).toLocaleDateString()}
            </span>
           </td>
           <td className="py-3 px-4">
            <div className="flex justify-end">
             <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white"
              onClick={() => setViewOrder(order)}
             >
              <Eye className="w-4 h-4" />
             </Button>
            </div>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
       {filtered?.length === 0 && (
        <div className="text-center py-12 text-slate-500">No orders found</div>
       )}
      </div>
     )}
    </CardContent>
   </Card>

   {/* View Order Dialog */}
   <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
    <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
     <DialogHeader>
      <DialogTitle>Order Details</DialogTitle>
     </DialogHeader>
     {viewOrder && (
      <div className="space-y-4 mt-4">
       <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
         <span className="text-slate-400">Order ID</span>
         <p className="font-mono font-medium">{viewOrder.order_id}</p>
        </div>
        <div>
         <span className="text-slate-400">Status</span>
         <p><Badge variant="outline" className={statusColors[viewOrder.status]}>{viewOrder.status}</Badge></p>
        </div>
        <div>
         <span className="text-slate-400">Customer</span>
         <p className="font-medium">{viewOrder.customer_name}</p>
        </div>
        <div>
         <span className="text-slate-400">Phone</span>
         <p>{viewOrder.customer_phone}</p>
        </div>
        <div>
         <span className="text-slate-400">Email</span>
         <p>{viewOrder.customer_email}</p>
        </div>
        <div>
         <span className="text-slate-400">Amount</span>
         <p className="font-bold text-lg">৳{viewOrder.total_bdt.toLocaleString()}</p>
        </div>
        <div>
         <span className="text-slate-400">Payment</span>
         <p className="capitalize">{viewOrder.payment_method}</p>
        </div>
        <div>
         <span className="text-slate-400">Hosting</span>
         <p>{viewOrder.needs_hosting ? 'Yes' : 'No'}</p>
        </div>
       </div>
       {viewOrder.company && (
        <div className="text-sm">
         <span className="text-slate-400">Company</span>
         <p>{viewOrder.company}</p>
        </div>
       )}
       {viewOrder.notes && (
        <div className="text-sm">
         <span className="text-slate-400">Notes</span>
         <p className="bg-slate-700/50 p-3 rounded-lg mt-1">{viewOrder.notes}</p>
        </div>
       )}
       <div className="text-sm">
        <span className="text-slate-400">Date</span>
        <p>{new Date(viewOrder.created_at).toLocaleString()}</p>
       </div>
      </div>
     )}
    </DialogContent>
   </Dialog>
  </div>
 );
};

export default AdminOrdersPage;
