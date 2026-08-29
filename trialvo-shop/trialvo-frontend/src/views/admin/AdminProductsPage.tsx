"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, Star, Eye, EyeOff, Search, Loader2,
  X, Image as ImageIcon, ChevronDown, ChevronUp, Package,
  Copy, CheckSquare, Square, ChevronLeft, ChevronRight, Settings2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { AdminNumberInput } from '@/components/admin/AdminNumberInput';
import { QueryError } from '@/components/admin/QueryError';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  useAdminProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  useDuplicateProduct, useBulkToggleProducts,
} from '@/hooks/admin/useAdminProducts';
import { useAdminCategories } from '@/hooks/useCategories';
import ImageUploadButton from '@/components/admin/ImageUploadButton';
import { useCleanupMediaUrls } from '@/hooks/useMedia';
import { isManagedUploadUrl, normalizeProductImages, resolveMediaUrl } from '@/lib/mediaUrl';
import { clampDiscountPercent, quoteProductPrice } from '@/lib/productPricing';

// ─── Types ─────────────────────────────────────────────────────
interface FaqItem {
  question: { bn: string; en: string };
  answer: { bn: string; en: string };
}

interface DeployConfigForm {
  image_api: string;
  image_shop: string;
  image_admin: string;
  default_trial_days: number;
  supports_option1: boolean;
  supports_option2: boolean;
  shared_demo: boolean;
  shared_demo_shop_url: string;
  shared_demo_admin_url: string;
}

interface ProductFormData {
  slug: string;
  category: string;
  price_bdt: number;
  price_usd: number;
  discount_percent: number;
  thumbnail: string;
  images: { admin: string[]; shop: string[] };
  video_url: string;
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
  is_trialable: boolean;
  deploy_config: DeployConfigForm;
}

const emptyFaq = (): FaqItem => ({
  question: { bn: '', en: '' },
  answer: { bn: '', en: '' },
});

const emptyDeployConfig = (): DeployConfigForm => ({
  image_api: '',
  image_shop: '',
  image_admin: '',
  default_trial_days: 14,
  supports_option1: true,
  supports_option2: true,
  shared_demo: false,
  shared_demo_shop_url: '',
  shared_demo_admin_url: '',
});

function normalizeFaqList(raw: any): FaqItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return [emptyFaq()];
  return raw.map((f) => ({
    question: { bn: f?.question?.bn ?? '', en: f?.question?.en ?? '' },
    answer: { bn: f?.answer?.bn ?? '', en: f?.answer?.en ?? '' },
  }));
}

function normalizeDeployConfig(raw: any): DeployConfigForm {
  const base = emptyDeployConfig();
  if (!raw || typeof raw !== 'object') return base;
  return {
    image_api: String(raw.image_api ?? ''),
    image_shop: String(raw.image_shop ?? ''),
    image_admin: String(raw.image_admin ?? ''),
    default_trial_days: Math.max(1, parseInt(String(raw.default_trial_days ?? 14), 10) || 14),
    supports_option1: raw.supports_option1 !== false,
    supports_option2: raw.supports_option2 !== false,
    shared_demo: Boolean(raw.shared_demo),
    shared_demo_shop_url: String(raw.shared_demo_shop_url ?? ''),
    shared_demo_admin_url: String(raw.shared_demo_admin_url ?? ''),
  };
}

function AdminPriceCell({ listBdt, listUsd, discountPercent }: { listBdt: number; listUsd: number; discountPercent?: number }) {
  const q = quoteProductPrice({ priceBDT: listBdt, priceUSD: listUsd, discountPercent });
  const hasUsd = q.listUsd > 0;
  if (!q.hasDiscount) {
    return (
      <div className="leading-tight">
        <div className="text-sm font-bold text-primary">৳{q.listBdt.toLocaleString()}</div>
        {hasUsd ? <div className="text-xs text-muted-foreground">${q.listUsd}</div> : null}
      </div>
    );
  }
  return (
    <div className="leading-tight">
      <div>
        <span className="text-xs text-muted-foreground line-through mr-1.5">৳{q.listBdt.toLocaleString()}</span>
        <span className="text-sm font-bold text-primary">৳{q.saleBdt.toLocaleString()}</span>
      </div>
      {hasUsd ? (
        <div className="text-xs text-muted-foreground">
          <span className="line-through mr-1">${q.listUsd}</span>
          ${q.saleUsd}
        </div>
      ) : null}
      <span className="text-[10px] text-destructive font-semibold">-{q.discountPercent}%</span>
    </div>
  );
}

