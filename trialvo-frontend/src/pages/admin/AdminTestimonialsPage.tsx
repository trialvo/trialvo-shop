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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Testimonials</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage customer reviews</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 shadow-soft-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Testimonial
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search testimonials..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/25"
        />
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
                {filtered?.map((t) => (
                  <div key={t.id} className="rounded-xl border border-border bg-muted/20 p-4 space-y-4 shadow-soft-sm hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {t.name.en.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{t.name.en}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.role.en}</p>
                      </div>
                      <button onClick={() => handleToggleActive(t.id, !t.is_active)}>
                        {t.is_active ? (
                          <Badge variant="outline" className="text-[10px] font-semibold tracking-wide uppercase border-success/30 text-success bg-success/10">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-semibold tracking-wide uppercase border-border text-muted-foreground bg-muted/50">Inactive</Badge>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < t.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" onClick={() => openEdit(t)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => setDeleteId(t.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filtered?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground font-medium">No testimonials found</div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider py-4 px-5">Person</th>
                      <th className="text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider py-4 px-5">Role</th>
                      <th className="text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider py-4 px-5">Rating</th>
                      <th className="text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider py-4 px-5">Status</th>
                      <th className="text-right text-xs text-muted-foreground font-semibold uppercase tracking-wider py-4 px-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered?.map((t) => (
                      <tr key={t.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {t.name.en.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{t.name.en}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{t.name.bn}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-sm text-foreground/80">{t.role.en}</span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < t.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'
                                  }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <button onClick={() => handleToggleActive(t.id, !t.is_active)} className="hover:opacity-80 transition-opacity">
                            {t.is_active ? (
                              <Badge variant="outline" className="text-[11px] font-semibold tracking-wide uppercase border-success/30 text-success bg-success/10">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[11px] font-semibold tracking-wide uppercase border-border text-muted-foreground bg-muted/50">Inactive</Badge>
                            )}
                          </button>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                              onClick={() => openEdit(t)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
                  <div className="text-center py-12 text-muted-foreground font-medium">No testimonials found</div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border shadow-soft-xl text-foreground max-w-2xl max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle>{editingId ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Name (English)</Label>
                <Input
                  value={form.name.en}
                  onChange={(e) => setForm({ ...form, name: { ...form.name, en: e.target.value } })}
                  className="bg-background border-border text-foreground focus:border-primary focus:ring-primary/25"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Name (Bangla)</Label>
                <Input
                  value={form.name.bn}
                  onChange={(e) => setForm({ ...form, name: { ...form.name, bn: e.target.value } })}
                  className="bg-background border-border text-foreground focus:border-primary focus:ring-primary/25"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Role (English)</Label>
                <Input
                  value={form.role.en}
                  onChange={(e) => setForm({ ...form, role: { ...form.role, en: e.target.value } })}
                  className="bg-background border-border text-foreground focus:border-primary focus:ring-primary/25"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Role (Bangla)</Label>
                <Input
                  value={form.role.bn}
                  onChange={(e) => setForm({ ...form, role: { ...form.role, bn: e.target.value } })}
                  className="bg-background border-border text-foreground focus:border-primary focus:ring-primary/25"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Content (English)</Label>
                <Textarea
                  value={form.content.en}
                  onChange={(e) => setForm({ ...form, content: { ...form.content, en: e.target.value } })}
                  className="bg-background border-border text-foreground focus:border-primary focus:ring-primary/25"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Content (Bangla)</Label>
                <Textarea
                  value={form.content.bn}
                  onChange={(e) => setForm({ ...form, content: { ...form.content, bn: e.target.value } })}
                  className="bg-background border-border text-foreground focus:border-primary focus:ring-primary/25"
                  rows={4}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Rating (1–5)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) || 5 })}
                  className="bg-background border-border text-foreground focus:border-primary focus:ring-primary/25"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Avatar URL</Label>
                <Input
                  value={form.avatar}
                  onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                  className="bg-background border-border text-foreground focus:border-primary focus:ring-primary/25"
                  placeholder="https://..."
                />
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm text-foreground cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded border-border w-4 h-4 text-primary focus:ring-primary/25 bg-background"
              />
              Active (visible on website)
            </label>

            <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border text-foreground hover:bg-muted">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createTestimonial.isPending || updateTestimonial.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft-sm"
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
