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
const inputClass = 'bg-[#1a1d2e] border-white/10 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/25';
const labelClass = 'text-gray-300 text-xs font-medium';
const sectionClass = 'p-4 rounded-xl bg-[#13152080] border border-white/5';

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
            className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
      className="text-indigo-400 hover:text-indigo-300 text-xs"
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
              className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
      className="text-indigo-400 hover:text-indigo-300 text-xs"
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
              className="text-gray-400 hover:text-white hover:bg-white/10"
              onClick={() => setEditorOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-white">
              {editingId ? 'Edit Product' : 'Create Product'}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditorOpen(false)}
              className="border-white/10 text-gray-300 bg-transparent hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createProduct.isPending || updateProduct.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
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
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-400" />
                Basic Information
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
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
                <div className="grid grid-cols-3 gap-3">
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
                      <SelectContent className="bg-[#1e2030] border-white/10">
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
                      <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.is_featured}
                          onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                          className="rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500"
                        />
                        Featured
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.is_active}
                          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                          className="rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500"
                        />
                        Active
                      </label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                <div className="grid grid-cols-2 gap-3">
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
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                Media
              </h3>
              <div className="space-y-3">
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
                      className="w-32 h-20 object-cover rounded-lg border border-white/10 mt-1"
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
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-indigo-400" />
                Demo Access
              </h3>
              <div className="space-y-3">
                {form.demo.map((d, i) => (
                  <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 font-medium">Demo #{i + 1}</span>
                      {form.demo.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-red-400 text-xs hover:bg-red-500/10"
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
                  className="text-indigo-400 hover:text-indigo-300 text-xs"
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
              <h3 className="text-sm font-semibold text-white mb-3">Features & Facilities</h3>
              <Tabs defaultValue="features" className="w-full">
                <TabsList className="bg-white/5 border border-white/10 mb-3">
                  <TabsTrigger value="features" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-400 text-xs">Features</TabsTrigger>
                  <TabsTrigger value="facilities" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-400 text-xs">Facilities</TabsTrigger>
                </TabsList>
                <TabsContent value="features" className="space-y-3">
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
              <h3 className="text-sm font-semibold text-white mb-3">FAQ</h3>
              <div className="space-y-3">
                {form.faq.map((faq, i) => (
                  <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 font-medium">FAQ #{i + 1}</span>
                      {form.faq.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-red-400 text-xs hover:bg-red-500/10"
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
                  className="text-indigo-400 hover:text-indigo-300 text-xs"
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
              <h3 className="text-sm font-semibold text-white mb-3">SEO</h3>
              <div className="space-y-3">
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
            <Card className="bg-[#161822] border-white/[0.08] overflow-hidden">
              <div className="p-3 border-b border-white/[0.08]">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Live Preview</p>
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
                  <h3 className="text-lg font-bold text-white">
                    {form.name.en || 'Product Name'}
                  </h3>
                  <p className="text-sm text-gray-400">{form.name.bn || 'পণ্যের নাম'}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-indigo-400">
                    ৳{form.price_bdt.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">(${form.price_usd})</span>
                </div>

                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs border-white/20 text-gray-300 capitalize">{form.category}</Badge>
                  {form.is_featured && (
                    <Badge className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/20">
                      <Star className="w-3 h-3 mr-1 fill-amber-400" /> Featured
                    </Badge>
                  )}
                  <Badge variant="outline" className={`text-xs ${form.is_active ? 'border-emerald-500/20 text-emerald-400' : 'border-red-500/20 text-red-400'}`}>
                    {form.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <Separator className="bg-white/10" />

                {/* Description */}
                {form.short_description.en && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">Description</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{form.short_description.en}</p>
                  </div>
                )}

                {/* Features */}
                {form.features.en.some((f) => f.trim()) && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-2">Features</p>
                    <ul className="space-y-1">
                      {form.features.en.filter((f) => f.trim()).map((f, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Demo */}
                {form.demo.some((d) => d.url.trim()) && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-2">Demo Access</p>
                    {form.demo.filter((d) => d.url.trim()).map((d, i) => (
                      <div key={i} className="p-2 rounded-lg bg-white/5 text-xs space-y-1 mb-2">
                        <p className="font-medium text-white">{d.label.en || `Demo #${i + 1}`}</p>
                        <p className="text-indigo-400">{d.url}</p>
                        <p className="text-gray-400">User: {d.username} | Pass: {d.password}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gallery Preview */}
                {(form.images.admin.some((u) => u.trim()) || form.images.shop.some((u) => u.trim())) && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-2">Gallery</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[...form.images.admin, ...form.images.shop].filter((u) => u.trim()).slice(0, 6).map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt=""
                          className="w-full h-16 object-cover rounded-lg border border-white/10"
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-sm text-gray-400">Manage your product catalog</p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`pl-10 ${inputClass}`}
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
                    <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Product</th>
                    <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Category</th>
                    <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Price</th>
                    <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Status</th>
                    <th className="text-right text-xs text-gray-400 font-medium py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered?.map((product) => (
                    <tr key={product.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.thumbnail}
                            alt={product.name.en}
                            className="w-12 h-10 object-cover rounded-lg border border-white/10"
                          />
                          <div>
                            <p className="text-sm font-medium text-white">{product.name.en}</p>
                            <p className="text-xs text-gray-500">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[11px] border-white/15 text-gray-300 capitalize">
                          {product.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-white">৳{product.priceBDT.toLocaleString()}</span>
                        <span className="text-xs text-gray-500 ml-1">(${product.priceUSD})</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggle(product.id, 'is_active', !product.isActive)}
                            className="transition-colors"
                            title={product.isActive ? 'Active' : 'Inactive'}
                          >
                            {product.isActive ? (
                              <Eye className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                          <button
                            onClick={() => handleToggle(product.id, 'is_featured', !product.isFeatured)}
                            className="transition-colors"
                            title={product.isFeatured ? 'Featured' : 'Not featured'}
                          >
                            <Star className={`w-4 h-4 ${product.isFeatured ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                            onClick={() => openEdit(product)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
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
                <div className="text-center py-12 text-gray-500">No products found</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#1e2030] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Product</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-gray-300 bg-transparent hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProductsPage;
