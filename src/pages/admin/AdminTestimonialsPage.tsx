import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, Search, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from '@/components/ui/dialog';
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
 useAdminTestimonials,
 useCreateTestimonial,
 useUpdateTestimonial,
 useDeleteTestimonial,
 type TestimonialRow,
} from '@/hooks/admin/useAdminTestimonials';

interface TestimonialForm {
 name: { bn: string; en: string };
 role: { bn: string; en: string };
 content: { bn: string; en: string };
 rating: number;
 avatar: string;
 is_active: boolean;
}

const emptyForm: TestimonialForm = {
 name: { bn: '', en: '' },
 role: { bn: '', en: '' },
 content: { bn: '', en: '' },
 rating: 5,
 avatar: '',
 is_active: true,
};

const AdminTestimonialsPage: React.FC = () => {
 const { toast } = useToast();
 const { data: testimonials, isLoading } = useAdminTestimonials();
 const createTestimonial = useCreateTestimonial();
 const updateTestimonial = useUpdateTestimonial();
 const deleteTestimonial = useDeleteTestimonial();

 const [search, setSearch] = useState('');
 const [deleteId, setDeleteId] = useState<string | null>(null);
 const [dialogOpen, setDialogOpen] = useState(false);
 const [editingId, setEditingId] = useState<string | null>(null);
 const [form, setForm] = useState<TestimonialForm>(emptyForm);

 const filtered = testimonials?.filter(
  (t) =>
   t.name.en.toLowerCase().includes(search.toLowerCase()) ||
   t.name.bn.includes(search)
 );

 const openCreate = () => {
  setEditingId(null);
  setForm(emptyForm);
  setDialogOpen(true);
 };

 const openEdit = (t: TestimonialRow) => {
  setEditingId(t.id);
  setForm({
   name: t.name,
   role: t.role,
   content: t.content,
   rating: t.rating,
   avatar: t.avatar,
   is_active: t.is_active,
  });
  setDialogOpen(true);
 };

 const handleSubmit = async () => {
  try {
   if (editingId) {
    await updateTestimonial.mutateAsync({ id: editingId, ...form });
    toast({ title: 'Testimonial updated' });
   } else {
    await createTestimonial.mutateAsync(form);
    toast({ title: 'Testimonial created' });
   }
   setDialogOpen(false);
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
 };

 const handleDelete = async () => {
  if (!deleteId) return;
  try {
   await deleteTestimonial.mutateAsync(deleteId);
   toast({ title: 'Testimonial deleted' });
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
  setDeleteId(null);
 };

 const handleToggleActive = async (id: string, is_active: boolean) => {
  try {
   await updateTestimonial.mutateAsync({ id, is_active });
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
 };

 return (
  <div className="space-y-6">
   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
     <h1 className="text-2xl font-bold text-white">Testimonials</h1>
     <p className="text-sm text-gray-400">Manage customer reviews</p>
    </div>
    <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
     <Plus className="w-4 h-4 mr-2" />
     Add Testimonial
    </Button>
   </div>

   <div className="relative max-w-sm">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
    <Input
     placeholder="Search testimonials..."
     value={search}
     onChange={(e) => setSearch(e.target.value)}
     className="pl-10 bg-[#161822] border-white/10 text-white placeholder:text-gray-500"
    />
   </div>

   <Card className="bg-[#161822] border-white/[0.08]">
    <CardContent className="p-0">
     {isLoading ? (
      <div className="p-6 space-y-3">
       {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 bg-white/5" />
       ))}
      </div>
     ) : (
      <div className="overflow-x-auto">
       <table className="w-full">
        <thead>
         <tr className="border-b border-white/[0.08]">
          <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Person</th>
          <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Role</th>
          <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Rating</th>
          <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Status</th>
          <th className="text-right text-xs text-gray-400 font-medium py-3 px-4">Actions</th>
         </tr>
        </thead>
        <tbody>
         {filtered?.map((t) => (
          <tr key={t.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03]">
           <td className="py-3 px-4">
            <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {t.name.en.charAt(0)}
             </div>
             <div>
              <p className="text-sm font-medium text-white">{t.name.en}</p>
              <p className="text-xs text-gray-400">{t.name.bn}</p>
             </div>
            </div>
           </td>
           <td className="py-3 px-4">
            <span className="text-sm text-gray-300">{t.role.en}</span>
           </td>
           <td className="py-3 px-4">
            <div className="flex items-center gap-0.5">
             {Array.from({ length: 5 }).map((_, i) => (
              <Star
               key={i}
               className={`w-3.5 h-3.5 ${i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'
                }`}
              />
             ))}
            </div>
           </td>
           <td className="py-3 px-4">
            <button onClick={() => handleToggleActive(t.id, !t.is_active)}>
             {t.is_active ? (
              <Badge variant="outline" className="text-[11px] border-emerald-500/20 text-emerald-400 bg-emerald-500/10">Active</Badge>
             ) : (
              <Badge variant="outline" className="text-[11px] border-white/10 text-gray-400">Inactive</Badge>
             )}
            </button>
           </td>
           <td className="py-3 px-4">
            <div className="flex items-center justify-end gap-1">
             <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white"
              onClick={() => openEdit(t)}
             >
              <Pencil className="w-4 h-4" />
             </Button>
             <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-400"
              onClick={() => setDeleteId(t.id)}
             >
              <Trash2 className="w-4 h-4" />
             </Button>
            </div>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
       {filtered?.length === 0 && (
        <div className="text-center py-12 text-gray-500">No testimonials found</div>
       )}
      </div>
     )}
    </CardContent>
   </Card>

   {/* Create/Edit Dialog */}
   <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
    <DialogContent className="bg-[#1e2030] border-white/10 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
     <DialogHeader>
      <DialogTitle>{editingId ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
     </DialogHeader>
     <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
       <div className="space-y-2">
        <Label className="text-gray-300">Name (English)</Label>
        <Input
         value={form.name.en}
         onChange={(e) => setForm({ ...form, name: { ...form.name, en: e.target.value } })}
         className="bg-white/5 border-white/10 text-white"
        />
       </div>
       <div className="space-y-2">
        <Label className="text-gray-300">Name (Bangla)</Label>
        <Input
         value={form.name.bn}
         onChange={(e) => setForm({ ...form, name: { ...form.name, bn: e.target.value } })}
         className="bg-white/5 border-white/10 text-white"
        />
       </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
       <div className="space-y-2">
        <Label className="text-gray-300">Role (English)</Label>
        <Input
         value={form.role.en}
         onChange={(e) => setForm({ ...form, role: { ...form.role, en: e.target.value } })}
         className="bg-white/5 border-white/10 text-white"
        />
       </div>
       <div className="space-y-2">
        <Label className="text-gray-300">Role (Bangla)</Label>
        <Input
         value={form.role.bn}
         onChange={(e) => setForm({ ...form, role: { ...form.role, bn: e.target.value } })}
         className="bg-white/5 border-white/10 text-white"
        />
       </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
       <div className="space-y-2">
        <Label className="text-gray-300">Content (English)</Label>
        <Textarea
         value={form.content.en}
         onChange={(e) => setForm({ ...form, content: { ...form.content, en: e.target.value } })}
         className="bg-white/5 border-white/10 text-white"
         rows={3}
        />
       </div>
       <div className="space-y-2">
        <Label className="text-gray-300">Content (Bangla)</Label>
        <Textarea
         value={form.content.bn}
         onChange={(e) => setForm({ ...form, content: { ...form.content, bn: e.target.value } })}
         className="bg-white/5 border-white/10 text-white"
         rows={3}
        />
       </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
       <div className="space-y-2">
        <Label className="text-gray-300">Rating (1–5)</Label>
        <Input
         type="number"
         min={1}
         max={5}
         value={form.rating}
         onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) || 5 })}
         className="bg-white/5 border-white/10 text-white"
        />
       </div>
       <div className="space-y-2">
        <Label className="text-gray-300">Avatar URL</Label>
        <Input
         value={form.avatar}
         onChange={(e) => setForm({ ...form, avatar: e.target.value })}
         className="bg-white/5 border-white/10 text-white"
         placeholder="https://..."
        />
       </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
       <input
        type="checkbox"
        checked={form.is_active}
        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        className="rounded border-white/10"
       />
       Active (visible on website)
      </label>

      <div className="flex justify-end gap-3 pt-4">
       <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/10 text-gray-300 hover:bg-white/5">
        Cancel
       </Button>
       <Button
        onClick={handleSubmit}
        disabled={createTestimonial.isPending || updateTestimonial.isPending}
        className="bg-primary"
       >
        {(createTestimonial.isPending || updateTestimonial.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {editingId ? 'Update' : 'Create'}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>

   {/* Delete Confirmation */}
   <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
    <AlertDialogContent className="bg-[#1e2030] border-white/10">
     <AlertDialogHeader>
      <AlertDialogTitle className="text-white">Delete Testimonial</AlertDialogTitle>
      <AlertDialogDescription className="text-gray-400">
       Are you sure? This action cannot be undone.
      </AlertDialogDescription>
     </AlertDialogHeader>
     <AlertDialogFooter>
      <AlertDialogCancel className="border-white/10 text-gray-300 hover:bg-white/5">Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
     </AlertDialogFooter>
    </AlertDialogContent>
   </AlertDialog>
  </div>
 );
};

export default AdminTestimonialsPage;
