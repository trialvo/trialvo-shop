import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
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
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
 useAdminProducts,
 useCreateProduct,
 useUpdateProduct,
 useDeleteProduct
} from '@/hooks/admin/useAdminProducts';

interface ProductFormData {
 slug: string;
 category: string;
 price_bdt: number;
 price_usd: number;
 thumbnail: string;
 name: { bn: string; en: string };
 short_description: { bn: string; en: string };
 is_featured: boolean;
 is_active: boolean;
}

const emptyForm: ProductFormData = {
 slug: '',
 category: 'ecommerce',
 price_bdt: 0,
 price_usd: 0,
 thumbnail: '',
 name: { bn: '', en: '' },
 short_description: { bn: '', en: '' },
 is_featured: false,
 is_active: true,
};

const AdminProductsPage: React.FC = () => {
 const { toast } = useToast();
 const { data: products, isLoading } = useAdminProducts();
 const createProduct = useCreateProduct();
 const updateProduct = useUpdateProduct();
 const deleteProduct = useDeleteProduct();

 const [search, setSearch] = useState('');
 const [deleteId, setDeleteId] = useState<string | null>(null);
 const [dialogOpen, setDialogOpen] = useState(false);
 const [editingId, setEditingId] = useState<string | null>(null);
 const [form, setForm] = useState<ProductFormData>(emptyForm);

 const filtered = products?.filter(
  (p) =>
   p.name.en.toLowerCase().includes(search.toLowerCase()) ||
   p.name.bn.includes(search) ||
   p.category.includes(search.toLowerCase())
 );

 const openCreate = () => {
  setEditingId(null);
  setForm(emptyForm);
  setDialogOpen(true);
 };

 const openEdit = (product: any) => {
  setEditingId(product.id);
  setForm({
   slug: product.slug,
   category: product.category,
   price_bdt: product.priceBDT,
   price_usd: product.priceUSD,
   thumbnail: product.thumbnail,
   name: product.name,
   short_description: product.shortDescription,
   is_featured: product.isFeatured,
   is_active: product.isActive,
  });
  setDialogOpen(true);
 };

 const handleSubmit = async () => {
  try {
   if (editingId) {
    await updateProduct.mutateAsync({ id: editingId, ...form });
    toast({ title: 'Product updated successfully' });
   } else {
    await createProduct.mutateAsync(form as any);
    toast({ title: 'Product created successfully' });
   }
   setDialogOpen(false);
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
 };

 const handleDelete = async () => {
  if (!deleteId) return;
  try {
   await deleteProduct.mutateAsync(deleteId);
   toast({ title: 'Product deleted' });
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
  setDeleteId(null);
 };

 const handleToggle = async (id: string, field: 'is_featured' | 'is_active', value: boolean) => {
  try {
   await updateProduct.mutateAsync({ id, [field]: value });
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
 };

 return (
  <div className="space-y-6">
   {/* Header */}
   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
     <h1 className="text-2xl font-bold text-white">Products</h1>
     <p className="text-sm text-slate-400">Manage your product catalog</p>
    </div>
    <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
     <Plus className="w-4 h-4 mr-2" />
     Add Product
    </Button>
   </div>

   {/* Search */}
   <div className="relative max-w-sm">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
    <Input
     placeholder="Search products..."
     value={search}
     onChange={(e) => setSearch(e.target.value)}
     className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
    />
   </div>

   {/* Table */}
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
          <th className="text-left text-xs text-slate-400 font-medium py-3 px-4">Product</th>
          <th className="text-left text-xs text-slate-400 font-medium py-3 px-4">Category</th>
          <th className="text-left text-xs text-slate-400 font-medium py-3 px-4">Price</th>
          <th className="text-left text-xs text-slate-400 font-medium py-3 px-4">Status</th>
          <th className="text-right text-xs text-slate-400 font-medium py-3 px-4">Actions</th>
         </tr>
        </thead>
        <tbody>
         {filtered?.map((product) => (
          <tr key={product.id} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-700/20">
           <td className="py-3 px-4">
            <div className="flex items-center gap-3">
             <img
              src={product.thumbnail}
              alt={product.name.en}
              className="w-12 h-10 object-cover rounded-lg"
             />
             <div>
              <p className="text-sm font-medium text-white">{product.name.en}</p>
              <p className="text-xs text-slate-400">{product.slug}</p>
             </div>
            </div>
           </td>
           <td className="py-3 px-4">
            <Badge variant="outline" className="text-[11px] border-slate-600 text-slate-300">
             {product.category}
            </Badge>
           </td>
           <td className="py-3 px-4">
            <span className="text-sm font-medium text-white">৳{product.priceBDT.toLocaleString()}</span>
            <span className="text-xs text-slate-400 ml-1">(${product.priceUSD})</span>
           </td>
           <td className="py-3 px-4">
            <div className="flex items-center gap-2">
             <button
              onClick={() => handleToggle(product.id, 'is_active', !product.isActive)}
              className="text-slate-400 hover:text-white"
              title={product.isActive ? 'Active' : 'Inactive'}
             >
              {product.isActive ? (
               <Eye className="w-4 h-4 text-emerald-400" />
              ) : (
               <EyeOff className="w-4 h-4 text-slate-500" />
              )}
             </button>
             <button
              onClick={() => handleToggle(product.id, 'is_featured', !product.isFeatured)}
              className="text-slate-400 hover:text-white"
              title={product.isFeatured ? 'Featured' : 'Not featured'}
             >
              <Star className={`w-4 h-4 ${product.isFeatured ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
             </button>
            </div>
           </td>
           <td className="py-3 px-4">
            <div className="flex items-center justify-end gap-1">
             <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white"
              onClick={() => openEdit(product)}
             >
              <Pencil className="w-4 h-4" />
             </Button>
             <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-400"
              onClick={() => setDeleteId(product.id)}
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
        <div className="text-center py-12 text-slate-500">
         <p>No products found</p>
        </div>
       )}
      </div>
     )}
    </CardContent>
   </Card>

   {/* Create/Edit Dialog */}
   <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
    <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
     <DialogHeader>
      <DialogTitle>{editingId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
     </DialogHeader>
     <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
       <div className="space-y-2">
        <Label className="text-slate-300">Name (English)</Label>
        <Input
         value={form.name.en}
         onChange={(e) => setForm({ ...form, name: { ...form.name, en: e.target.value } })}
         className="bg-slate-700/50 border-slate-600 text-white"
        />
       </div>
       <div className="space-y-2">
        <Label className="text-slate-300">Name (Bangla)</Label>
        <Input
         value={form.name.bn}
         onChange={(e) => setForm({ ...form, name: { ...form.name, bn: e.target.value } })}
         className="bg-slate-700/50 border-slate-600 text-white"
        />
       </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
       <div className="space-y-2">
        <Label className="text-slate-300">Slug</Label>
        <Input
         value={form.slug}
         onChange={(e) => setForm({ ...form, slug: e.target.value })}
         className="bg-slate-700/50 border-slate-600 text-white"
         placeholder="my-product-name"
        />
       </div>
       <div className="space-y-2">
        <Label className="text-slate-300">Category</Label>
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
         <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
          <SelectValue />
         </SelectTrigger>
         <SelectContent className="bg-slate-800 border-slate-700">
          <SelectItem value="ecommerce">Ecommerce</SelectItem>
          <SelectItem value="fashion">Fashion</SelectItem>
          <SelectItem value="gift">Gift Shop</SelectItem>
          <SelectItem value="accessories">Accessories</SelectItem>
          <SelectItem value="tech">Tech</SelectItem>
         </SelectContent>
        </Select>
       </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
       <div className="space-y-2">
        <Label className="text-slate-300">Price (BDT)</Label>
        <Input
         type="number"
         value={form.price_bdt}
         onChange={(e) => setForm({ ...form, price_bdt: parseInt(e.target.value) || 0 })}
         className="bg-slate-700/50 border-slate-600 text-white"
        />
       </div>
       <div className="space-y-2">
        <Label className="text-slate-300">Price (USD)</Label>
        <Input
         type="number"
         value={form.price_usd}
         onChange={(e) => setForm({ ...form, price_usd: parseInt(e.target.value) || 0 })}
         className="bg-slate-700/50 border-slate-600 text-white"
        />
       </div>
      </div>

      <div className="space-y-2">
       <Label className="text-slate-300">Thumbnail URL</Label>
       <Input
        value={form.thumbnail}
        onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
        className="bg-slate-700/50 border-slate-600 text-white"
        placeholder="https://images.unsplash.com/..."
       />
      </div>

      <div className="grid grid-cols-2 gap-4">
       <div className="space-y-2">
        <Label className="text-slate-300">Description (English)</Label>
        <Textarea
         value={form.short_description.en}
         onChange={(e) => setForm({ ...form, short_description: { ...form.short_description, en: e.target.value } })}
         className="bg-slate-700/50 border-slate-600 text-white"
         rows={3}
        />
       </div>
       <div className="space-y-2">
        <Label className="text-slate-300">Description (Bangla)</Label>
        <Textarea
         value={form.short_description.bn}
         onChange={(e) => setForm({ ...form, short_description: { ...form.short_description, bn: e.target.value } })}
         className="bg-slate-700/50 border-slate-600 text-white"
         rows={3}
        />
       </div>
      </div>

      <div className="flex items-center gap-6">
       <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
        <input
         type="checkbox"
         checked={form.is_featured}
         onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
         className="rounded border-slate-600"
        />
        Featured
       </label>
       <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
        <input
         type="checkbox"
         checked={form.is_active}
         onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
         className="rounded border-slate-600"
        />
        Active
       </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
       <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700">
        Cancel
       </Button>
       <Button
        onClick={handleSubmit}
        disabled={createProduct.isPending || updateProduct.isPending}
        className="bg-primary"
       >
        {(createProduct.isPending || updateProduct.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {editingId ? 'Update' : 'Create'}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>

   {/* Delete Confirmation */}
   <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
    <AlertDialogContent className="bg-slate-800 border-slate-700">
     <AlertDialogHeader>
      <AlertDialogTitle className="text-white">Delete Product</AlertDialogTitle>
      <AlertDialogDescription className="text-slate-400">
       Are you sure? This action cannot be undone.
      </AlertDialogDescription>
     </AlertDialogHeader>
     <AlertDialogFooter>
      <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
       Delete
      </AlertDialogAction>
     </AlertDialogFooter>
    </AlertDialogContent>
   </AlertDialog>
  </div>
 );
};

export default AdminProductsPage;
