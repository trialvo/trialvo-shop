import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  useAdminCategories,
  useCategoryMutations,
  type Category,
} from '@/hooks/useCategories';

interface CategoryForm {
  slug: string;
  name: { bn: string; en: string };
  description: { bn: string; en: string };
  icon: string;
  is_active: boolean;
}

const emptyForm: CategoryForm = {
  slug: '',
  name: { bn: '', en: '' },
  description: { bn: '', en: '' },
  icon: '',
  is_active: true,
};

const inputClass =
  'bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/25';

// Available icon names map to lucide icons the storefront CategoriesSection knows.
const KNOWN_ICONS = ['ShoppingCart', 'Shirt', 'Gift', 'Watch', 'Smartphone'];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const AdminCategoriesPage: React.FC = () => {
  const { toast } = useToast();
  const { data: categories, isLoading } = useAdminCategories();
  const { create, update, remove } = useCategoryMutations();

  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);

  const filtered = categories?.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.slug.toLowerCase().includes(q) ||
      (c.name?.en || '').toLowerCase().includes(q) ||
      (c.name?.bn || '').includes(search)
    );
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditingId(c.id);
    setForm({
      slug: c.slug,
      name: { bn: c.name?.bn || '', en: c.name?.en || '' },
      description: { bn: c.description?.bn || '', en: c.description?.en || '' },
      icon: c.icon || '',
      is_active: Boolean(c.is_active),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.slug.trim()) {
      toast({ title: 'Slug is required', variant: 'destructive' });
      return;
    }
    if (!form.name.en.trim() && !form.name.bn.trim()) {
      toast({ title: 'Name (English or Bangla) is required', variant: 'destructive' });
      return;
    }
    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, input: form });
        toast({ title: 'Category updated' });
      } else {
        await create.mutateAsync(form);
        toast({ title: 'Category created' });
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      toast({ title: 'Category deleted' });
    } catch (err: any) {
      toast({ title: 'Cannot delete', description: err.message, variant: 'destructive' });
    }
    setDeleteId(null);
  };

  const handleToggleActive = async (c: Category) => {
    try {
      await update.mutateAsync({ id: c.id, input: { is_active: !c.is_active } });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div className="admin-page-header">
          <h1>Categories</h1>
          <p>Manage product categories shown across the storefront</p>
        </div>
        <Button onClick={openCreate} className="hero-gradient text-white hover:opacity-90 border-0 shadow-soft-sm h-9 text-sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Category
        </Button>
      </div>

      <div className="admin-search max-w-sm">
        <Search />
        <Input
          placeholder="Search categories..."
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="admin-table-header">
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((c) => (
                  <tr key={c.id} className="admin-table-row group">
                    <td>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{c.name?.en || c.slug}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{c.name?.bn}</p>
                      </div>
                    </td>
                    <td>
                      <code className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{c.slug}</code>
                    </td>
                    <td>
                      <span className="text-sm text-foreground/80">{c.product_count ?? 0}</span>
                    </td>
                    <td>
                      <button onClick={() => handleToggleActive(c)} className="hover:opacity-80 transition-opacity">
                        <span className={`admin-badge ${c.is_active ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => openEdit(c)} title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(c.id)} title="Delete">
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
                <Tags />
                <p>No categories found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border shadow-soft-xl text-foreground max-w-2xl max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle>{editingId ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Name (English)</Label>
                <Input
                  value={form.name.en}
                  onChange={(e) => {
                    const en = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name: { ...f.name, en },
                      // Auto-suggest slug from English name only while creating.
                      slug: !editingId && (!f.slug || f.slug === slugify(f.name.en)) ? slugify(en) : f.slug,
                    }));
                  }}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Name (Bangla)</Label>
                <Input value={form.name.bn} onChange={(e) => setForm({ ...form, name: { ...form.name, bn: e.target.value } })} className={inputClass} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium">Slug (URL identifier)</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} className={inputClass} placeholder="e.g. fashion" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Description (English)</Label>
                <Textarea value={form.description.en} onChange={(e) => setForm({ ...form, description: { ...form.description, en: e.target.value } })} className={inputClass} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Description (Bangla)</Label>
                <Textarea value={form.description.bn} onChange={(e) => setForm({ ...form, description: { ...form.description, bn: e.target.value } })} className={inputClass} rows={3} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium">Icon</Label>
              <select
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className={`w-full h-9 rounded-md border px-3 text-sm ${inputClass}`}
              >
                <option value="">Default (ShoppingCart)</option>
                {KNOWN_ICONS.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
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
              <Button onClick={handleSubmit} disabled={create.isPending || update.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft-sm h-9">
                {(create.isPending || update.isPending) && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
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
            <AlertDialogTitle className="text-foreground">Delete Category</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure? Categories still used by products cannot be deleted.
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

export default AdminCategoriesPage;
