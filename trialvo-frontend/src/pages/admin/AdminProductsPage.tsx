import React, { useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Star, Eye, EyeOff, Search, Loader2,
  X, Image as ImageIcon, Video, Link2, ChevronDown, ChevronUp, Package
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  useAdminProducts, useCreateProduct, useUpdateProduct, useDeleteProduct
} from '@/hooks/admin/useAdminProducts';

// ─── Types ─────────────────────────────────────────────────────
interface DemoItem {
  label: { bn: string; en: string };
  url: string;
  username: string;
  password: string;
}

interface FaqItem {
  question: { bn: string; en: string };
  answer: { bn: string; en: string };
}

interface ProductFormData {
  slug: string;
  category: string;
  price_bdt: number;
  price_usd: number;
  thumbnail: string;
  images: { admin: string[]; shop: string[] };
  video_url: string;
  demo: DemoItem[];
  name: { bn: string; en: string };
  short_description: { bn: string; en: string };
  features: { bn: string[]; en: string[] };
  facilities: { bn: string[]; en: string[] };
  faq: FaqItem[];
  seo: {
    title: { bn: string; en: string };
    description: { bn: string; en: string };
    keywords: { bn: string[]; en: string[] };
  };
  is_featured: boolean;
  is_active: boolean;
}

const emptyForm: ProductFormData = {
  slug: '',
  category: 'ecommerce',
  price_bdt: 0,
  price_usd: 0,
  thumbnail: '',
  images: { admin: [''], shop: [''] },
  video_url: '',
  demo: [{ label: { bn: '', en: '' }, url: '', username: '', password: '' }],
  name: { bn: '', en: '' },
  short_description: { bn: '', en: '' },
  features: { bn: [''], en: [''] },
  facilities: { bn: [''], en: [''] },
  faq: [{ question: { bn: '', en: '' }, answer: { bn: '', en: '' } }],
  seo: {
    title: { bn: '', en: '' },
    description: { bn: '', en: '' },
    keywords: { bn: [''], en: [''] },
  },
  is_featured: false,
  is_active: true,
};

// ─── Reusable styling constants ───────────────────────────────
const inputClass = 'bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/25';
const labelClass = 'text-muted-foreground text-xs font-medium mb-1.5 block';
const sectionClass = 'admin-section';

// ─── Array Field Helper ───────────────────────────────────────
const ArrayField: React.FC<{
  label: string;
  values: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
}> = ({ label, values, onChange, placeholder }) => (
  <div className="space-y-2">
    <Label className={labelClass}>{label}</Label>
    {values.map((val, i) => (
      <div key={i} className="flex gap-2">
        <Input
          value={val}
          onChange={(e) => {
            const newVals = [...values];
            newVals[i] = e.target.value;
            onChange(newVals);
          }}
          className={`flex-1 text-sm ${inputClass}`}
          placeholder={placeholder}
        />
        {values.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onChange(values.filter((_, j) => j !== i))}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    ))}
    <Button
      variant="ghost"
      size="sm"
      className="text-primary hover:text-primary/80 text-xs"
      onClick={() => onChange([...values, ''])}
    >
      <Plus className="w-3 h-3 mr-1" /> Add
    </Button>
  </div>
);

