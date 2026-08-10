import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Package,
  Check,
  X,
  Image as ImageIcon,
  Tag,
  Loader2,
  Upload,
  UploadCloud,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  useComboBundle,
  useCreateComboBundle,
  useUpdateComboBundle,
} from "../hooks/useComboBundles";
import { getProducts } from "../api/products.api";
import { getImageUrl } from "../lib/imageUrl";
import {
  FormField,
  Input,
  Textarea,
  Toggle,
  PageHeader,
} from "../components/ui";
import ImageCropModal from "../components/ImageCropModal";

/* ─── Image Upload Drop Zone ─────────────────────────────────────────── */
function ImageUploadZone({ value, onChange }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [cropFile, setCropFile] = useState(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setCropFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <>
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1.5">
          থাম্বনেইল ছবি
        </label>

        {value ? (
          /* ── Uploaded image preview ── */
          <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 group">
            <img
              src={getImageUrl(value)}
              alt="combo thumbnail"
              className="w-full h-44 object-cover"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg hover:bg-slate-50 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                পরিবর্তন
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="flex items-center gap-1.5 rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:bg-red-600 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                সরান
              </button>
            </div>
          </div>
        ) : (
          /* ── Drop zone ── */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-[#e91e63] bg-pink-50/50 scale-[1.01]"
                : "border-slate-200 hover:border-[#e91e63]/50 hover:bg-pink-50/20"
            }`}
          >
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)",
              }}
            >
              <UploadCloud className="h-7 w-7 text-[#e91e63]" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              ছবি আপলোড করুন
            </p>
            <p className="text-xs text-slate-400 mt-1">
              ড্র্যাগ করুন বা ক্লিক করুন • JPG, PNG, WebP
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              ক্রপ করার সুযোগ পাবেন
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {/* Crop modal */}
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          aspect={1}
          label="কম্বো থাম্বনেইল"
          onDone={(url) => {
            onChange(url);
            setCropFile(null);
          }}
          onCancel={() => setCropFile(null)}
        />
      )}
    </>
  );
}

/* ─── Product Picker Modal ────────────────────────────────────────────── */
function ProductPickerModal({ isOpen, onClose, onAdd, selectedIds }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["products-picker", search, page],
    queryFn: () => getProducts({ search, page, limit: 12 }),
    enabled: isOpen,
    keepPreviousData: true,
  });

  const products = data?.products || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-[#0f172a]">পণ্য বেছে নিন</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedIds.length} টি সিলেক্ট করা হয়েছে
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="input pl-9 w-full"
              placeholder="নাম দিয়ে পণ্য খুঁজুন..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl bg-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Package className="h-10 w-10 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">কোনো পণ্য পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {products.map((product) => {
                const isSelected = selectedIds.includes(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => onAdd(product)}
                    className={`relative group text-left rounded-xl border-2 transition-all duration-150 p-2.5 ${
                      isSelected
                        ? "border-[#e91e63] bg-pink-50"
                        : "border-slate-100 hover:border-[#e91e63]/50 hover:bg-slate-50"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[#e91e63] flex items-center justify-center shadow-sm z-10">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {product.image ? (
                      <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        className="h-16 w-full rounded-lg object-cover mb-2"
                      />
                    ) : (
                      <div className="h-16 w-full rounded-lg bg-slate-100 mb-2 flex items-center justify-center">
                        <Package className="h-6 w-6 text-slate-300" />
                      </div>
                    )}
                    <p className="text-xs font-semibold text-[#0f172a] leading-tight line-clamp-2">
                      {product.name}
                    </p>
                    <p className="text-xs text-[#e91e63] font-bold mt-1">
                      ৳{Number(product.price).toLocaleString()}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="flex items-center justify-center gap-2 px-6 py-3 border-t border-slate-100">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn-secondary !py-1.5 !px-3 text-xs disabled:opacity-40"
            >
              ◀ আগে
            </button>
            <span className="text-xs text-slate-500">
              {page} / {data.pages}
            </span>
            <button
              disabled={page === data.pages}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary !py-1.5 !px-3 text-xs disabled:opacity-40"
            >
              পরে ▶
            </button>
          </div>
        )}

        <div className="px-6 py-3 border-t border-slate-100">
          <button onClick={onClose} className="btn-primary w-full">
            সম্পন্ন ({selectedIds.length} টি সিলেক্ট)
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Combo Form ─────────────────────────────────────────────────────── */
const EMPTY = {
  name: "",
  name_bn: "",
  description: "",
  short_description: "",
  image: "",
  images: [],
  bundle_price: "",
  original_price: "",
  in_stock: true,
  stock_qty: 0,
  is_active: true,
  is_featured: false,
  sort_order: 0,
  tags: [],
  items: [],
};

export default function ComboForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existing, isLoading: loadingExisting } = useComboBundle(id);
  const createMut = useCreateComboBundle();
  const updateMut = useUpdateComboBundle();

  const [form, setForm] = useState(EMPTY);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tab, setTab] = useState("basic");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (existing?.combo) {
      const c = existing.combo;
      setForm({
        name: c.name || "",
        name_bn: c.name_bn || "",
        description: c.description || "",
        short_description: c.short_description || "",
        image: c.image || "",
        images: c.images || [],
        bundle_price: c.bundle_price || "",
        original_price: c.original_price || "",
        in_stock: c.in_stock !== false,
        stock_qty: c.stock_qty || 0,
        is_active: c.is_active !== false,
        is_featured: !!c.is_featured,
        sort_order: c.sort_order || 0,
        tags: c.tags || [],
        items: (c.items || []).map((i) => ({
          product_id: i.product_id,
          qty: i.qty || 1,
          custom_label: i.custom_label || "",
          _product: i.product,
        })),
      });
    }
  }, [existing]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const computedOriginal = form.items.reduce((sum, item) => {
    const op = Number(
      item._product?.original_price || item._product?.price || 0,
    );
    return sum + op * (item.qty || 1);
  }, 0);

  const discPct =
    form.bundle_price && computedOriginal > 0
      ? Math.max(
          0,
          Math.round(
            ((computedOriginal - Number(form.bundle_price)) /
              computedOriginal) *
              100,
          ),
        )
      : 0;

  const handleAddProduct = useCallback((product) => {
    setForm((f) => {
      const exists = f.items.find((i) => i.product_id === product.id);
      if (exists) {
        return {
          ...f,
          items: f.items.filter((i) => i.product_id !== product.id),
        };
      }
      return {
        ...f,
        items: [
          ...f.items,
          {
            product_id: product.id,
            qty: 1,
            custom_label: "",
            _product: product,
          },
        ],
      };
    });
  }, []);

  const updateItem = (product_id, key, val) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((i) =>
        i.product_id === product_id ? { ...i, [key]: val } : i,
      ),
    }));
  };

  const removeItem = (product_id) => {
    setForm((f) => ({
      ...f,
      items: f.items.filter((i) => i.product_id !== product_id),
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "কম্বোর নাম আবশ্যক";
    if (!form.bundle_price) e.bundle_price = "বান্ডেল মূল্য আবশ্যক";
    if (form.items.length === 0) e.items = "কমপক্ষে একটি পণ্য যোগ করুন";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      // Switch to the tab with the first error
      if (errors.name) setTab("basic");
      else if (errors.items) setTab("items");
      else if (errors.bundle_price) setTab("pricing");
      return;
    }
    const payload = {
      ...form,
      bundle_price: Number(form.bundle_price),
      original_price:
        Number(form.original_price) ||
        computedOriginal ||
        Number(form.bundle_price),
      stock_qty: Number(form.stock_qty),
      sort_order: Number(form.sort_order),
      items: form.items.map(({ _product, ...rest }) => rest),
    };
    if (isEdit) {
      updateMut.mutate(
        { id, data: payload },
        { onSuccess: () => navigate("/combo-bundles") },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => navigate("/combo-bundles"),
      });
    }
  };

  const isSaving = createMut.isPending || updateMut.isPending;
  const selectedIds = form.items.map((i) => i.product_id);

  if (isEdit && loadingExisting) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#e91e63]" />
      </div>
    );
  }

  const tabs = [
    { id: "basic", label: "📝 মূল তথ্য", hasError: !!errors.name },
    {
      id: "items",
      label: `📦 পণ্যসমূহ (${form.items.length})`,
      hasError: !!errors.items,
    },
    { id: "pricing", label: "💰 মূল্য", hasError: !!errors.bundle_price },
    { id: "settings", label: "⚙️ সেটিংস", hasError: false },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/combo-bundles")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageHeader
          title={isEdit ? "কম্বো সম্পাদনা" : "নতুন কম্বো বান্ডেল"}
          subtitle={
            isEdit ? `#${id} সম্পাদনা করছেন` : "নতুন কম্বো বান্ডেল তৈরি করুন"
          }
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        {/* ── Left: Main content ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab Nav */}
          <div className="card !p-0">
            <div className="flex border-b border-slate-100 overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`relative px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    tab === t.id
                      ? "border-[#e91e63] text-[#e91e63]"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t.label}
                  {t.hasError && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-5">
              {/* ── TAB: Basic ── */}
              {tab === "basic" && (
                <>
                  <Input
                    label="কম্বোর নাম *"
                    placeholder="যেমন: স্কিনকেয়ার প্রিমিয়াম কিট"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    required
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 -mt-3">{errors.name}</p>
                  )}
                  <Input
                    label="বাংলা নাম"
                    placeholder="বাংলায় কম্বোর নাম (ঐচ্ছিক)"
                    value={form.name_bn || ""}
                    onChange={(e) => set("name_bn", e.target.value)}
                    hint="না দিলে ইংরেজি নামই শপে দেখাবে"
                  />
                  <Textarea
                    label="পূর্ণ বিবরণ"
                    rows={4}
                    placeholder="কম্বোর বিস্তারিত বিবরণ..."
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                  <Textarea
                    label="সংক্ষিপ্ত বিবরণ"
                    rows={2}
                    placeholder="সংক্ষিপ্ত বিবরণ (listing-এ দেখাবে)..."
                    value={form.short_description}
                    onChange={(e) => set("short_description", e.target.value)}
                  />

                  {/* Image upload with cropper */}
                  <ImageUploadZone
                    value={form.image}
                    onChange={(url) => set("image", url)}
                  />
                </>
              )}

              {/* ── TAB: Items ── */}
              {tab === "items" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#0f172a]">
                        কম্বোর পণ্যসমূহ
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        এই কম্বোতে কোন কোন পণ্য থাকবে তা বেছে নিন
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="btn-primary !py-2 !px-4 text-sm"
                    >
                      <Plus className="h-3.5 w-3.5" /> পণ্য যোগ
                    </button>
                  </div>

                  {errors.items && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                      <span>⚠️</span> {errors.items}
                    </div>
                  )}

                  {form.items.length === 0 ? (
                    <div
                      className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center cursor-pointer hover:border-[#e91e63]/50 hover:bg-pink-50/30 transition-all"
                      onClick={() => setPickerOpen(true)}
                    >
                      <Package className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400 font-medium">
                        পণ্য যোগ করতে এখানে ক্লিক করুন
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        বিদ্যমান পণ্য থেকে বেছে নিন
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {form.items.map((item) => (
                        <div
                          key={item.product_id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 group"
                        >
                          {item._product?.image ? (
                            <img
                              src={getImageUrl(item._product.image)}
                              alt={item._product?.name}
                              className="h-12 w-12 rounded-lg object-cover border border-slate-100 shrink-0"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <Package className="h-5 w-5 text-slate-300" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0f172a] truncate">
                              {item._product?.name ||
                                `পণ্য #${item.product_id}`}
                            </p>
                            <p className="text-xs text-slate-400">
                              MRP: ৳
                              {Number(
                                item._product?.original_price ||
                                  item._product?.price ||
                                  0,
                              ).toLocaleString()}
                            </p>
                            <input
                              className="mt-1 text-xs border border-slate-200 rounded-lg px-2 py-1 w-full max-w-[220px] focus:outline-none focus:border-[#e91e63] bg-white"
                              placeholder="কাস্টম লেবেল (ঐচ্ছিক)"
                              value={item.custom_label}
                              onChange={(e) =>
                                updateItem(
                                  item.product_id,
                                  "custom_label",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          {/* Qty stepper */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                updateItem(
                                  item.product_id,
                                  "qty",
                                  Math.max(1, item.qty - 1),
                                )
                              }
                              className="h-7 w-7 rounded-lg border border-slate-200 text-slate-500 hover:border-[#e91e63] hover:text-[#e91e63] flex items-center justify-center text-sm font-bold transition-colors"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-[#0f172a]">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateItem(item.product_id, "qty", item.qty + 1)
                              }
                              className="h-7 w-7 rounded-lg border border-slate-200 text-slate-500 hover:border-[#e91e63] hover:text-[#e91e63] flex items-center justify-center text-sm font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.product_id)}
                            className="shrink-0 text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                      {computedOriginal > 0 && (
                        <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                          <p className="text-xs font-semibold text-emerald-800">
                            মোট MRP (স্বয়ংক্রিয়): ৳
                            {computedOriginal.toLocaleString()}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              set("original_price", computedOriginal);
                              setTab("pricing");
                            }}
                            className="text-xs text-emerald-600 hover:underline mt-0.5"
                          >
                            → "আসল মূল্য" ঘরে পূরণ করে মূল্য ট্যাবে যান
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB: Pricing ── */}
              {tab === "pricing" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="বান্ডেল মূল্য (চূড়ান্ত) *"
                        type="number"
                        placeholder="2499"
                        value={form.bundle_price}
                        onChange={(e) => set("bundle_price", e.target.value)}
                        required
                        hint="এটি গ্রাহক যে মূল্যে কিনবেন"
                      />
                      {errors.bundle_price && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.bundle_price}
                        </p>
                      )}
                    </div>
                    <div>
                      <Input
                        label="আসল মূল্য (MRP)"
                        type="number"
                        placeholder={computedOriginal || "3999"}
                        value={form.original_price}
                        onChange={(e) => set("original_price", e.target.value)}
                        hint="কেটে দেখানো হবে"
                      />
                      {computedOriginal > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            set("original_price", computedOriginal)
                          }
                          className="text-[11px] text-[#e91e63] hover:underline mt-1"
                        >
                          স্বয়ংক্রিয়: ৳{computedOriginal.toLocaleString()}{" "}
                          ব্যবহার করুন
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Discount preview */}
                  {discPct > 0 && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100">
                      <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">
                        ছাড়ের হিসাব
                      </p>
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="text-center">
                          <p className="text-3xl font-extrabold text-emerald-700">
                            {discPct}%
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">ছাড়</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-extrabold text-[#0f172a]">
                            ৳
                            {(
                              computedOriginal - Number(form.bundle_price)
                            ).toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            সাশ্রয়
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-extrabold text-[#e91e63]">
                            ৳{Number(form.bundle_price).toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            চূড়ান্ত মূল্য
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="স্টক পরিমাণ"
                      type="number"
                      value={form.stock_qty}
                      onChange={(e) => set("stock_qty", e.target.value)}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-600">
                        স্টকে আছে
                      </label>
                      <Toggle
                        checked={form.in_stock}
                        onChange={(v) => set("in_stock", v)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: Settings ── */}
              {tab === "settings" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-slate-600">
                        সক্রিয়
                      </label>
                      <Toggle
                        checked={form.is_active}
                        onChange={(v) => set("is_active", v)}
                      />
                      <p className="text-[11px] text-slate-400">
                        সক্রিয় থাকলে শপে দেখাবে
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-slate-600">
                        ফিচার্ড
                      </label>
                      <Toggle
                        checked={form.is_featured}
                        onChange={(v) => set("is_featured", v)}
                      />
                      <p className="text-[11px] text-slate-400">
                        হোমপেজে হাইলাইট হবে
                      </p>
                    </div>
                  </div>
                  <Input
                    label="ক্রমবিন্যাস (Sort Order)"
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => set("sort_order", e.target.value)}
                    hint="ছোট সংখ্যা আগে দেখাবে (0 = সবার আগে)"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Actions + Preview ── */}
        <div className="space-y-4">
          {/* Save */}
          <div className="card space-y-3">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  সংরক্ষণ হচ্ছে...
                </span>
              ) : isEdit ? (
                "আপডেট করুন"
              ) : (
                "কম্বো তৈরি করুন"
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/combo-bundles")}
              className="btn-secondary w-full"
            >
              বাতিল
            </button>

            {/* Validation summary */}
            {Object.keys(errors).length > 0 && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-3 space-y-1">
                <p className="text-xs font-semibold text-red-600">
                  ⚠️ ফর্ম সম্পূর্ণ করুন:
                </p>
                {Object.values(errors).map((err, i) => (
                  <p key={i} className="text-xs text-red-500">
                    • {err}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Preview Card */}
          <div className="card space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              প্রিভিউ
            </p>
            {form.image ? (
              <img
                src={getImageUrl(form.image)}
                alt="preview"
                className="w-full h-36 object-cover rounded-xl border border-slate-100"
              />
            ) : (
              <div className="w-full h-36 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                <Package className="h-10 w-10 text-rose-300" />
              </div>
            )}
            <p className="font-bold text-sm text-[#0f172a]">
              {form.name || "কম্বোর নাম"}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-extrabold text-[#e91e63]">
                {form.bundle_price
                  ? `৳${Number(form.bundle_price).toLocaleString()}`
                  : "—"}
              </span>
              {(Number(form.original_price) || computedOriginal) > 0 && (
                <span className="text-sm text-slate-400 line-through">
                  ৳
                  {Number(
                    form.original_price || computedOriginal,
                  ).toLocaleString()}
                </span>
              )}
              {discPct > 0 && (
                <span className="text-xs font-bold text-white bg-[#e91e63] px-2 py-0.5 rounded-full">
                  {discPct}% ছাড়
                </span>
              )}
            </div>
            {form.items.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  অন্তর্ভুক্ত পণ্য ({form.items.length})
                </p>
                {form.items.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center gap-2 text-xs"
                  >
                    <div className="h-2 w-2 rounded-full bg-[#e91e63] shrink-0" />
                    <span className="text-slate-600 truncate">
                      {item.custom_label ||
                        item._product?.name ||
                        `পণ্য #${item.product_id}`}
                    </span>
                    {item.qty > 1 && (
                      <span className="text-slate-400 shrink-0">
                        ×{item.qty}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick tips */}
          <div className="card !bg-gradient-to-br !from-pink-50 !to-rose-50 border-pink-100 space-y-2">
            <p className="text-xs font-semibold text-[#e91e63]">💡 টিপস</p>
            <ul className="space-y-1.5">
              {[
                "থাম্বনেইল ছবি 1:1 অনুপাতে crop করুন",
                "পণ্য যোগ করলে MRP স্বয়ংক্রিয় হিসাব হয়",
                "বান্ডেল মূল্য MRP-র চেয়ে কম রাখুন",
              ].map((tip, i) => (
                <li
                  key={i}
                  className="text-[11px] text-pink-700 flex items-start gap-1.5"
                >
                  <span className="shrink-0 mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </form>

      {/* Product picker */}
      <ProductPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={handleAddProduct}
        selectedIds={selectedIds}
      />
    </div>
  );
}
