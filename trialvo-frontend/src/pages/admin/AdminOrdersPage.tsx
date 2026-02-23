import React, { useState, useMemo } from 'react';
import {
 Search, Eye, Package, CheckSquare, Square, Download,
 ArrowUpRight, Clock, MessageSquare, StickyNote, X,
 Truck, CreditCard, ChevronDown, Send, Trash2, Filter,
 Loader2, CheckCircle2, XCircle, AlertCircle, CircleDot,
 Calendar,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
 Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
 DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
 useAdminOrders, useUpdateOrderStatus, useUpdateOrder,
 useBulkUpdateStatus, useOrderTimeline, useOrderNotes,
 useAddOrderNote, useDeleteOrderNote, useExportOrders,
 type Order, type TimelineEntry, type AdminNote,
} from '@/hooks/admin/useAdminOrders';

// ─── Constants ───────────────────────────────────────────
const statusOptions = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];

const statusConfig: Record<string, { label: string; class: string; icon: React.ElementType }> = {
 pending: { label: 'Pending', class: 'admin-badge admin-badge-pending', icon: Clock },
 confirmed: { label: 'Confirmed', class: 'admin-badge admin-badge-confirmed', icon: CheckCircle2 },
 processing: { label: 'Processing', class: 'admin-badge admin-badge-processing', icon: Loader2 },
 completed: { label: 'Completed', class: 'admin-badge admin-badge-completed', icon: CheckCircle2 },
 cancelled: { label: 'Cancelled', class: 'admin-badge admin-badge-cancelled', icon: XCircle },
};