const emptyForm: ProductFormData = {
  slug: '',
  category: 'ecommerce',
  price_bdt: 0,
  price_usd: 0,
  discount_percent: 0,
  thumbnail: '',
  images: { admin: [''], shop: [''] },
  video_url: '',
  name: { bn: '', en: '' },
  short_description: { bn: '', en: '' },
  features: { bn: [''], en: [''] },
  facilities: { bn: [''], en: [''] },
  faq: [emptyFaq()],
  seo: {
    title: { bn: '', en: '' },
    description: { bn: '', en: '' },
    keywords: { bn: [''], en: [''] },
  },
  is_featured: false,
  is_active: true,
  is_trialable: false,
  deploy_config: emptyDeployConfig(),
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
  onRemoveUrl?: (url: string) => void;
  ownerId?: string | null;
}> = ({ label, values, onChange, onRemoveUrl, ownerId }) => {
  const safeValues = values?.length ? values : [''];

  const move = (from: number, to: number) => {
    if (to < 0 || to >= safeValues.length) return;
    const next = [...safeValues];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const removeAt = (i: number) => {
    const removed = safeValues[i];
    if (removed && onRemoveUrl) onRemoveUrl(removed);
    if (safeValues.length <= 1) {
      onChange(['']);
      return;
    }
    onChange(safeValues.filter((_, j) => j !== i));
  };

  return (
  <div className="space-y-2">
    <Label className={labelClass}>{label}</Label>
    {safeValues.map((url, i) => (
      <div key={i} className="space-y-1">
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => {
              const newVals = [...safeValues];
              newVals[i] = e.target.value;
              onChange(newVals);
            }}
            className={`flex-1 text-sm ${inputClass}`}
            placeholder="/uploads/products/... or https://..."
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground"
            disabled={i === 0}
            onClick={() => move(i, i - 1)}
            title="Move up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground"
            disabled={i === safeValues.length - 1}
            onClick={() => move(i, i + 1)}
            title="Move down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => removeAt(i)}
            title="Remove"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
        {url && (
          <img
            src={resolveMediaUrl(url)}
            alt=""
            className="w-24 h-16 object-cover rounded-lg border border-white/10"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>
    ))}
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-primary hover:text-primary/80 text-xs"
        onClick={() => onChange([...safeValues.filter((v) => v.trim()), ''])}
      >
        <Plus className="w-3 h-3 mr-1" /> Add Image
      </Button>
      <ImageUploadButton
        label="Upload"
        ownerType="product"
        ownerId={ownerId || undefined}
        className="h-8 text-xs border-border text-foreground hover:bg-muted"
        onUploaded={(uploadedUrl) =>
          onChange([...safeValues.filter((v) => v.trim()), uploadedUrl])
        }
      />
    </div>
  </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────
const AdminProductsPage: React.FC = () => {
  const { toast } = useToast();
  const { data: products, isLoading, isError, error, refetch } = useAdminProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const duplicateProduct = useDuplicateProduct();
  const bulkToggle = useBulkToggleProducts();
  const cleanupMedia = useCleanupMediaUrls();
  const { data: adminCategories } = useAdminCategories();

  const queueMediaCleanup = (url: string) => {
    if (!isManagedUploadUrl(url)) return;
    cleanupMedia.mutate([url]);
  };

  const filtered = products?.filter(
    (p) => {
      const matchesSearch =
        (p.name?.en || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.name?.bn || '').includes(search) ||
        (p.category || '').includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }
  );

  // Reset page when filters change so the list never looks "empty"
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil((filtered?.length || 0) / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = filtered?.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  // Selection
  const toggleProductSelect = (id: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAllProducts = () => {
    if (!filtered) return;
    if (selectedProducts.size === filtered.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filtered.map(p => p.id)));
    }
  };
  const allProductsSelected = filtered ? filtered.length > 0 && selectedProducts.size === filtered.length : false;

  // Bulk toggle
  const handleBulkToggle = async (field: 'is_active' | 'is_featured', value: boolean) => {
    const ids = Array.from(selectedProducts);
    try {
      await bulkToggle.mutateAsync({ ids, field, value });
      toast({ title: `${ids.length} products updated` });
      setSelectedProducts(new Set());
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // Duplicate
  const handleDuplicate = async (id: string) => {
    try {
      await duplicateProduct.mutateAsync(id);
      toast({ title: 'Product duplicated' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // ─── Derived data (must be before any early return) ─────────
  const productStats = useMemo(() => {
    if (!products) return { total: 0, active: 0, featured: 0 };
    return {
      total: products.length,
      active: products.filter(p => p.isActive).length,
      featured: products.filter(p => p.isFeatured).length,
    };
  }, [products]);

  const uniqueCategories = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map(p => p.category))];
  }, [products]);

  const openCreate = () => {
    setEditingId(null);
    setForm(JSON.parse(JSON.stringify(emptyForm)));
    setEditorOpen(true);
  };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    setForm({
      slug: product.slug || '',
      category: product.category || 'ecommerce',
      price_bdt: Number(product.priceBDT) || 0,
      price_usd: Number(product.priceUSD) || 0,
      discount_percent: clampDiscountPercent(product.discountPercent),
      thumbnail: product.thumbnail || '',
      images: normalizeProductImages(product.images),
      video_url: product.videoUrl || '',
      name: { bn: product.name?.bn ?? '', en: product.name?.en ?? '' },
      short_description: {
        bn: product.shortDescription?.bn ?? '',
        en: product.shortDescription?.en ?? '',
      },
      features: {
        bn: product.features?.bn?.length ? product.features.bn : [''],
        en: product.features?.en?.length ? product.features.en : [''],
      },
      facilities: {
        bn: product.facilities?.bn?.length ? product.facilities.bn : [''],
        en: product.facilities?.en?.length ? product.facilities.en : [''],
      },
      faq: normalizeFaqList(product.faq),
      seo: {
        title: {
          bn: product.seo?.title?.bn ?? '',
          en: product.seo?.title?.en ?? '',
        },
        description: {
          bn: product.seo?.description?.bn ?? '',
          en: product.seo?.description?.en ?? '',
        },
        keywords: {
          bn: product.seo?.keywords?.bn?.length ? product.seo.keywords.bn : [''],
          en: product.seo?.keywords?.en?.length ? product.seo.keywords.en : [''],
        },
      },
      is_featured: Boolean(product.isFeatured),
      is_active: Boolean(product.isActive),
      is_trialable: Boolean(product.isTrialable),
      deploy_config: normalizeDeployConfig(product.deployConfig),
    });
    setEditorOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.en.trim() || !form.slug.trim()) {
      toast({ title: 'Name (EN) and slug are required', variant: 'destructive' });
      return;
    }
    if (!form.thumbnail.trim()) {
      toast({ title: 'Thumbnail is required', variant: 'destructive' });
      return;
    }
    if (!(form.price_bdt > 0)) {
      toast({ title: 'Price (BDT) is required', variant: 'destructive' });
      return;
    }

    const cleanedForm = {
      ...form,
      price_bdt: form.price_bdt,
      price_usd: form.price_usd,
      discount_percent: clampDiscountPercent(form.discount_percent),
      images: {
        admin: form.images.admin.filter((u) => u.trim()),
        shop: form.images.shop.filter((u) => u.trim()),
      },
      // Legacy static demo credentials removed — public shop + trials use deploy_config.
      demo: [],
      features: {
        bn: (form.features?.bn || []).filter((f) => f.trim()),
        en: (form.features?.en || []).filter((f) => f.trim()),
      },
      facilities: {
        bn: (form.facilities?.bn || []).filter((f) => f.trim()),
        en: (form.facilities?.en || []).filter((f) => f.trim()),
      },
      // Keep FAQ if either language has a question
      faq: form.faq.filter(
        (f) => (f.question?.en || '').trim() || (f.question?.bn || '').trim(),
      ),
      seo: {
        title: form.seo?.title || { bn: '', en: '' },
        description: form.seo?.description || { bn: '', en: '' },
        keywords: {
          bn: (form.seo?.keywords?.bn || []).filter((k) => k.trim()),
          en: (form.seo?.keywords?.en || []).filter((k) => k.trim()),
        },
      },
      deploy_config: {
        ...form.deploy_config,
        default_trial_days: Math.max(1, form.deploy_config.default_trial_days || 14),
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
      <div className="flex flex-col gap-4 h-[calc(100dvh-5.5rem)] sm:h-[calc(100dvh-6rem)] lg:h-[calc(100dvh-7rem)] min-h-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
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
              className="border-border text-muted-foreground bg-transparent hover:bg-muted hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createProduct.isPending || updateProduct.isPending}
              className="hero-gradient hover:opacity-90 text-white border-0"
            >
              {(createProduct.isPending || updateProduct.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingId ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </div>

        {/* Split View */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 flex-1 min-h-0 overflow-hidden">
          {/* ─── LEFT: Form ─────────────────────────────────── */}
          <div className="space-y-4 overflow-y-auto min-h-0 pr-1">
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
                    <Label className={labelClass}>Name (Bangla)</Label>
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
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm((prev) => ({ ...prev, category: v }))}
                      disabled={!!adminCategories && adminCategories.length === 0}
                    >
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder={adminCategories ? 'Select category' : 'Loading categories…'} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {(adminCategories && adminCategories.length > 0
                          ? adminCategories
                              .filter((c) => c.is_active !== 0)
                              .map((c) => (
                                <SelectItem key={c.id} value={c.slug}>
                                  {c.name?.en || c.slug}
                                </SelectItem>
                              ))
                          : [
                              <SelectItem key="ecommerce" value="ecommerce">Ecommerce</SelectItem>,
                              <SelectItem key="fashion" value="fashion">Fashion</SelectItem>,
                              <SelectItem key="gift" value="gift">Gift Shop</SelectItem>,
                              <SelectItem key="accessories" value="accessories">Accessories</SelectItem>,
                              <SelectItem key="tech" value="tech">Tech</SelectItem>,
                            ]
                        )}
                        {form.category
                          && adminCategories
                          && !adminCategories.some((c) => c.slug === form.category) && (
                          <SelectItem value={form.category}>{form.category} (current)</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClass}>Status</Label>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 min-h-10">
                      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.is_featured}
                          onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                          className="rounded border-border bg-muted text-primary focus:ring-primary"
                        />
                        Featured
                      </label>
                      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.is_active}
                          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                          className="rounded border-border bg-muted text-primary focus:ring-primary"
                        />
                        Active
                      </label>
                      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.is_trialable}
                          onChange={(e) => setForm({ ...form, is_trialable: e.target.checked })}
                          className="rounded border-border bg-muted text-primary focus:ring-primary"
                        />
                        Trialable
                      </label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className={labelClass}>Price (BDT) *</Label>
                    <AdminNumberInput
                      min={0}
                      step={0.01}
                      value={form.price_bdt}
                      onValueChange={(n) => setForm((prev) => ({ ...prev, price_bdt: Math.max(0, Math.round(n * 100) / 100) }))}
                      className={inputClass}
                    />
                    <p className="text-[11px] text-muted-foreground">Required. Shop uses this as the main price.</p>
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClass}>Price (USD)</Label>
                    <AdminNumberInput
                      min={0}
                      step={0.01}
                      value={form.price_usd}
                      onValueChange={(n) => setForm((prev) => ({ ...prev, price_usd: Math.max(0, Math.round(n * 100) / 100) }))}
                      className={inputClass}
                    />
                    <p className="text-[11px] text-muted-foreground">Optional. English shop shows this if set; otherwise BDT.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className={labelClass}>Discount (%)</Label>
                    <AdminNumberInput
                      min={0}
                      max={100}
                      step={0.01}
                      value={form.discount_percent}
                      onValueChange={(n) => setForm((prev) => ({ ...prev, discount_percent: clampDiscountPercent(n) }))}
                      className={inputClass}
                    />
                    <p className="text-[11px] text-muted-foreground">Applied to BDT, and to USD if set. 0 = no discount.</p>
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClass}>Shop preview</Label>
                    {(() => {
                      const q = quoteProductPrice({
                        priceBDT: form.price_bdt,
                        priceUSD: form.price_usd,
                        discountPercent: form.discount_percent,
                      });
                      const hasUsd = q.listUsd > 0;
                      return (
                        <div className="text-sm pt-2 space-y-1">
                          <p>
                            <span className="text-xs text-muted-foreground mr-1.5">BDT</span>
                            {q.hasDiscount ? (
                              <>
                                <span className="line-through text-muted-foreground mr-1.5">৳{q.listBdt.toLocaleString()}</span>
                                <span className="font-bold text-primary">৳{q.saleBdt.toLocaleString()}</span>
                              </>
                            ) : (
                              <span className="font-bold text-primary">৳{q.saleBdt.toLocaleString()}</span>
                            )}
                            {q.hasDiscount ? (
                              <span className="text-xs text-destructive ml-1.5">-{q.discountPercent}%</span>
                            ) : null}
                          </p>
                          {hasUsd ? (
                            <p>
                              <span className="text-xs text-muted-foreground mr-1.5">USD</span>
                              {q.hasDiscount ? (
                                <>
                                  <span className="line-through text-muted-foreground mr-1.5">${q.listUsd}</span>
                                  <span className="font-bold text-primary">${q.saleUsd}</span>
                                </>
                              ) : (
                                <span className="font-bold text-primary">${q.saleUsd}</span>
                              )}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">USD not set — English shop will show BDT.</p>
                          )}
                        </div>
                      );
                    })()}
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
                  <div className="flex gap-2">
                    <Input
                      value={form.thumbnail}
                      onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                      className={`flex-1 ${inputClass}`}
                      placeholder="https://images.unsplash.com/... or upload →"
                    />
                    <ImageUploadButton
                      kind="thumbnail"
                      label="Upload"
                      ownerType="product"
                      ownerId={editingId || undefined}
                      onUploaded={(url) => setForm((prev) => {
                        if (prev.thumbnail && isManagedUploadUrl(prev.thumbnail) && prev.thumbnail !== url) {
                          queueMediaCleanup(prev.thumbnail);
                        }
                        return { ...prev, thumbnail: url };
                      })}
                    />
                  </div>
                  {form.thumbnail && (
                    <img
                      src={resolveMediaUrl(form.thumbnail)}
                      alt="Thumbnail"
                      className="w-32 h-20 object-cover rounded-lg border border-border mt-2 shadow-soft-sm"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>
                <ImageUrlField
                  label="Admin Panel Screenshots"
                  values={form.images.admin}
                  ownerId={editingId}
                  onRemoveUrl={queueMediaCleanup}
                  onChange={(vals) => setForm((prev) => ({ ...prev, images: { ...prev.images, admin: vals } }))}
                />
                <ImageUrlField
                  label="Shop Screenshots"
                  values={form.images.shop}
                  ownerId={editingId}
                  onRemoveUrl={queueMediaCleanup}
                  onChange={(vals) => setForm((prev) => ({ ...prev, images: { ...prev.images, shop: vals } }))}
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
                      onChange={(v) => setForm((prev) => ({ ...prev, features: { ...prev.features, en: v } }))}
                      placeholder="Feature item..."
                    />
                    <ArrayField
                      label="Features (Bangla)"
                      values={form.features.bn}
                      onChange={(v) => setForm((prev) => ({ ...prev, features: { ...prev.features, bn: v } }))}
                      placeholder="ফিচার..."
                    />
                  </div>
                </TabsContent>
                <TabsContent value="facilities" className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <ArrayField
                      label="Facilities (English)"
                      values={form.facilities.en}
                      onChange={(v) => setForm((prev) => ({ ...prev, facilities: { ...prev.facilities, en: v } }))}
                      placeholder="Facility item..."
                    />
                    <ArrayField
                      label="Facilities (Bangla)"
                      values={form.facilities.bn}
                      onChange={(v) => setForm((prev) => ({ ...prev, facilities: { ...prev.facilities, bn: v } }))}
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
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-destructive text-xs hover:bg-destructive/10"
                          onClick={() => setForm((prev) => ({
                            ...prev,
                            faq: prev.faq.filter((_, j) => j !== i),
                          }))}
                        >
                          <X className="w-3 h-3 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={faq.question.en}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((prev) => {
                            const arr = [...prev.faq];
                            arr[i] = { ...arr[i], question: { ...arr[i].question, en: val } };
                            return { ...prev, faq: arr };
                          });
                        }}
                        className={`text-sm ${inputClass}`}
                        placeholder="Question (EN)"
                      />
                      <Input
                        value={faq.question.bn}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((prev) => {
                            const arr = [...prev.faq];
                            arr[i] = { ...arr[i], question: { ...arr[i].question, bn: val } };
                            return { ...prev, faq: arr };
                          });
                        }}
                        className={`text-sm ${inputClass}`}
                        placeholder="প্রশ্ন (BN)"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Textarea
                        value={faq.answer.en}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((prev) => {
                            const arr = [...prev.faq];
                            arr[i] = { ...arr[i], answer: { ...arr[i].answer, en: val } };
                            return { ...prev, faq: arr };
                          });
                        }}
                        className={`text-sm ${inputClass}`}
                        placeholder="Answer (EN)"
                        rows={2}
                      />
                      <Textarea
                        value={faq.answer.bn}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((prev) => {
                            const arr = [...prev.faq];
                            arr[i] = { ...arr[i], answer: { ...arr[i].answer, bn: val } };
                            return { ...prev, faq: arr };
                          });
                        }}
                        className={`text-sm ${inputClass}`}
                        placeholder="উত্তর (BN)"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80 text-xs"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      faq: [...prev.faq, emptyFaq()],
                    }))
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
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, keywords: { ...prev.seo.keywords, en: v } },
                    }))}
                    placeholder="keyword"
                  />
                  <ArrayField
                    label="Keywords (BN)"
                    values={form.seo.keywords.bn}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, keywords: { ...prev.seo.keywords, bn: v } },
                    }))}
                    placeholder="কিওয়ার্ড"
                  />
                </div>
              </div>
            </div>

            {/* Deploy / Trial config */}
            <div className={sectionClass}>
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 pb-2 border-b border-border/50">
                <Settings2 className="w-4 h-4 text-primary" />
                Deploy / Trial config
              </h3>
              <p className="text-[11px] text-muted-foreground mb-4">
                Used by Option 1 shared demo and Option 2 installer packaging. Leave blank for non-trial products.
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className={labelClass}>API image</Label>
                    <Input
                      value={form.deploy_config.image_api}
                      onChange={(e) => setForm((prev) => ({
                        ...prev,
                        deploy_config: { ...prev.deploy_config, image_api: e.target.value },
                      }))}
                      className={inputClass}
                      placeholder="lifestyle-api:trial"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClass}>Shop image</Label>
                    <Input
                      value={form.deploy_config.image_shop}
                      onChange={(e) => setForm((prev) => ({
                        ...prev,
                        deploy_config: { ...prev.deploy_config, image_shop: e.target.value },
                      }))}
                      className={inputClass}
                      placeholder="lifestyle-shop:trial"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClass}>Admin image</Label>
                    <Input
                      value={form.deploy_config.image_admin}
                      onChange={(e) => setForm((prev) => ({
                        ...prev,
                        deploy_config: { ...prev.deploy_config, image_admin: e.target.value },
                      }))}
                      className={inputClass}
                      placeholder="lifestyle-admin:trial"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className={labelClass}>Default trial days</Label>
                    <AdminNumberInput
                      integer
                      min={1}
                      max={365}
                      emptyAs={14}
                      value={form.deploy_config.default_trial_days}
                      onValueChange={(n) => setForm((prev) => ({
                        ...prev,
                        deploy_config: {
                          ...prev.deploy_config,
                          default_trial_days: Math.min(365, Math.max(1, Math.trunc(n) || 1)),
                        },
                      }))}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-6">
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.deploy_config.supports_option1}
                        onChange={(e) => setForm((prev) => ({
                          ...prev,
                          deploy_config: { ...prev.deploy_config, supports_option1: e.target.checked },
                        }))}
                        className="rounded border-border"
                      />
                      Option 1
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.deploy_config.supports_option2}
                        onChange={(e) => setForm((prev) => ({
                          ...prev,
                          deploy_config: { ...prev.deploy_config, supports_option2: e.target.checked },
                        }))}
                        className="rounded border-border"
                      />
                      Option 2
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.deploy_config.shared_demo}
                        onChange={(e) => setForm((prev) => ({
                          ...prev,
                          deploy_config: { ...prev.deploy_config, shared_demo: e.target.checked },
                        }))}
                        className="rounded border-border"
                      />
                      Shared demo
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className={labelClass}>Shared demo shop URL</Label>
                    <Input
                      value={form.deploy_config.shared_demo_shop_url}
                      onChange={(e) => setForm((prev) => ({
                        ...prev,
                        deploy_config: { ...prev.deploy_config, shared_demo_shop_url: e.target.value },
                      }))}
                      className={inputClass}
                      placeholder="http://localhost:5100"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClass}>Shared demo admin URL</Label>
                    <Input
                      value={form.deploy_config.shared_demo_admin_url}
                      onChange={(e) => setForm((prev) => ({
                        ...prev,
                        deploy_config: { ...prev.deploy_config, shared_demo_admin_url: e.target.value },
                      }))}
                      className={inputClass}
                      placeholder="http://localhost:5174"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Live Preview ──────────────────────────── */}
          <div className="hidden xl:block overflow-y-auto min-h-0">
            <Card className="bg-card border-border overflow-hidden">
              <div className="p-3 border-b border-border bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Preview</p>
              </div>
              <CardContent className="p-4 space-y-4">
                {/* Thumbnail */}
                {form.thumbnail ? (
                  <img
                    src={resolveMediaUrl(form.thumbnail)}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-xl border border-border"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect fill="%231a1d2e" width="400" height="200"/><text x="200" y="100" text-anchor="middle" fill="%23666" font-size="14">No Image</text></svg>'; }}
                  />
                ) : (
                  <div className="w-full h-48 rounded-xl bg-muted flex items-center justify-center border border-border">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
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
                  <AdminPriceCell listBdt={form.price_bdt} listUsd={form.price_usd} discountPercent={form.discount_percent} />
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
                  {form.is_trialable && (
                    <Badge variant="outline" className="text-xs border-primary/20 text-primary bg-primary/10">
                      Trialable
                    </Badge>
                  )}
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

                {/* Gallery Preview */}
                {(form.images.admin.some((u) => u.trim()) || form.images.shop.some((u) => u.trim())) && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Gallery</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[...form.images.admin, ...form.images.shop].filter((u) => u.trim()).slice(0, 6).map((url, i) => (
                        <img
                          key={i}
                          src={resolveMediaUrl(url)}
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
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
            <span className="text-[11px] text-muted-foreground font-medium">Total</span>
            <span className="text-sm font-bold">{productStats.total}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Active</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{productStats.active}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <span className="text-[11px] text-amber-500 font-medium">
              <Star className="w-3 h-3 inline" />
            </span>
            <span className="text-sm font-bold text-amber-500">{productStats.featured}</span>
          </div>
          <Button onClick={openCreate} className="hero-gradient text-white hover:opacity-90 border-0 shadow-soft-sm h-9 text-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="admin-search flex-1 max-w-sm">
          <Search />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setCategoryFilter('all')} className={`admin-filter-pill ${categoryFilter === 'all' ? 'admin-filter-pill-active' : ''}`}>All</button>
          {uniqueCategories.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)} className={`admin-filter-pill ${categoryFilter === cat ? 'admin-filter-pill-active' : ''}`}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedProducts.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
          <span className="text-sm font-semibold text-primary">{selectedProducts.size} selected</span>
          <div className="flex items-center gap-1.5 ml-auto">
            <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10" onClick={() => handleBulkToggle('is_active', true)}>Activate</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs border-muted-foreground/30 text-muted-foreground hover:bg-muted" onClick={() => handleBulkToggle('is_active', false)}>Deactivate</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10" onClick={() => handleBulkToggle('is_featured', true)}>
              <Star className="w-3 h-3 mr-1" />Feature
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setSelectedProducts(new Set())}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      <div className="admin-card">
        <CardContent className="p-0">
          {isError ? (
            <div className="p-4">
              <QueryError what="products" error={error} onRetry={() => refetch()} />
            </div>
          ) : isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 bg-muted" />
              ))}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden p-3 space-y-3">
                {paginatedProducts?.map((product) => (
                  <div key={product.id} className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveMediaUrl(product.thumbnail)}
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
                        <AdminPriceCell listBdt={product.priceBDT} listUsd={product.priceUSD} discountPercent={product.discountPercent} />
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => openEdit(product)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted" title="Duplicate" onClick={() => handleDuplicate(product.id)}>
                        <Copy className="w-3.5 h-3.5" />
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
                      <th className="w-10">
                        <button onClick={selectAllProducts} className="flex items-center justify-center">
                          {allProductsSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground/40" />}
                        </button>
                      </th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts?.map((product) => (
                      <tr key={product.id} className={`admin-table-row group ${selectedProducts.has(product.id) ? 'bg-primary/[0.03]' : ''}`}>
                        <td onClick={() => toggleProductSelect(product.id)} className="cursor-pointer">
                          {selectedProducts.has(product.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60" />}
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-4">
                            <img src={resolveMediaUrl(product.thumbnail)} alt={product.name.en} className="w-12 h-10 object-cover rounded-lg border border-border/50 shadow-soft-sm" />
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
                          <AdminPriceCell listBdt={product.priceBDT} listUsd={product.priceUSD} discountPercent={product.discountPercent} />
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
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted" title="Duplicate" onClick={() => handleDuplicate(product.id)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => openEdit(product)}>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Showing {((safePage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered?.length || 0)} of {filtered?.length || 0}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" disabled={safePage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button key={page} onClick={() => setCurrentPage(page)} className={`h-7 w-7 rounded-md text-xs font-medium transition-all ${safePage === page ? 'bg-primary text-primary-foreground shadow-soft-sm' : 'text-muted-foreground hover:bg-muted'}`}>
                        {page}
                      </button>
                    ))}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" disabled={safePage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </div>

      {/* Delete Confirmation — typed confirm for an irreversible action (§12.3) */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete product"
        destructive
        typedConfirmWord="DELETE"
        confirmLabel="Delete product"
        busy={deleteProduct.isPending}
        onConfirm={handleDelete}
        description="This permanently removes the product. This action cannot be undone."
      />
    </div>
  );
};

export default AdminProductsPage;
