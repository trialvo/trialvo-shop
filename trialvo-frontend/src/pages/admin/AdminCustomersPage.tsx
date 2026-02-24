import React, { useState } from 'react';
import { Users, Loader2, Search, Mail, Phone, ShoppingCart, Calendar, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Customer {
 id: string;
 name: string;
 email: string;
 phone: string | null;
 is_verified: boolean;
 created_at: string;
 total_orders: number;
 total_spent: number;
}

const AdminCustomersPage: React.FC = () => {
 const [search, setSearch] = useState('');
 const [selectedId, setSelectedId] = useState<string | null>(null);

 const { data: customers, isLoading } = useQuery({
  queryKey: ['admin', 'customers'],
  queryFn: () => api.get<Customer[]>('/admin/customers'),
 });

 const { data: detail } = useQuery({
  queryKey: ['admin', 'customer', selectedId],
  queryFn: () => api.get<any>(`/admin/customers/${selectedId}`),
  enabled: !!selectedId,
 });

 const filtered = customers?.filter(c =>
  c.name.toLowerCase().includes(search.toLowerCase()) ||
  c.email.toLowerCase().includes(search.toLowerCase()) ||
  c.phone?.includes(search)
 );

 if (isLoading) {
  return (
   <div className="flex items-center justify-center py-20">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
   </div>
  );
 }

 return (
  <div className="space-y-5 animate-fade-in">
   <div className="flex items-center justify-between">
    <div>
     <h1 className="text-xl font-bold text-foreground">Customers</h1>
     <p className="text-sm text-muted-foreground">{customers?.length || 0} registered customers</p>
    </div>
   </div>

   {/* Stats */}
   <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    <div className="rounded-xl border border-border bg-card p-3.5 text-center">
     <p className="text-lg font-bold text-foreground">{customers?.length || 0}</p>
     <p className="text-xs text-muted-foreground">Total Customers</p>
    </div>
    <div className="rounded-xl border border-emerald-200 bg-emerald-500/5 p-3.5 text-center">
     <p className="text-lg font-bold text-emerald-600">{customers?.reduce((s, c) => s + c.total_orders, 0) || 0}</p>
     <p className="text-xs text-muted-foreground">Total Orders</p>
    </div>
    <div className="rounded-xl border border-blue-200 bg-blue-500/5 p-3.5 text-center">
     <p className="text-lg font-bold text-blue-600">৳{(customers?.reduce((s, c) => s + Number(c.total_spent), 0) || 0).toLocaleString()}</p>
     <p className="text-xs text-muted-foreground">Total Revenue</p>
    </div>
   </div>

   {/* Search */}
   <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, phone..." className="pl-9 bg-background border-border" />
   </div>

   {/* Customer List */}
   <div className="admin-card">
    <div className="divide-y divide-border">
     {filtered && filtered.length > 0 ? filtered.map(c => (
      <div key={c.id} className="flex items-center gap-4 px-5 py-4 group hover:bg-muted/30 transition-colors">
       <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-primary-foreground">{c.name.charAt(0).toUpperCase()}</span>
       </div>
       <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
         <span className="font-medium text-sm text-foreground">{c.name}</span>
         {c.is_verified && <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600">Verified</Badge>}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
         <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>
         {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
        </div>
       </div>
       <div className="text-right hidden sm:block">
        <p className="text-sm font-medium text-foreground">{c.total_orders} orders</p>
        <p className="text-xs text-muted-foreground">৳{Number(c.total_spent).toLocaleString()}</p>
       </div>
       <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => setSelectedId(c.id)}>
        <Eye className="w-4 h-4" />
       </Button>
      </div>
     )) : (
      <div className="py-16 text-center text-muted-foreground">
       <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
       <p className="font-medium">No customers found</p>
      </div>
     )}
    </div>
   </div>

   {/* Detail Dialog */}
   <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
    <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
     <DialogHeader>
      <DialogTitle>Customer Details</DialogTitle>
     </DialogHeader>
     {detail && (
      <div className="space-y-4 mt-2">
       <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl hero-gradient flex items-center justify-center">
         <span className="text-lg font-bold text-primary-foreground">{detail.customer.name.charAt(0).toUpperCase()}</span>
        </div>
        <div>
         <p className="font-bold text-foreground">{detail.customer.name}</p>
         <p className="text-sm text-muted-foreground">{detail.customer.email}</p>
         {detail.customer.phone && <p className="text-xs text-muted-foreground">{detail.customer.phone}</p>}
        </div>
       </div>
       <div className="text-xs text-muted-foreground flex items-center gap-1">
        <Calendar className="w-3 h-3" /> Joined {new Date(detail.customer.created_at).toLocaleDateString()}
       </div>

       <div className="border-t border-border pt-3">
        <h4 className="text-sm font-semibold mb-2">Orders ({detail.orders?.length || 0})</h4>
        {detail.orders?.length > 0 ? (
         <div className="space-y-2 max-h-60 overflow-y-auto">
          {detail.orders.map((o: any) => (
           <div key={o.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border">
            <div>
             <p className="text-xs font-mono font-bold text-foreground">{o.order_id}</p>
             <p className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
             <p className="text-xs font-medium">৳{Number(o.total_bdt).toLocaleString()}</p>
             <Badge variant="outline" className="text-[10px]">{o.status}</Badge>
            </div>
           </div>
          ))}
         </div>
        ) : (
         <p className="text-xs text-muted-foreground">No orders yet</p>
        )}
       </div>
      </div>
     )}
    </DialogContent>
   </Dialog>
  </div>
 );
};

export default AdminCustomersPage;