// ─── Page ────────────────────────────────────────────────
const AdminOrdersPage: React.FC = () => {
 const { toast } = useToast();
 const { data: orders, isLoading } = useAdminOrders();
 const updateStatus = useUpdateOrderStatus();
 const updateOrder = useUpdateOrder();
 const bulkUpdate = useBulkUpdateStatus();
 const exportOrders = useExportOrders();

 const [search, setSearch] = useState('');
 const [statusFilter, setStatusFilter] = useState('all');
 const [dateFrom, setDateFrom] = useState('');
 const [dateTo, setDateTo] = useState('');
 const [selected, setSelected] = useState<Set<string>>(new Set());
 const [viewOrder, setViewOrder] = useState<Order | null>(null);
 const [detailTab, setDetailTab] = useState<'details' | 'timeline' | 'notes'>('details');

 // Editable fields in dialog
 const [editTracking, setEditTracking] = useState('');
 const [editDiscount, setEditDiscount] = useState('');

 // Filtered orders
 const filtered = useMemo(() => {
  if (!orders) return [];
  return orders.filter((o) => {
   const matchesSearch =
    o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    o.order_id.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_email.toLowerCase().includes(search.toLowerCase());
   const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
   const matchesFrom = !dateFrom || new Date(o.created_at) >= new Date(dateFrom);
   const matchesTo = !dateTo || new Date(o.created_at) <= new Date(dateTo + 'T23:59:59');
   return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  });
 }, [orders, search, statusFilter, dateFrom, dateTo]);

 // Stats
 const stats = useMemo(() => {
  if (!orders) return { total: 0, pending: 0, completed: 0, cancelled: 0 };
  return {
   total: orders.length,
   pending: orders.filter(o => o.status === 'pending').length,
   completed: orders.filter(o => o.status === 'completed').length,
   cancelled: orders.filter(o => o.status === 'cancelled').length,
  };
 }, [orders]);

 // Selection
 const toggleSelect = (id: string) => {
  setSelected(prev => {
   const next = new Set(prev);
   if (next.has(id)) next.delete(id); else next.add(id);
   return next;
  });
 };
 const selectAll = () => {
  if (!filtered) return;
  if (selected.size === filtered.length) {
   setSelected(new Set());
  } else {
   setSelected(new Set(filtered.map(o => o.id)));
  }
 };
 const allSelected = filtered.length > 0 && selected.size === filtered.length;

 // Bulk actions
 const handleBulkStatus = async (status: string) => {
  const ids = Array.from(selected);
  try {
   await bulkUpdate.mutateAsync({ ids, status });
   toast({ title: `${ids.length} orders updated to ${status}` });
   setSelected(new Set());
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
 };

 // Status update
 const handleStatusChange = async (id: string, status: string) => {
  try {
   await updateStatus.mutateAsync({ id, status });
   toast({ title: 'Status updated' });
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
 };

 // Save order details
 const handleSaveDetails = async () => {
  if (!viewOrder) return;
  try {
   await updateOrder.mutateAsync({
    id: viewOrder.id,
    tracking_number: editTracking || null,
    discount_amount: Number(editDiscount) || 0,
   });
   toast({ title: 'Order details saved' });
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
 };

 // Export
 const handleExport = async () => {
  try {
   await exportOrders.mutateAsync({ status: statusFilter !== 'all' ? statusFilter : undefined, from: dateFrom || undefined, to: dateTo || undefined });
   toast({ title: 'Export started — check downloads' });
  } catch (err: any) {
   toast({ title: 'Export failed', description: err.message, variant: 'destructive' });
  }
 };

 // Open order dialog
 const openOrder = (order: Order) => {
  setViewOrder(order);
  setDetailTab('details');
  setEditTracking(order.tracking_number || '');
  setEditDiscount(String(order.discount_amount || 0));
 };

 const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
 const getInitialColor = (name: string) => {
  const colors = ['bg-violet-500/15 text-violet-500', 'bg-blue-500/15 text-blue-500', 'bg-emerald-500/15 text-emerald-500', 'bg-amber-500/15 text-amber-500', 'bg-rose-500/15 text-rose-500', 'bg-cyan-500/15 text-cyan-500'];
  return colors[name.charCodeAt(0) % colors.length];
 };

 return (
  <div className="space-y-5 animate-fade-in">
   {/* Header */}
   <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
    <div className="admin-page-header">
     <h1>Orders</h1>
     <p>Manage customer orders and track fulfillment</p>
    </div>
    <div className="flex items-center gap-2 flex-wrap">
     <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
      <span className="text-[11px] text-muted-foreground font-medium">Total</span>
      <span className="text-sm font-bold">{stats.total}</span>
     </div>
     <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
      <span className="text-[11px] text-amber-600 font-medium">Pending</span>
      <span className="text-sm font-bold text-amber-600">{stats.pending}</span>
     </div>
     <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
      <span className="text-[11px] text-emerald-600 font-medium">Completed</span>
      <span className="text-sm font-bold text-emerald-600">{stats.completed}</span>
     </div>
     <Button variant="outline" size="sm" onClick={handleExport} disabled={exportOrders.isPending} className="h-8 text-xs border-border text-foreground hover:bg-muted">
      <Download className="w-3.5 h-3.5 mr-1.5" />
      Export CSV
     </Button>
    </div>
   </div>

   {/* Search, Filters, Date Range */}
   <div className="flex flex-col md:flex-row gap-3">
    <div className="admin-search flex-1 max-w-sm">
     <Search />
     <Input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
    </div>
    <div className="flex items-center gap-1.5 flex-wrap">
     {['all', ...statusOptions].map((s) => (
      <button
       key={s}
       onClick={() => setStatusFilter(s)}
       className={`admin-filter-pill ${statusFilter === s ? 'active' : ''}`}
      >
       {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
      </button>
     ))}
    </div>
   </div>

   {/* Date Range Filter */}
   <div className="flex items-center gap-2 flex-wrap">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
     <Calendar className="w-3.5 h-3.5" />
     <span>Date Range:</span>
    </div>
    <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 w-36 text-xs bg-background border-border text-foreground" />
    <span className="text-xs text-muted-foreground">to</span>
    <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 w-36 text-xs bg-background border-border text-foreground" />
    {(dateFrom || dateTo) && (
     <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => { setDateFrom(''); setDateTo(''); }}>
      Clear
     </Button>
    )}
   </div>

   {/* Bulk Action Bar */}
   {selected.size > 0 && (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
     <span className="text-sm font-semibold text-primary">{selected.size} selected</span>
     <div className="flex items-center gap-1.5 ml-auto">
      <Button size="sm" variant="outline" className="h-7 text-xs border-amber-500/30 text-amber-600 hover:bg-amber-500/10" onClick={() => handleBulkStatus('confirmed')}>
       Mark Confirmed
      </Button>
      <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10" onClick={() => handleBulkStatus('completed')}>
       Mark Completed
      </Button>
      <Button size="sm" variant="outline" className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleBulkStatus('cancelled')}>
       Mark Cancelled
      </Button>
      <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setSelected(new Set())}>
       <X className="w-3.5 h-3.5" />
      </Button>
     </div>
    </div>
   )}

   {/* Table */}
   <div className="admin-card">
    {isLoading ? (
     <div className="p-5 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 bg-muted" />)}
     </div>
    ) : (
     <>
      {/* Mobile Cards */}
      <div className="md:hidden p-3 space-y-2">
       {filtered.map(order => (
        <div key={order.id} className="rounded-xl border border-border p-4 space-y-3">
         <div className="flex items-center gap-3">
          <button onClick={() => toggleSelect(order.id)} className="flex-shrink-0">
           {selected.has(order.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground/40" />}
          </button>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${getInitialColor(order.customer_name)}`}>
           {getInitials(order.customer_name)}
          </div>
          <div className="min-w-0 flex-1">
           <p className="text-sm font-semibold text-foreground truncate">{order.customer_name}</p>
           <p className="text-[11px] text-muted-foreground">{order.order_id}</p>
          </div>
          <span className={statusConfig[order.status]?.class || 'admin-badge'}>{order.status}</span>
         </div>
         <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>৳{order.total_bdt.toLocaleString()}</span>
          <span>{new Date(order.created_at).toLocaleDateString()}</span>
         </div>
         <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/30">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openOrder(order)}>
           <Eye className="w-3.5 h-3.5 mr-1" /> View
          </Button>
         </div>
        </div>
       ))}
       {filtered.length === 0 && (
        <div className="admin-empty"><Package /><p>No orders found</p></div>
       )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
       <table className="w-full">
        <thead>
         <tr className="admin-table-header">
          <th className="w-10">
           <button onClick={selectAll} className="flex items-center justify-center">
            {allSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground/40" />}
           </button>
          </th>
          <th>Customer</th>
          <th>Order</th>
          <th>Amount</th>
          <th>Status</th>
          <th className="hidden lg:table-cell">Date</th>
          <th className="text-right">Actions</th>
         </tr>
        </thead>
        <tbody>
         {filtered.map(order => {
          const sc = statusConfig[order.status];
          return (
           <tr key={order.id} className={`admin-table-row group cursor-pointer ${selected.has(order.id) ? 'bg-primary/[0.03]' : ''}`} onClick={() => openOrder(order)}>
            <td onClick={e => { e.stopPropagation(); toggleSelect(order.id); }}>
             {selected.has(order.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60" />}
            </td>
            <td>
             <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${getInitialColor(order.customer_name)}`}>
               {getInitials(order.customer_name)}
              </div>
              <div>
               <p className="text-sm font-semibold text-foreground">{order.customer_name}</p>
               <p className="text-[11px] text-muted-foreground/70 mt-0.5">{order.customer_email}</p>
              </div>
             </div>
            </td>
            <td>
             <p className="text-sm font-medium text-foreground">{order.order_id}</p>
             {order.products?.name && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[150px]">{order.products.name.en}</p>
             )}
            </td>
            <td>
             <div>
              <p className="text-sm font-semibold text-foreground">৳{order.total_bdt.toLocaleString()}</p>
              {order.discount_amount > 0 && (
               <p className="text-[10px] text-emerald-500">-৳{order.discount_amount} discount</p>
              )}
             </div>
            </td>
            <td>
             <span className={sc?.class || 'admin-badge'}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
              {sc?.label || order.status}
             </span>
            </td>
            <td className="hidden lg:table-cell">
             <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
             {order.tracking_number && (
              <p className="text-[10px] text-primary mt-0.5 flex items-center gap-1"><Truck className="w-3 h-3" />{order.tracking_number}</p>
             )}
            </td>
            <td onClick={e => e.stopPropagation()}>
             <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
               <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                 Status <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="bg-card border-border min-w-[140px]">
                {statusOptions.map(s => (
                 <DropdownMenuItem key={s} onClick={() => handleStatusChange(order.id, s)} className="text-foreground hover:bg-accent text-xs capitalize">
                  {s}
                 </DropdownMenuItem>
                ))}
               </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => openOrder(order)}>
               <Eye className="w-3.5 h-3.5" />
              </Button>
             </div>
            </td>
           </tr>
          );
         })}
        </tbody>
       </table>
       {filtered.length === 0 && (
        <div className="admin-empty"><Package /><p>No orders found</p></div>
       )}
      </div>
     </>
    )}
   </div>

   {/* ──────────── Order Detail Dialog ──────────── */}
   <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
    <DialogContent className="bg-card border-border shadow-soft-xl max-w-2xl w-[95vw] sm:w-full max-h-[85vh] overflow-y-auto">
     <DialogHeader className="border-b border-border pb-4">
      <div className="flex items-center gap-3">
       {viewOrder && (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getInitialColor(viewOrder.customer_name)}`}>
         {getInitials(viewOrder.customer_name)}
        </div>
       )}
       <div>
        <DialogTitle className="text-foreground text-base">{viewOrder?.order_id}</DialogTitle>
        <p className="text-xs text-muted-foreground mt-0.5">{viewOrder?.customer_name}</p>
       </div>
       {viewOrder && <span className={`ml-auto ${statusConfig[viewOrder.status]?.class}`}>{viewOrder.status}</span>}
      </div>
     </DialogHeader>

     {viewOrder && (
      <>
       {/* Tab Switcher */}
       <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border w-fit mt-2">
        {([
         { key: 'details', label: 'Details', icon: Eye },
         { key: 'timeline', label: 'Timeline', icon: Clock },
         { key: 'notes', label: 'Notes', icon: StickyNote },
        ] as const).map(tab => (
         <button
          key={tab.key}
          onClick={() => setDetailTab(tab.key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${detailTab === tab.key ? 'bg-card text-foreground shadow-soft-sm' : 'text-muted-foreground hover:text-foreground'}`}
         >
          <tab.icon className="w-3.5 h-3.5" />
          {tab.label}
         </button>
        ))}
       </div>

       {/* Details Tab */}
       {detailTab === 'details' && (
        <div className="space-y-5 mt-3">
         {/* Customer & Order Info Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="admin-section p-4">
           <h4 className="admin-section-title mb-3">Customer Information</h4>
           <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground text-xs">Name</span><span className="text-foreground font-medium text-xs">{viewOrder.customer_name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground text-xs">Email</span><span className="text-foreground font-medium text-xs truncate max-w-[160px]">{viewOrder.customer_email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground text-xs">Phone</span><span className="text-foreground font-medium text-xs">{viewOrder.customer_phone}</span></div>
            {viewOrder.company && <div className="flex justify-between"><span className="text-muted-foreground text-xs">Company</span><span className="text-foreground font-medium text-xs">{viewOrder.company}</span></div>}
           </div>
          </div>
          <div className="admin-section p-4">
           <h4 className="admin-section-title mb-3">Billing</h4>
           <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground text-xs">Amount</span><span className="text-foreground font-bold text-xs">৳{viewOrder.total_bdt.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground text-xs">Discount</span><span className="text-emerald-500 font-medium text-xs">৳{viewOrder.discount_amount || 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground text-xs">Payment</span><span className="text-foreground font-medium text-xs capitalize">{viewOrder.payment_method}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground text-xs">Hosting</span><span className="text-foreground font-medium text-xs">{viewOrder.needs_hosting ? 'Yes' : 'No'}</span></div>
           </div>
          </div>
         </div>

         {/* Editable Fields */}
         <div className="admin-section p-4">
          <h4 className="admin-section-title mb-3">Tracking & Discount</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
           <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Tracking Number</Label>
            <Input value={editTracking} onChange={e => setEditTracking(e.target.value)} className="bg-background border-border text-foreground h-9 text-sm" placeholder="e.g. TRK-12345" />
           </div>
           <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Discount (BDT)</Label>
            <Input type="number" value={editDiscount} onChange={e => setEditDiscount(e.target.value)} className="bg-background border-border text-foreground h-9 text-sm" />
           </div>
          </div>
          <Button size="sm" onClick={handleSaveDetails} disabled={updateOrder.isPending} className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs shadow-soft-sm">
           {updateOrder.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
           Save Changes
          </Button>
         </div>

         {/* Notes */}
         {viewOrder.notes && (
          <div className="admin-section p-4">
           <h4 className="admin-section-title mb-2">Customer Notes</h4>
           <p className="text-sm text-foreground/80 whitespace-pre-wrap">{viewOrder.notes}</p>
          </div>
         )}

         {/* Quick Status Update */}
         <div className="admin-section p-4">
          <h4 className="admin-section-title mb-3">Update Status</h4>
          <div className="flex items-center gap-1.5 flex-wrap">
           {statusOptions.map(s => (
            <button
             key={s}
             onClick={() => handleStatusChange(viewOrder.id, s)}
             className={`admin-filter-pill ${viewOrder.status === s ? 'active' : ''}`}
            >
             {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
           ))}
          </div>
         </div>
        </div>
       )}

       {/* Timeline Tab */}
       {detailTab === 'timeline' && <OrderTimelineTab orderId={viewOrder.id} />}

       {/* Notes Tab */}
       {detailTab === 'notes' && <OrderNotesTab orderId={viewOrder.id} />}
      </>
     )}
    </DialogContent>
   </Dialog>
  </div>
 );
};