// ─── Image URL Field with Preview ─────────────────────────────
const ImageUrlField: React.FC<{
  label: string;
  values: string[];
  onChange: (vals: string[]) => void;
}> = ({ label, values, onChange }) => (
  <div className="space-y-2">
    <Label className={labelClass}>{label}</Label>
    {values.map((url, i) => (
      <div key={i} className="space-y-1">
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => {
              const newVals = [...values];
              newVals[i] = e.target.value;
              onChange(newVals);
            }}
            className={`flex-1 text-sm ${inputClass}`}
            placeholder="https://images.unsplash.com/..."
          />
          {values.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        {url && (
          <img
            src={url}
            alt=""
            className="w-24 h-16 object-cover rounded-lg border border-white/10"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>
    ))}
    <Button
      variant="ghost"
      size="sm"
      className="text-primary hover:text-primary/80 text-xs"
      onClick={() => onChange([...values, ''])}
    >
      <Plus className="w-3 h-3 mr-1" /> Add Image
    </Button>
  </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────
const AdminProductsPage: React.FC = () => {
  const { toast } = useToast();
  const { data: products, isLoading } = useAdminProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
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
    setForm(JSON.parse(JSON.stringify(emptyForm)));
    setEditorOpen(true);
  };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    setForm({
      slug: product.slug,
      category: product.category,
      price_bdt: product.priceBDT,
      price_usd: product.priceUSD,
      thumbnail: product.thumbnail,
      images: product.images || { admin: [''], shop: [''] },
      video_url: product.videoUrl || '',
      demo: product.demo?.length ? product.demo : [{ label: { bn: '', en: '' }, url: '', username: '', password: '' }],
      name: product.name,
      short_description: product.shortDescription,
      features: product.features || { bn: [''], en: [''] },
      facilities: product.facilities || { bn: [''], en: [''] },
      faq: product.faq?.length ? product.faq : [{ question: { bn: '', en: '' }, answer: { bn: '', en: '' } }],
      seo: product.seo || { title: { bn: '', en: '' }, description: { bn: '', en: '' }, keywords: { bn: [''], en: [''] } },
      is_featured: product.isFeatured,
      is_active: product.isActive,
    });
    setEditorOpen(true);
  };

  const handleSubmit = async () => {
    // Clean data
    const cleanedForm = {
      ...form,
      images: {
        admin: form.images.admin.filter((u) => u.trim()),
        shop: form.images.shop.filter((u) => u.trim()),
      },
      demo: form.demo.filter((d) => d.url.trim()),
      features: {
        bn: form.features.bn.filter((f) => f.trim()),
        en: form.features.en.filter((f) => f.trim()),
      },
      facilities: {
        bn: form.facilities.bn.filter((f) => f.trim()),
        en: form.facilities.en.filter((f) => f.trim()),
      },
      faq: form.faq.filter((f) => f.question.en.trim()),
      seo: {
        ...form.seo,
        keywords: {
          bn: form.seo.keywords.bn.filter((k) => k.trim()),
          en: form.seo.keywords.en.filter((k) => k.trim()),
        },
      },
    };

    try {
      if (editingId) {
        await updateProduct.mutateAsync({ id: editingId, ...cleanedForm });
        toast({ title: 'Product updated successfully' });
      } else {
        await createProduct.mutateAsync(cleanedForm as any);
        toast({ title: 'Product created successfully' });
      }
      setEditorOpen(false);
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

  // ─── EDITOR VIEW (split: form left, preview right) ─────
  if (editorOpen) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={() => setEditorOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">
              {editingId ? 'Edit Product' : 'Create Product'}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditorOpen(false)}
              className="border-border text-muted-foreground bg-transparent hover:bg-accent hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createProduct.isPending || updateProduct.isPending}
              className="hero-gradient hover:opacity-90 text-primary-foreground border-0"
            >
              {(createProduct.isPending || updateProduct.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingId ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </div>

        {/* Split View */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
          {/* ─── LEFT: Form ─────────────────────────────────── */}
          <div className="space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto pr-2">
            {/* Basic Info */}
            <div className={sectionClass}>
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 pb-2 border-b border-border/50">
                <Package className="w-4 h-4 text-primary" />
                Basic Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className={labelClass}>Name (English) *</Label>
                    <Input
                      value={form.name.en}
                      onChange={(e) => setForm({ ...form, name: { ...form.name, en: e.target.value } })}
                      className={inputClass}
                      placeholder="Product name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClass}>Name (Bangla) *</Label>
                    <Input
                      value={form.name.bn}
                      onChange={(e) => setForm({ ...form, name: { ...form.name, bn: e.target.value } })}
                      className={inputClass}
                      placeholder="পণ্যের নাম"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className={labelClass}>Slug *</Label>
                    <Input
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      className={inputClass}
                      placeholder="my-product"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClass}>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger className={inputClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="ecommerce">Ecommerce</SelectItem>
                        <SelectItem value="fashion">Fashion</SelectItem>
                        <SelectItem value="gift">Gift Shop</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                        <SelectItem value="tech">Tech</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClass}>Status</Label>
                    <div className="flex items-center gap-4 pt-2">
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                        <input
                          type="checkbox"
                          checked={form.is_featured}
                          onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                          className="rounded border-border bg-muted text-primary focus:ring-primary"
                        />
                        Featured
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                        <input
                          type="checkbox"
                          checked={form.is_active}
                          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                          className="rounded border-border bg-muted text-primary focus:ring-primary"
                        />
                        Active
                      </label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className={labelClass}>Price (BDT) *</Label>
                    <Input
                      type="number"
                      value={form.price_bdt}
                      onChange={(e) => setForm({ ...form, price_bdt: parseInt(e.target.value) || 0 })}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClass}>Price (USD) *</Label>
                    <Input
                      type="number"
                      value={form.price_usd}
                      onChange={(e) => setForm({ ...form, price_usd: parseInt(e.target.value) || 0 })}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className={labelClass}>Description (English)</Label>
                    <Textarea
                      value={form.short_description.en}
                      onChange={(e) => setForm({ ...form, short_description: { ...form.short_description, en: e.target.value } })}
                      className={`${inputClass} text-sm`}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClass}>Description (Bangla)</Label>
                    <Textarea
                      value={form.short_description.bn}
                      onChange={(e) => setForm({ ...form, short_description: { ...form.short_description, bn: e.target.value } })}
                      className={`${inputClass} text-sm`}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Media */}
            <div className={sectionClass}>
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 pb-2 border-b border-border/50">
                <ImageIcon className="w-4 h-4 text-primary" />
                Media
              </h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className={labelClass}>Thumbnail URL *</Label>
                  <Input
                    value={form.thumbnail}
                    onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                    className={inputClass}
                    placeholder="https://images.unsplash.com/..."
                  />
                  {form.thumbnail && (
                    <img
                      src={form.thumbnail}
                      alt="Thumbnail"
                      className="w-32 h-20 object-cover rounded-lg border border-border mt-2 shadow-soft-sm"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>
                <ImageUrlField
                  label="Admin Panel Screenshots"
                  values={form.images.admin}
                  onChange={(vals) => setForm({ ...form, images: { ...form.images, admin: vals } })}
                />
                <ImageUrlField
                  label="Shop Screenshots"
                  values={form.images.shop}
                  onChange={(vals) => setForm({ ...form, images: { ...form.images, shop: vals } })}
                />
                <div className="space-y-1">
                  <Label className={labelClass}>Video URL</Label>
                  <Input
                    value={form.video_url}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    className={inputClass}
                    placeholder="https://youtube.com/embed/..."
                  />
                </div>
              </div>
            </div>

            {/* Demo Access */}
            <div className={sectionClass}>
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 pb-2 border-b border-border/50">
                <Link2 className="w-4 h-4 text-primary" />
                Demo Access
              </h3>
              <div className="space-y-4">
                {form.demo.map((d, i) => (
                  <div key={i} className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Demo #{i + 1}</span>
                      {form.demo.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-destructive text-xs hover:bg-destructive/10"
                          onClick={() => setForm({ ...form, demo: form.demo.filter((_, j) => j !== i) })}
                        >
                          <X className="w-3 h-3 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={d.label.en}
                        onChange={(e) => {
                          const arr = [...form.demo];
                          arr[i] = { ...arr[i], label: { ...arr[i].label, en: e.target.value } };
                          setForm({ ...form, demo: arr });
                        }}
                        className={`text-sm ${inputClass}`}
                        placeholder="Label (EN)"
                      />
                      <Input
                        value={d.label.bn}
                        onChange={(e) => {
                          const arr = [...form.demo];
                          arr[i] = { ...arr[i], label: { ...arr[i].label, bn: e.target.value } };
                          setForm({ ...form, demo: arr });
                        }}
                        className={`text-sm ${inputClass}`}
                        placeholder="লেবেল (BN)"
                      />
                    </div>
                    <Input
                      value={d.url}
                      onChange={(e) => {
                        const arr = [...form.demo];
                        arr[i] = { ...arr[i], url: e.target.value };
                        setForm({ ...form, demo: arr });
                      }}
                      className={`text-sm ${inputClass}`}
                      placeholder="https://demo.example.com"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={d.username}
                        onChange={(e) => {
                          const arr = [...form.demo];
                          arr[i] = { ...arr[i], username: e.target.value };
                          setForm({ ...form, demo: arr });
                        }}
                        className={`text-sm ${inputClass}`}
                        placeholder="Username"
                      />
                      <Input
                        value={d.password}
                        onChange={(e) => {
                          const arr = [...form.demo];
                          arr[i] = { ...arr[i], password: e.target.value };
                          setForm({ ...form, demo: arr });
                        }}
                        className={`text-sm ${inputClass}`}
                        placeholder="Password"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80 text-xs"
                  onClick={() =>
                    setForm({
                      ...form,
                      demo: [...form.demo, { label: { bn: '', en: '' }, url: '', username: '', password: '' }],
                    })
                  }
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Demo
                </Button>
              </div>
            </div>

            {/* Features & Facilities */}
            <div className={sectionClass}>
              <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border/50">Features & Facilities</h3>
              <Tabs defaultValue="features" className="w-full">
                <TabsList className="bg-muted border border-border mb-4">
                  <TabsTrigger value="features" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground text-xs">Features</TabsTrigger>
                  <TabsTrigger value="facilities" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground text-xs">Facilities</TabsTrigger>
                </TabsList>
                <TabsContent value="features" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <ArrayField
                      label="Features (English)"
                      values={form.features.en}
                      onChange={(v) => setForm({ ...form, features: { ...form.features, en: v } })}
                      placeholder="Feature item..."
                    />
                    <ArrayField
                      label="Features (Bangla)"
                      values={form.features.bn}
                      onChange={(v) => setForm({ ...form, features: { ...form.features, bn: v } })}
                      placeholder="ফিচার..."
                    />
                  </div>
                </TabsContent>
                <TabsContent value="facilities" className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <ArrayField
                      label="Facilities (English)"
                      values={form.facilities.en}
                      onChange={(v) => setForm({ ...form, facilities: { ...form.facilities, en: v } })}
                      placeholder="Facility item..."
                    />
                    <ArrayField
                      label="Facilities (Bangla)"
                      values={form.facilities.bn}
                      onChange={(v) => setForm({ ...form, facilities: { ...form.facilities, bn: v } })}
                      placeholder="সুবিধা..."
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* FAQ */}
            <div className={sectionClass}>
              <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border/50">FAQ</h3>
              <div className="space-y-4">
                {form.faq.map((faq, i) => (
                  <div key={i} className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">FAQ #{i + 1}</span>
                      {form.faq.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-destructive text-xs hover:bg-destructive/10"
                          onClick={() => setForm({ ...form, faq: form.faq.filter((_, j) => j !== i) })}
                        >
                          <X className="w-3 h-3 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={faq.question.en}
                        onChange={(e) => {
                          const arr = [...form.faq];
                          arr[i] = { ...arr[i], question: { ...arr[i].question, en: e.target.value } };
                          setForm({ ...form, faq: arr });
                        }}
                        className={`text-sm ${inputClass}`}
                        placeholder="Question (EN)"
                      />
                      <Input
                        value={faq.question.bn}
                        onChange={(e) => {
                          const arr = [...form.faq];
                          arr[i] = { ...arr[i], question: { ...arr[i].question, bn: e.target.value } };
                          setForm({ ...form, faq: arr });
                        }}
                        className={`text-sm ${inputClass}`}
                        placeholder="প্রশ্ন (BN)"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Textarea
                        value={faq.answer.en}
                        onChange={(e) => {
                          const arr = [...form.faq];
                          arr[i] = { ...arr[i], answer: { ...arr[i].answer, en: e.target.value } };
                          setForm({ ...form, faq: arr });
                        }}
                        className={`text-sm ${inputClass}`}
                        placeholder="Answer (EN)"
                        rows={2}
                      />
                      <Textarea
                        value={faq.answer.bn}
                        onChange={(e) => {
                          const arr = [...form.faq];
                          arr[i] = { ...arr[i], answer: { ...arr[i].answer, bn: e.target.value } };
                          setForm({ ...form, faq: arr });
                        }}
                        className={`text-sm ${inputClass}`}
                        placeholder="উত্তর (BN)"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80 text-xs"
                  onClick={() =>
                    setForm({
                      ...form,
                      faq: [...form.faq, { question: { bn: '', en: '' }, answer: { bn: '', en: '' } }],
                    })
                  }
                >
                  <Plus className="w-3 h-3 mr-1" /> Add FAQ
                </Button>
              </div>
            </div>

            {/* SEO */}
            <div className={sectionClass}>
              <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border/50">SEO</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className={labelClass}>SEO Title (EN)</Label>
                    <Input
                      value={form.seo.title.en}
                      onChange={(e) => setForm({ ...form, seo: { ...form.seo, title: { ...form.seo.title, en: e.target.value } } })}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClass}>SEO Title (BN)</Label>
                    <Input
                      value={form.seo.title.bn}
                      onChange={(e) => setForm({ ...form, seo: { ...form.seo, title: { ...form.seo.title, bn: e.target.value } } })}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className={labelClass}>SEO Description (EN)</Label>
                    <Textarea
                      value={form.seo.description.en}
                      onChange={(e) => setForm({ ...form, seo: { ...form.seo, description: { ...form.seo.description, en: e.target.value } } })}
                      className={`${inputClass} text-sm`}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClass}>SEO Description (BN)</Label>
                    <Textarea
                      value={form.seo.description.bn}
                      onChange={(e) => setForm({ ...form, seo: { ...form.seo, description: { ...form.seo.description, bn: e.target.value } } })}
                      className={`${inputClass} text-sm`}
                      rows={2}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ArrayField
                    label="Keywords (EN)"
                    values={form.seo.keywords.en}
                    onChange={(v) => setForm({ ...form, seo: { ...form.seo, keywords: { ...form.seo.keywords, en: v } } })}
                    placeholder="keyword"
                  />
                  <ArrayField
                    label="Keywords (BN)"
                    values={form.seo.keywords.bn}
                    onChange={(v) => setForm({ ...form, seo: { ...form.seo, keywords: { ...form.seo.keywords, bn: v } } })}
                    placeholder="কিওয়ার্ড"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Live Preview ──────────────────────────── */}
          <div className="hidden xl:block sticky top-0 max-h-[calc(100vh-160px)] overflow-y-auto">
            <Card className="bg-card border-border overflow-hidden card-shadow">
              <div className="p-3 border-b border-border bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Preview</p>
              </div>
              <CardContent className="p-4 space-y-4">
                {/* Thumbnail */}
                {form.thumbnail ? (
                  <img
                    src={form.thumbnail}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-xl border border-white/10"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect fill="%231a1d2e" width="400" height="200"/><text x="200" y="100" text-anchor="middle" fill="%23666" font-size="14">No Image</text></svg>'; }}
                  />
                ) : (
                  <div className="w-full h-48 rounded-xl bg-[#1a1d2e] flex items-center justify-center border border-white/10">
                    <ImageIcon className="w-8 h-8 text-gray-600" />
                  </div>
                )}

                {/* Name & Price */}
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {form.name.en || 'Product Name'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{form.name.bn || 'পণ্যের নাম'}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-primary">
                    ৳{form.price_bdt.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">(${form.price_usd})</span>
                </div>

                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs border-border text-muted-foreground capitalize bg-muted/50">{form.category}</Badge>
                  {form.is_featured && (
                    <Badge className="text-xs bg-accent/10 text-accent border-accent/20">
                      <Star className="w-3 h-3 mr-1 fill-accent" /> Featured
                    </Badge>
                  )}
                  <Badge variant="outline" className={`text-xs ${form.is_active ? 'border-success/20 text-success bg-success/10' : 'border-destructive/20 text-destructive bg-destructive/10'}`}>
                    {form.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <Separator className="bg-border" />

                {/* Description */}
                {form.short_description.en && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Description</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{form.short_description.en}</p>
                  </div>
                )}

                {/* Features */}
                {form.features.en.some((f) => f.trim()) && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Features</p>
                    <ul className="space-y-1.5">
                      {form.features.en.filter((f) => f.trim()).map((f, i) => (
                        <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Demo */}
                {form.demo.some((d) => d.url.trim()) && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Demo Access</p>
                    {form.demo.filter((d) => d.url.trim()).map((d, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border text-xs space-y-1 mb-2">
                        <p className="font-medium text-foreground">{d.label.en || `Demo #${i + 1}`}</p>
                        <p className="text-primary">{d.url}</p>
                        <p className="text-muted-foreground">User: {d.username} | Pass: {d.password}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gallery Preview */}
                {(form.images.admin.some((u) => u.trim()) || form.images.shop.some((u) => u.trim())) && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Gallery</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[...form.images.admin, ...form.images.shop].filter((u) => u.trim()).slice(0, 6).map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt=""
                          className="w-full h-16 object-cover rounded-lg border border-border shadow-soft-sm hover-scale cursor-pointer"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ─── TABLE VIEW ────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="admin-page-header">
          <h1>Products</h1>
          <p>Manage your product catalog</p>
        </div>
        <Button onClick={openCreate} className="hero-gradient text-primary-foreground hover:opacity-90 border-0 shadow-soft-sm h-9 text-sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Product
        </Button>
      </div>

      <div className="admin-search max-w-sm">
        <Search />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-card">
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
              <div className="md:hidden p-3 space-y-3">
                {filtered?.map((product) => (
                  <div key={product.id} className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.thumbnail}
                        alt={product.name.en}
                        className="w-14 h-12 object-cover rounded-lg border border-border flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{product.name.en}</p>
                        <p className="text-xs text-muted-foreground truncate">{product.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground capitalize">{product.category}</Badge>
                        <span className="text-sm font-bold text-primary">৳{product.priceBDT.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleToggle(product.id, 'is_active', !product.isActive)} className="transition-colors hover:scale-110">
                          {product.isActive ? <Eye className="w-4 h-4 text-success" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        <button onClick={() => handleToggle(product.id, 'is_featured', !product.isFeatured)} className="transition-colors hover:scale-110">
                          <Star className={`w-4 h-4 ${product.isFeatured ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/50">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => openEdit(product)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(product.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filtered?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">No products found</div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="admin-table-header">
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered?.map((product) => (
                      <tr key={product.id} className="admin-table-row group">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-4">
                            <img src={product.thumbnail} alt={product.name.en} className="w-12 h-10 object-cover rounded-lg border border-border/50 shadow-soft-sm" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{product.name.en}</p>
                              <p className="text-xs text-muted-foreground">{product.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <Badge variant="outline" className="text-[11px] border-border text-muted-foreground bg-muted/50 capitalize">{product.category}</Badge>
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-sm font-bold text-primary">৳{product.priceBDT.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-1">(${product.priceUSD})</span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleToggle(product.id, 'is_active', !product.isActive)} className="transition-transform hover:scale-110" title={product.isActive ? 'Active' : 'Inactive'}>
                              {product.isActive ? <Eye className="w-4 h-4 text-success" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                            </button>
                            <button onClick={() => handleToggle(product.id, 'is_featured', !product.isFeatured)} className="transition-transform hover:scale-110" title={product.isFeatured ? 'Featured' : 'Not featured'}>
                              <Star className={`w-4 h-4 ${product.isFeatured ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => openEdit(product)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(product.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered?.length === 0 && (
                  <div className="admin-empty"><Package /><p>No products found</p></div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border shadow-soft-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Product</AlertDialogTitle>
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

export default AdminProductsPage;
