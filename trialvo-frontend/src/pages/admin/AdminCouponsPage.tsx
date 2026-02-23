import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Tag, Copy, Calendar, Percent, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
 Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
 AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
 AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
 useAdminCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon, Coupon,
} from '@/hooks/admin/useAdminCoupons';

interface CouponForm {
 code: string;
 type: 'percent' | 'fixed';
 value: string;
 min_order: string;
 max_uses: string;
 expires_at: string;
 is_active: boolean;
}

const emptyForm: CouponForm = {
 code: '', type: 'percent', value: '', min_order: '0', max_uses: '', expires_at: '', is_active: true,
};

const AdminCouponsPage: React.FC = () => {
 const { data: coupons, isLoading } = useAdminCoupons();
 const createCoupon = useCreateCoupon();
 const updateCoupon = useUpdateCoupon();
 const deleteCoupon = useDeleteCoupon();
 const { toast } = useToast();

 const [dialogOpen, setDialogOpen] = useState(false);
 const [editingId, setEditingId] = useState<string | null>(null);
 const [form, setForm] = useState<CouponForm>(emptyForm);
 const [deleteId, setDeleteId] = useState<string | null>(null);
 const [saving, setSaving] = useState(false);

 const openCreate = () => {
  setEditingId(null);
  setForm(emptyForm);
  setDialogOpen(true);
 };

 const openEdit = (coupon: Coupon) => {
  setEditingId(coupon.id);
  setForm({
   code: coupon.code,
   type: coupon.type,
   value: String(coupon.value),
   min_order: String(coupon.min_order || 0),
   max_uses: coupon.max_uses ? String(coupon.max_uses) : '',
   expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
   is_active: coupon.is_active,
  });
  setDialogOpen(true);
 };

 const handleSave = async () => {
  if (!form.code || !form.value) {
   toast({ title: 'Code and value are required', variant: 'destructive' });
   return;
  }
  setSaving(true);
  try {
   const payload = {
    code: form.code,
    type: form.type,
    value: parseFloat(form.value),
    min_order: parseFloat(form.min_order || '0'),
    max_uses: form.max_uses ? parseInt(form.max_uses) : null,
    expires_at: form.expires_at || null,
    is_active: form.is_active,
   };
   if (editingId) {
    await updateCoupon.mutateAsync({ id: editingId, ...payload });
    toast({ title: 'Coupon updated' });
   } else {
    await createCoupon.mutateAsync(payload);
    toast({ title: 'Coupon created' });
   }
   setDialogOpen(false);
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
  setSaving(false);
 };

 const handleDelete = async () => {
  if (!deleteId) return;
  try {
   await deleteCoupon.mutateAsync(deleteId);
   toast({ title: 'Coupon deleted' });
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
  setDeleteId(null);
 };

 const copyCode = (code: string) => {
  navigator.clipboard.writeText(code);
  toast({ title: `Copied: ${code}` });
 };

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
     <h1 className="text-xl font-bold text-foreground">Coupons</h1>
     <p className="text-sm text-muted-foreground">Manage discount codes</p>
    </div>
    <Button onClick={openCreate} className="hero-gradient text-primary-foreground gap-2 shadow-soft-sm h-9">
     <Plus className="w-4 h-4" /> Add Coupon
    </Button>
   </div>

   {/* Stats */}
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div className="rounded-xl border border-border bg-card p-3.5 text-center">
     <p className="text-lg font-bold text-foreground">{coupons?.length || 0}</p>
     <p className="text-xs text-muted-foreground">Total</p>
    </div>
    <div className="rounded-xl border border-emerald-200 bg-emerald-500/5 p-3.5 text-center">
     <p className="text-lg font-bold text-emerald-600">{coupons?.filter(c => c.is_active).length || 0}</p>
     <p className="text-xs text-muted-foreground">Active</p>
    </div>
    <div className="rounded-xl border border-amber-200 bg-amber-500/5 p-3.5 text-center">
     <p className="text-lg font-bold text-amber-600">{coupons?.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length || 0}</p>
     <p className="text-xs text-muted-foreground">Expired</p>
    </div>
    <div className="rounded-xl border border-blue-200 bg-blue-500/5 p-3.5 text-center">
     <p className="text-lg font-bold text-blue-600">{coupons?.reduce((sum, c) => sum + c.used_count, 0) || 0}</p>
     <p className="text-xs text-muted-foreground">Total Uses</p>
    </div>
   </div>

   {/* Coupons List */}
   <div className="admin-card">
    <CardContent className="p-0">
     {coupons && coupons.length > 0 ? (
      <div className="divide-y divide-border">
       {coupons.map((coupon) => {
        const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
        const isLimitReached = coupon.max_uses && coupon.used_count >= coupon.max_uses;
        return (
         <div key={coupon.id} className="flex items-center gap-4 px-5 py-4 group hover:bg-muted/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
           <Tag className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
           <div className="flex items-center gap-2">
            <button onClick={() => copyCode(coupon.code)} className="font-mono text-sm font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1" title="Copy code">
             {coupon.code}
             <Copy className="w-3 h-3 opacity-0 group-hover:opacity-50" />
            </button>
            {!coupon.is_active && <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">Inactive</Badge>}
            {isExpired && <Badge variant="outline" className="text-[10px] border-red-300 text-red-500">Expired</Badge>}
            {isLimitReached && <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600">Limit reached</Badge>}
           </div>
           <p className="text-xs text-muted-foreground mt-0.5">
            {coupon.type === 'percent' ? `${coupon.value}% off` : `৳${coupon.value} off`}
            {coupon.min_order > 0 && ` · Min ৳${coupon.min_order}`}
            {coupon.max_uses && ` · ${coupon.used_count}/${coupon.max_uses} uses`}
            {coupon.expires_at && ` · Expires ${new Date(coupon.expires_at).toLocaleDateString()}`}
           </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(coupon)}>
            <Pencil className="w-3.5 h-3.5" />
           </Button>
           <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(coupon.id)}>
            <Trash2 className="w-3.5 h-3.5" />
           </Button>
          </div>
         </div>
        );
       })}
      </div>
     ) : (
      <div className="text-center py-16 text-muted-foreground">
       <Tag className="w-10 h-10 mx-auto mb-3 opacity-40" />
       <p className="font-medium">No coupons yet</p>
       <p className="text-xs mt-1">Create your first coupon to get started</p>
      </div>
     )}
    </CardContent>
   </div>

   {/* Create/Edit Dialog */}
   <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
    <DialogContent className="bg-card border-border max-w-md">
     <DialogHeader>
      <DialogTitle className="text-foreground">{editingId ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
     </DialogHeader>
     <div className="space-y-4 mt-2">
      <div>
       <Label className="text-sm font-medium mb-1.5 block">Code</Label>
       <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SAVE20" className="font-mono bg-background border-border" />
      </div>
      <div className="grid grid-cols-2 gap-3">
       <div>
        <Label className="text-sm font-medium mb-1.5 block">Type</Label>
        <div className="flex rounded-lg border border-border overflow-hidden">
         <button
          onClick={() => setForm({ ...form, type: 'percent' })}
          className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${form.type === 'percent' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
         >
          <Percent className="w-3 h-3" /> Percent
         </button>
         <button
          onClick={() => setForm({ ...form, type: 'fixed' })}
          className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${form.type === 'fixed' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
         >
          <DollarSign className="w-3 h-3" /> Fixed
         </button>
        </div>
       </div>
       <div>
        <Label className="text-sm font-medium mb-1.5 block">Value</Label>
        <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={form.type === 'percent' ? '20' : '100'} className="bg-background border-border" />
       </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
       <div>
        <Label className="text-sm font-medium mb-1.5 block">Min Order (৳)</Label>
        <Input type="number" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} className="bg-background border-border" />
       </div>
       <div>
        <Label className="text-sm font-medium mb-1.5 block">Max Uses</Label>
        <Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited" className="bg-background border-border" />
       </div>
      </div>
      <div>
       <Label className="text-sm font-medium mb-1.5 block">Expires At</Label>
       <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="bg-background border-border" />
      </div>
      <div className="flex items-center gap-2">
       <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
       <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer">Active</Label>
      </div>
     </div>
     <DialogFooter className="mt-4">
      <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">Cancel</Button>
      <Button onClick={handleSave} className="hero-gradient text-primary-foreground" disabled={saving}>
       {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
       {editingId ? 'Update' : 'Create'}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>

   {/* Delete confirmation */}
   <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
    <AlertDialogContent className="bg-card border-border">
     <AlertDialogHeader>
      <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
      <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
     </AlertDialogHeader>
     <AlertDialogFooter>
      <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
     </AlertDialogFooter>
    </AlertDialogContent>
   </AlertDialog>
  </div>
 );
};

export default AdminCouponsPage;