// ─── Timeline Tab Component ──────────────────────────
const OrderTimelineTab: React.FC<{ orderId: string }> = ({ orderId }) => {
 const { data: timeline, isLoading } = useOrderTimeline(orderId);

 if (isLoading) return <div className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 bg-muted" />)}</div>;

 return (
  <div className="mt-3 space-y-0">
   {(!timeline || timeline.length === 0) && (
    <div className="admin-empty py-8"><Clock /><p>No timeline entries yet</p></div>
   )}
   {timeline?.map((entry, i) => (
    <div key={entry.id} className="flex gap-3 relative">
     {/* Vertical line */}
     {i < timeline.length - 1 && <div className="absolute left-[15px] top-8 w-px h-[calc(100%-8px)] bg-border" />}
     {/* Dot */}
     <div className="w-[30px] flex-shrink-0 flex items-start justify-center pt-1">
      <div className={`w-3 h-3 rounded-full border-2 ${entry.to_status === 'completed' ? 'bg-emerald-500 border-emerald-500/30' : entry.to_status === 'cancelled' ? 'bg-red-500 border-red-500/30' : 'bg-primary border-primary/30'}`} />
     </div>
     <div className="pb-4 flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
       <span className="text-sm font-semibold text-foreground capitalize">{entry.to_status}</span>
       {entry.from_status && (
        <span className="text-[10px] text-muted-foreground">from <span className="capitalize">{entry.from_status}</span></span>
       )}
      </div>
      <p className="text-[11px] text-muted-foreground mt-0.5">
       {new Date(entry.created_at).toLocaleString()} · by {entry.changed_by}
      </p>
      {entry.comment && (
       <p className="text-xs text-foreground/70 mt-1 bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/50">{entry.comment}</p>
      )}
     </div>
    </div>
   ))}
  </div>
 );
};

