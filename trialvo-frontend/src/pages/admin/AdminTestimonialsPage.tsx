import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Star, Search, Loader2, Users } from 'lucide-react';
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

const inputClass = 'bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/25';

// Star Rating Picker Component
const StarRatingPicker: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: 5 }).map((_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => onChange(i + 1)}
        className="transition-transform hover:scale-125 focus:outline-none"
      >
        <Star className={`w-5 h-5 ${i < value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30 hover:text-amber-400/50'} transition-colors`} />
      </button>
    ))}
    <span className="text-xs text-muted-foreground ml-2 font-medium">{value}/5</span>
  </div>
);

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
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div className="admin-page-header">
          <h1>Testimonials</h1>
          <p>Manage customer reviews and feedback</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 shadow-soft-sm h-9 text-sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Testimonial
        </Button>
      </div>

      <div className="admin-search max-w-sm">
        <Search />
        <Input
          placeholder="Search testimonials..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
              {filtered?.map((t) => (
                <div key={t.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {t.name.en.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{t.name.en}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{t.role.en}</p>
                    </div>
                    <button onClick={() => handleToggleActive(t.id, !t.is_active)}>
                      <span className={`admin-badge ${t.is_active ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/30">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => openEdit(t)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(t.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {filtered?.length === 0 && (
                <div className="admin-empty">
                  <Users />
                  <p>No testimonials found</p>
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="admin-table-header">
                    <th>Person</th>
                    <th>Role</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered?.map((t) => (
                    <tr key={t.id} className="admin-table-row group">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {t.name.en.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{t.name.en}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{t.name.bn}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-foreground/80">{t.role.en}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
                          ))}
                        </div>
                      </td>
                      <td>
                        <button onClick={() => handleToggleActive(t.id, !t.is_active)} className="hover:opacity-80 transition-opacity">
                          <span className={`admin-badge ${t.is_active ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                            {t.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => openEdit(t)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(t.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered?.length === 0 && (
                <div className="admin-empty">
                  <Users />
                  <p>No testimonials found</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border shadow-soft-xl text-foreground max-w-2xl max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle>{editingId ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Name (English)</Label>
                <Input value={form.name.en} onChange={(e) => setForm({ ...form, name: { ...form.name, en: e.target.value } })} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Name (Bangla)</Label>
                <Input value={form.name.bn} onChange={(e) => setForm({ ...form, name: { ...form.name, bn: e.target.value } })} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Role (English)</Label>
                <Input value={form.role.en} onChange={(e) => setForm({ ...form, role: { ...form.role, en: e.target.value } })} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Role (Bangla)</Label>
                <Input value={form.role.bn} onChange={(e) => setForm({ ...form, role: { ...form.role, bn: e.target.value } })} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Content (English)</Label>
                <Textarea value={form.content.en} onChange={(e) => setForm({ ...form, content: { ...form.content, en: e.target.value } })} className={inputClass} rows={4} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Content (Bangla)</Label>
                <Textarea value={form.content.bn} onChange={(e) => setForm({ ...form, content: { ...form.content, bn: e.target.value } })} className={inputClass} rows={4} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">Rating</Label>
                <StarRatingPicker value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Avatar URL</Label>
                <Input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} className={inputClass} placeholder="https://..." />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded border-border w-4 h-4 text-primary focus:ring-primary/25 bg-background"
              />
              Active (visible on website)
            </label>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border text-foreground hover:bg-muted h-9">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={createTestimonial.isPending || updateTestimonial.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft-sm h-9">
                {(createTestimonial.isPending || updateTestimonial.isPending) && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border shadow-soft-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Testimonial</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground bg-transparent hover:bg-muted">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:opacity-90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTestimonialsPage;