// ─── Notes Tab Component ─────────────────────────────
const OrderNotesTab: React.FC<{ orderId: string }> = ({ orderId }) => {
 const { data: notes, isLoading } = useOrderNotes(orderId);
 const addNote = useAddOrderNote();
 const deleteNote = useDeleteOrderNote();
 const { toast } = useToast();
 const [newNote, setNewNote] = useState('');

 const handleAdd = async () => {
  if (!newNote.trim()) return;
  try {
   await addNote.mutateAsync({ orderId, note: newNote.trim() });
   setNewNote('');
   toast({ title: 'Note added' });
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
 };

 const handleDelete = async (noteId: string) => {
  try {
   await deleteNote.mutateAsync({ noteId });
   toast({ title: 'Note deleted' });
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
 };

 if (isLoading) return <div className="p-4 space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 bg-muted" />)}</div>;

 return (
  <div className="mt-3 space-y-4">
   {/* Add Note */}
   <div className="flex gap-2">
    <Textarea
     value={newNote}
     onChange={e => setNewNote(e.target.value)}
     placeholder="Add an internal note..."
     className="bg-background border-border text-foreground text-sm flex-1 min-h-[60px] resize-none"
     rows={2}
    />
    <Button size="sm" onClick={handleAdd} disabled={addNote.isPending || !newNote.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 h-auto self-end px-3 shadow-soft-sm">
     {addNote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
    </Button>
   </div>

   {/* Notes List */}
   {(!notes || notes.length === 0) && (
    <div className="admin-empty py-6"><StickyNote /><p>No notes yet</p></div>
   )}
   {notes?.map(note => (
    <div key={note.id} className="admin-section p-3 group">
     <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
       <p className="text-sm text-foreground whitespace-pre-wrap">{note.note}</p>
       <p className="text-[10px] text-muted-foreground mt-1.5">
        {new Date(note.created_at).toLocaleString()} · {note.created_by}
       </p>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={() => handleDelete(note.id)}>
       <Trash2 className="w-3.5 h-3.5" />
      </Button>
     </div>
    </div>
   ))}
  </div>
 );
};

export default AdminOrdersPage;
