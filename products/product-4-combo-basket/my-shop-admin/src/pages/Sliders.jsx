import { useState, useRef, useCallback, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Image as ImageIcon,
  Palette,
  Package,
  Copy,
  Search,
  X,
  Upload,
  GripVertical,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  UploadCloud,
  FileImage,
  Truck,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  AlignLeft,
  Save,
  Loader2,
  Tag,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../api/products.api";
import { uploadSliderBanner } from "../api/sliders.api";
import {
  useSliders,
  useCreateSlider,
  useUpdateSlider,
  useDeleteSlider,
  useReorderSliders,
  useDuplicateSlider,
} from "../hooks/useSliders";
import {
  PageHeader,
  Input,
  Textarea,
  Select,
  ColorPicker,
} from "../components/ui";

import { ENV } from '../config/env';

const API_BASE = ENV.IMAGE_BASE_URL;
const imgSrc = (url) => {
  if (!url) return "";
  // Strip old localhost URLs (any port) → rebuild with correct base
  const cleaned = url.replace(/^https?:\/\/localhost:\d+/, "");
  if (cleaned !== url) return `${API_BASE}${cleaned}`;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
};

// ── Constants ──────────────────────────────────────────────────────────────
const EMPTY = {
  title: "",
  subtitle: "",
  highlight: "",
  description: "",
  badge: "NEW",
  badge_color: "from-pink-500 to-rose-600",
  banner_image: "",
  accent_from: "#e91e63",
  accent_to: "#ff4081",
  bg_from: "#0f172a",
  bg_via: "#1a1035",
  bg_to: "#1e0a2e",
  price: "",
  original_price: "",
  discount: "",
  link: "/products",
  cta_text: "এখনই কিনুন",
  cta_secondary: "সব পণ্য দেখুন",
  button_style: "gradient",
  product_id: "",
  sort_order: 0,
  is_active: true,
  category: "",
  free_delivery: false,
  authentic: false,
};

const BADGE_PRESETS = [
  { label: "Pink", value: "from-pink-500 to-rose-600" },
  { label: "Violet", value: "from-violet-500 to-purple-600" },
  { label: "Teal", value: "from-teal-500 to-emerald-600" },
  { label: "Orange", value: "from-orange-500 to-red-600" },
  { label: "Blue", value: "from-blue-500 to-indigo-600" },
  { label: "Sky", value: "from-sky-500 to-blue-600" },
  { label: "Amber", value: "from-amber-500 to-yellow-600" },
];

const BUTTON_STYLES = [
  { value: "gradient", label: "গ্র্যাডিয়েন্ট (ডিফল্ট)" },
  { value: "solid", label: "সলিড" },
  { value: "outline", label: "আউটলাইন" },
];

// ── Searchable Product Combobox ─────────────────────────────────────────────
function ProductCombobox({ products, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const selected = products.find((p) => String(p.id) === String(value));
  const filtered = products
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 40);

  // Close on outside click
  const handleBlur = useCallback((e) => {
    if (ref.current && !ref.current.contains(e.relatedTarget)) setOpen(false);
  }, []);

  // Compute pricing from new model (price=MRP, discount_amount=flat discount)
  const pricingOf = (p) => {
    const mrp = Number(p.price || 0);
    const discountAmt = Number(p.discount_amount || 0);
    const sellPrice = discountAmt > 0 ? Math.max(0, mrp - discountAmt) : mrp;
    const discountPct =
      discountAmt > 0 && mrp > 0 ? Math.round((discountAmt / mrp) * 100) : 0;
    return { mrp, sellPrice, discountAmt, discountPct };
  };

  return (
    <div className="relative" ref={ref} onBlur={handleBlur}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
        }}
        className="input flex w-full items-center justify-between gap-2 text-left min-h-[44px]"
      >
        {selected ? (
          (() => {
            const { mrp, sellPrice, discountAmt, discountPct } =
              pricingOf(selected);
            return (
              <span className="flex items-center gap-2.5 flex-1 min-w-0">
                {selected.image && (
                  <img
                    src={imgSrc(selected.image)}
                    alt=""
                    className="h-8 w-8 rounded-lg object-cover flex-none border border-slate-100"
                  />
                )}
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#0f172a]">
                    {selected.name}
                  </span>
                  <span className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-bold text-[#e91e63]">
                      ৳{sellPrice.toLocaleString()}
                    </span>
                    {discountAmt > 0 && (
                      <>
                        <span className="text-[10px] text-slate-400 line-through">
                          ৳{mrp.toLocaleString()}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                          -{discountPct}% ছাড়
                        </span>
                      </>
                    )}
                  </span>
                </span>
              </span>
            );
          })()
        ) : (
          <span className="text-slate-400 text-sm">
            — কোনো পণ্য নেই (ঐচ্ছিক) —
          </span>
        )}
        <ChevronDown className="h-4 w-4 flex-none text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search className="h-3.5 w-3.5 flex-none text-slate-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="পণ্য খুঁজুন..."
              className="w-full bg-transparent text-sm outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Option list */}
          <ul className="max-h-72 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:bg-slate-50"
              >
                <X className="h-4 w-4" /> — কোনো পণ্য নেই —
              </button>
            </li>
            {filtered.map((p) => {
              const isSelected = String(p.id) === String(value);
              const { mrp, sellPrice, discountAmt, discountPct } = pricingOf(p);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(p.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-pink-50/40 ${
                      isSelected ? "bg-pink-50" : ""
                    }`}
                  >
                    {/* Image */}
                    {p.image ? (
                      <img
                        src={imgSrc(p.image)}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover flex-none border border-slate-100"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-none">
                        <Package className="h-4 w-4 text-slate-300" />
                      </div>
                    )}

                    {/* Product info */}
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate font-semibold text-[#0f172a] text-sm">
                        {p.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-xs font-bold text-[#e91e63]">
                          ৳{sellPrice.toLocaleString()}
                        </span>
                        {discountAmt > 0 && (
                          <>
                            <span className="text-[10px] text-slate-400 line-through">
                              ৳{mrp.toLocaleString()}
                            </span>
                            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                              -{discountPct}% ছাড়
                            </span>
                            <span className="text-[9px] text-slate-400">
                              (৳{discountAmt.toLocaleString()} বাদ)
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 flex-none text-[#e91e63]" />
                    )}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-slate-400">
                কোনো পণ্য পাওয়া যায়নি
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Banner Image Upload (drag-and-drop zone) ────────────────────────────────
function BannerImageInput({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const res = await uploadSliderBanner(file);
      if (res.url) onChange(res.url);
    } catch (err) {
      alert("আপলোড ব্যর্থ: " + (err?.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-2">
      {/* Preview */}
      {value ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-slate-100 group">
          <img
            src={value.startsWith("http") ? value : imgSrc(value)}
            alt="banner preview"
            className="h-36 w-full object-cover"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-black/50 transition-all">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md hover:bg-slate-50 transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {uploading ? "আপলোড..." : "পরিবর্তন"}
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex items-center gap-1.5 rounded-xl bg-red-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-red-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> সরান
            </button>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-8 cursor-pointer transition-all duration-200 ${
            dragOver
              ? "border-[#e91e63] bg-pink-50/60 scale-[1.01]"
              : "border-slate-200 hover:border-[#e91e63]/50 hover:bg-pink-50/20"
          }`}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-[#e91e63]" />
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: "linear-gradient(135deg,#fce4ec,#f8bbd9)" }}
            >
              <UploadCloud className="h-6 w-6 text-[#e91e63]" />
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              {uploading ? "আপলোড হচ্ছে..." : "ব্যানার ছবি আপলোড করুন"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              ড্র্যাগ করুন বা ক্লিক করুন · JPG, PNG, WebP
            </p>
          </div>
        </div>
      )}

      {/* URL manual input */}
      <div className="flex items-center gap-2">
        <div className="flex h-px flex-1 bg-slate-100" />
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
          অথবা URL
        </span>
        <div className="flex h-px flex-1 bg-slate-100" />
      </div>
      <input
        className="input text-xs"
        placeholder="https://example.com/banner.jpg"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

// ── Live Preview ────────────────────────────────────────────────────────────
function SliderPreview({ form, product }) {
  const displayImage = form.banner_image
    ? form.banner_image.startsWith("http")
      ? form.banner_image
      : imgSrc(form.banner_image)
    : product?.image
      ? imgSrc(product.image)
      : null;
  const displayPrice =
    form.price ||
    (product ? `BDT ${Number(product.price).toLocaleString()}` : "");
  const ctaText = form.cta_text || "এখনই কিনুন";

  return (
    <div
      className="relative overflow-hidden rounded-2xl text-white"
      style={{
        background: `linear-gradient(135deg, ${form.bg_from}, ${form.bg_via}, ${form.bg_to})`,
        minHeight: 220,
        padding: "20px",
      }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl opacity-20"
        style={{ background: form.accent_from }}
      />
      <div className="relative z-10 space-y-2">
        {form.subtitle && (
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/50">
            {form.subtitle}
          </p>
        )}
        <span
          className={`inline-block rounded-full bg-gradient-to-r ${form.badge_color} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`}
        >
          {form.badge || "BADGE"}
        </span>
        <h3 className="text-lg font-bold leading-tight">
          {form.title || "Slide Title"}{" "}
          {form.highlight && (
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${form.accent_from}, ${form.accent_to})`,
              }}
            >
              {form.highlight}
            </span>
          )}
        </h3>
        <p className="text-xs text-white/60 line-clamp-2">
          {form.description || "বিবরণ দেখাবে এখানে..."}
        </p>
        {displayPrice && (
          <p className="text-xl font-black" style={{ color: form.accent_from }}>
            {displayPrice}
            {form.original_price && (
              <span className="ml-2 text-sm font-normal text-white/40 line-through">
                {form.original_price}
              </span>
            )}
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <span
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{
              background:
                form.button_style === "gradient"
                  ? `linear-gradient(135deg, ${form.accent_from}, ${form.accent_to})`
                  : form.button_style === "solid"
                    ? form.accent_from
                    : "transparent",
              border:
                form.button_style === "outline"
                  ? `1.5px solid ${form.accent_from}`
                  : "none",
              color:
                form.button_style === "outline" ? form.accent_from : "white",
            }}
          >
            {ctaText}
          </span>
          {form.cta_secondary && (
            <span className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/70">
              {form.cta_secondary}
            </span>
          )}
        </div>
        {displayImage && (
          <img
            src={displayImage}
            alt="preview"
            className="mt-2 h-24 w-full rounded-xl object-cover opacity-85"
          />
        )}
      </div>
    </div>
  );
}

// ── Drag-reorderable Slider Row ─────────────────────────────────────────────
function SliderRow({
  s,
  onEdit,
  onDelete,
  onDuplicate,
  onToggle,
  onDragStart,
  onDragOver,
  onDrop,
}) {
  return (
    <div
      className="card p-0 overflow-hidden transition-shadow hover:shadow-md"
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-3 p-4">
        {/* Drag handle */}
        <div className="cursor-grab text-slate-300 hover:text-slate-400 active:cursor-grabbing">
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Thumbnail */}
        <div
          className="flex h-14 w-20 flex-none items-center justify-center overflow-hidden rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${s.bg_from}, ${s.bg_via}, ${s.bg_to})`,
          }}
        >
          {s.banner_image || s.product?.image ? (
            <img
              src={
                s.banner_image
                  ? s.banner_image.startsWith("http")
                    ? s.banner_image
                    : imgSrc(s.banner_image)
                  : imgSrc(s.product.image)
              }
              alt={s.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <Layers className="h-5 w-5 text-white/30" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-[#0f172a]">
              {s.title} {s.highlight}
            </p>
            <span
              className={`inline-block shrink-0 rounded-full bg-gradient-to-r ${s.badge_color} px-2 py-0.5 text-[9px] font-bold text-white`}
            >
              {s.badge}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {s.description}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            {s.price && (
              <span className="font-semibold text-[#e91e63]">{s.price}</span>
            )}
            {s.product && (
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {s.product.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              {s.link}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick active toggle */}
          <button
            onClick={() => onToggle(s)}
            title={
              s.is_active
                ? "সক্রিয় — ক্লিক করে নিষ্ক্রিয় করুন"
                : "নিষ্ক্রিয় — ক্লিক করে সক্রিয় করুন"
            }
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors ${
              s.is_active
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {s.is_active ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
            {s.is_active ? "সক্রিয়" : "লুকানো"}
          </button>

          <button
            onClick={() => onEdit(s)}
            title="এডিট"
            className="btn-outline !px-2 !py-1 text-xs"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => onDuplicate(s.id)}
            title="কপি"
            className="flex items-center rounded-xl border border-slate-200 px-2 py-1 text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => {
              if (confirm("এই স্লাইড মুছে ফেলবেন?")) onDelete(s.id);
            }}
            title="মুছুন"
            className="flex items-center rounded-xl border border-red-200 px-2 py-1 text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function SlidersPage() {
  const [form, setForm] = useState(null);
  const [tab, setTab] = useState("content");
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  const { data, isLoading } = useSliders();
  const { data: productsData } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => getProducts({ limit: 500 }),
  });
  const products = productsData?.products || [];

  const createMut = useCreateSlider();
  const updateMut = useUpdateSlider();
  const deleteMut = useDeleteSlider();
  const reorderMut = useReorderSliders();
  const duplicateMut = useDuplicateSlider();

  const [localSliders, setLocalSliders] = useState([]);

  // Sync whenever API data changes (also handles initial load)
  useEffect(() => {
    if (data?.sliders) setLocalSliders(data.sliders);
  }, [data?.sliders]);

  const sliders = localSliders;

  const linkedProduct = form?.product_id
    ? products.find((p) => String(p.id) === String(form.product_id))
    : null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleProductSelect = (productId) => {
    const p = products.find((p) => String(p.id) === String(productId));
    if (p) {
      // Use new pricing model: price = MRP, discount_amount = flat discount, sell_price = final price
      const mrp = Number(p.price || 0);
      const discountAmt = Number(p.discount_amount || 0);
      const sellPrice = discountAmt > 0 ? Math.max(0, mrp - discountAmt) : mrp;
      const discountPct =
        discountAmt > 0 && mrp > 0 ? Math.round((discountAmt / mrp) * 100) : 0;

      setForm((f) => ({
        ...f,
        product_id: productId,
        price: `BDT ${sellPrice.toLocaleString()}`,
        original_price: discountAmt > 0 ? `BDT ${mrp.toLocaleString()}` : "",
        discount: discountPct > 0 ? `${discountPct}% OFF` : "",
        link: `/products/${p.slug}`,
        title: f.title || p.name,
        banner_image: f.banner_image || p.image || "",
      }));
    } else {
      setForm((f) => ({ ...f, product_id: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      product_id: form.product_id || null,
      sort_order: Number(form.sort_order) || 0,
    };
    if (form.id) {
      await updateMut.mutateAsync({ id: form.id, data: payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    setForm(null);
  };

  const handleToggle = async (s) => {
    // Optimistic local update
    setLocalSliders((prev) =>
      prev.map((sl) =>
        sl.id === s.id ? { ...sl, is_active: !sl.is_active } : sl,
      ),
    );
    await updateMut.mutateAsync({
      id: s.id,
      data: { is_active: !s.is_active },
    });
  };

  // Drag-and-drop reorder
  const handleDrop = async (dropIdx) => {
    if (dragIdx === null || dragIdx === dropIdx) return;
    const arr = [...sliders];
    const [moved] = arr.splice(dragIdx, 1);
    arr.splice(dropIdx, 0, moved);
    setLocalSliders(arr);
    setDragIdx(null);
    setOverIdx(null);
    await reorderMut.mutateAsync(
      arr.map((s, i) => ({ id: s.id, sort_order: i })),
    );
  };

  const TABS = [
    { id: "content", icon: AlignLeft, label: "কন্টেন্ট" },
    { id: "style", icon: Palette, label: "স্টাইল" },
    { id: "link", icon: LinkIcon, label: "পণ্য ও লিঙ্ক" },
  ];

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-5">
      <PageHeader
        title="হিরো স্লাইডার"
        subtitle={`${sliders.length} টি স্লাইড · সক্রিয়: ${sliders.filter((s) => s.is_active).length}`}
        action={
          <button
            onClick={() => {
              setForm(EMPTY);
              setTab("content");
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> নতুন স্লাইড
          </button>
        }
      />

      {/* Instructions */}
      {sliders.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-xs text-blue-600">
          <GripVertical className="h-4 w-4 flex-none" />
          স্লাইডগুলো ড্র্যাগ করে ক্রম পরিবর্তন করুন · Status badge ক্লিক করে
          সক্রিয়/নিষ্ক্রিয় করুন
        </div>
      )}

      {/* Slider List */}
      <div className="space-y-2">
        {isLoading && (
          <p className="py-8 text-center text-slate-400">লোড হচ্ছে...</p>
        )}
        {!isLoading && sliders.length === 0 && (
          <div className="card flex flex-col items-center py-16 text-center">
            <Layers className="mb-3 h-10 w-10 text-slate-200" />
            <p className="font-semibold text-slate-400">কোনো স্লাইড নেই</p>
            <p className="mt-1 text-sm text-slate-300">নতুন স্লাইড যোগ করুন</p>
          </div>
        )}
        {sliders.map((s, idx) => (
          <div
            key={s.id}
            className={`transition-all duration-200 ${overIdx === idx && dragIdx !== idx ? "ring-2 ring-[#e91e63]/30 ring-offset-1 rounded-2xl" : ""}`}
          >
            <SliderRow
              s={s}
              onEdit={(s) => {
                setForm({ ...s, product_id: s.product_id || "" });
                setTab("content");
              }}
              onDelete={(id) => {
                deleteMut.mutate(id);
              }}
              onDuplicate={(id) => {
                duplicateMut.mutate(id);
              }}
              onToggle={handleToggle}
              onDragStart={() => setDragIdx(idx)}
              onDragOver={() => setOverIdx(idx)}
              onDrop={() => handleDrop(idx)}
            />
          </div>
        ))}
      </div>

      {/* ── Modal ── */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-6 backdrop-blur-sm">
          <div className="w-full max-w-4xl">
            <div className="card p-0 overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#e91e63]" />
                  <h2 className="text-base font-bold text-[#0f172a]">
                    {form.id ? "স্লাইড এডিট করুন" : "নতুন স্লাইড তৈরি করুন"}
                  </h2>
                </div>
                <button
                  onClick={() => setForm(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                {/* ── Left: Form ── */}
                <div className="lg:col-span-3 border-r border-slate-100">
                  {/* Tabs */}
                  <div className="flex border-b border-slate-100 bg-slate-50/50">
                    {TABS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={`relative flex flex-1 flex-col items-center gap-1 py-3.5 text-[10px] font-semibold transition-all ${
                          tab === t.id
                            ? "text-[#e91e63]"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        <t.icon
                          className={`h-4 w-4 ${
                            tab === t.id ? "text-[#e91e63]" : "text-slate-400"
                          }`}
                        />
                        {t.label}
                        {tab === t.id && (
                          <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-[#e91e63]" />
                        )}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* ── TAB: Content ── */}
                    {tab === "content" && (
                      <>
                        <Input
                          label="ছোট সাবটাইটেল (badge এর উপরে)"
                          placeholder="e.g., EXCLUSIVE COLLECTION"
                          value={form.subtitle}
                          onChange={(e) => set("subtitle", e.target.value)}
                          hint="ঐচ্ছিক — ছোট uppercase লেখা"
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="হেডলাইন *"
                            placeholder="e.g., Premium Skincare"
                            value={form.title}
                            onChange={(e) => set("title", e.target.value)}
                            required
                          />
                          <Input
                            label="হাইলাইট শব্দ (গ্র্যাডিয়েন্ট)"
                            placeholder="e.g., Collection"
                            value={form.highlight}
                            onChange={(e) => set("highlight", e.target.value)}
                          />
                        </div>

                        <Textarea
                          label="বিবরণ"
                          rows={2}
                          placeholder="স্লাইডের বিবরণ..."
                          value={form.description}
                          onChange={(e) => set("description", e.target.value)}
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="ব্যাজ টেক্সট"
                            placeholder="BESTSELLER"
                            value={form.badge}
                            onChange={(e) => set("badge", e.target.value)}
                          />
                          <Select
                            label="ব্যাজ কালার"
                            value={form.badge_color}
                            onChange={(e) => set("badge_color", e.target.value)}
                          >
                            {BADGE_PRESETS.map((p) => (
                              <option key={p.value} value={p.value}>
                                {p.label}
                              </option>
                            ))}
                          </Select>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            label="দাম"
                            placeholder="BDT 2,999"
                            value={form.price}
                            onChange={(e) => set("price", e.target.value)}
                          />
                          <Input
                            label="আসল দাম"
                            placeholder="BDT 4,999"
                            value={form.original_price}
                            onChange={(e) =>
                              set("original_price", e.target.value)
                            }
                          />
                          <Input
                            label="ছাড়"
                            placeholder="40% OFF"
                            value={form.discount}
                            onChange={(e) => set("discount", e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="CTA বোতাম টেক্সট"
                            placeholder="এখনই কিনুন"
                            value={form.cta_text}
                            onChange={(e) => set("cta_text", e.target.value)}
                          />
                          <Input
                            label="২য় বোতাম টেক্সট"
                            placeholder="সব পণ্য দেখুন"
                            value={form.cta_secondary}
                            onChange={(e) =>
                              set("cta_secondary", e.target.value)
                            }
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Select
                            label="বোতাম স্টাইল"
                            value={form.button_style}
                            onChange={(e) =>
                              set("button_style", e.target.value)
                            }
                          >
                            {BUTTON_STYLES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </Select>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              label="ক্যাটাগরি লেবেল"
                              placeholder="Skincare"
                              value={form.category}
                              onChange={(e) => set("category", e.target.value)}
                            />
                            <Input
                              label="ক্রম"
                              type="number"
                              value={form.sort_order}
                              onChange={(e) =>
                                set("sort_order", Number(e.target.value))
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                            <ImageIcon className="h-3.5 w-3.5" /> ব্যানার ইমেজ
                          </label>
                          <BannerImageInput
                            value={form.banner_image}
                            onChange={(v) => set("banner_image", v)}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {[
                            {
                              key: "is_active",
                              icon: ToggleRight,
                              label: "সক্রিয়",
                              color: "emerald",
                            },
                            {
                              key: "free_delivery",
                              icon: Truck,
                              label: "ফ্রি ডেলিভারি",
                              color: "blue",
                            },
                            {
                              key: "authentic",
                              icon: ShieldCheck,
                              label: "অরিজিনাল",
                              color: "violet",
                            },
                          ].map(({ key, icon: Icon, label, color }) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => set(key, !form[key])}
                              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                                form[key]
                                  ? color === "emerald"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : color === "blue"
                                      ? "border-blue-200 bg-blue-50 text-blue-700"
                                      : "border-violet-200 bg-violet-50 text-violet-700"
                                  : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {label}
                              {form[key] && (
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {/* ── TAB: Style ── */}
                    {tab === "style" && (
                      <div className="space-y-4">
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Palette className="h-3.5 w-3.5" />
                          রঙ বদলান — ডানে live প্রিভিউ আপডেট হবে
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <ColorPicker
                            label="অ্যাকসেন্ট (শুরু)"
                            value={form.accent_from}
                            onChange={(v) => set("accent_from", v)}
                          />
                          <ColorPicker
                            label="অ্যাকসেন্ট (শেষ)"
                            value={form.accent_to}
                            onChange={(v) => set("accent_to", v)}
                          />
                          <ColorPicker
                            label="ব্যাকগ্রাউন্ড শুরু"
                            value={form.bg_from}
                            onChange={(v) => set("bg_from", v)}
                          />
                          <ColorPicker
                            label="ব্যাকগ্রাউন্ড মধ্য"
                            value={form.bg_via}
                            onChange={(v) => set("bg_via", v)}
                          />
                          <ColorPicker
                            label="ব্যাকগ্রাউন্ড শেষ"
                            value={form.bg_to}
                            onChange={(v) => set("bg_to", v)}
                          />
                        </div>
                      </div>
                    )}

                    {/* ── TAB: Link & Product ── */}
                    {tab === "link" && (
                      <div className="space-y-4">
                        <div>
                          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                            <Package className="h-3.5 w-3.5" />
                            পণ্য লিঙ্ক করুন
                          </label>
                          <ProductCombobox
                            products={products}
                            value={form.product_id}
                            onChange={handleProductSelect}
                          />
                          {linkedProduct &&
                            (() => {
                              const lMrp = Number(linkedProduct.price || 0);
                              const lDisc = Number(
                                linkedProduct.discount_amount || 0,
                              );
                              const lSell =
                                lDisc > 0 ? Math.max(0, lMrp - lDisc) : lMrp;
                              const lPct =
                                lDisc > 0 && lMrp > 0
                                  ? Math.round((lDisc / lMrp) * 100)
                                  : 0;
                              return (
                                <div className="mt-2 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                                  <img
                                    src={imgSrc(linkedProduct.image)}
                                    alt={linkedProduct.name}
                                    className="h-12 w-12 rounded-xl object-cover flex-none border border-emerald-200/50"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-bold text-[#0f172a]">
                                      {linkedProduct.name}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                      <span className="text-xs font-bold text-[#e91e63]">
                                        ৳{lSell.toLocaleString()}
                                      </span>
                                      {lDisc > 0 && (
                                        <>
                                          <span className="text-[10px] text-slate-400 line-through">
                                            ৳{lMrp.toLocaleString()}
                                          </span>
                                          <span className="rounded-full bg-emerald-200 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                                            -{lPct}% ছাড়
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <CheckCircle2 className="h-5 w-5 flex-none text-emerald-500" />
                                </div>
                              );
                            })()}
                          <p className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                            <AlertCircle className="h-3 w-3" />
                            পণ্য নির্বাচন করলে দাম, ছবি ও লিঙ্ক স্বয়ংক্রিয়ভাবে
                            পূরণ হবে
                          </p>
                        </div>

                        <div>
                          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                            <LinkIcon className="h-3.5 w-3.5" /> কাস্টম লিঙ্ক
                          </label>
                          <input
                            className="input"
                            placeholder="/products/my-product"
                            value={form.link}
                            onChange={(e) => set("link", e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => setForm(null)}
                        className="btn-outline"
                      >
                        <X className="h-3.5 w-3.5" /> বাতিল
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={isPending}
                      >
                        {isPending ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            সেভ হচ্ছে...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Save className="h-3.5 w-3.5" />
                            {form?.id ? "আপডেট করুন" : "তৈরি করুন"}
                          </span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* ── Right: Live Preview ── */}
                <div className="lg:col-span-2 bg-slate-50 p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    লাইভ প্রিভিউ
                  </p>
                  <SliderPreview form={form} product={linkedProduct} />
                  <p className="mt-3 text-center text-[10px] text-slate-400">
                    যেকোনো পরিবর্তন করুন — প্রিভিউ আপডেট হবে
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
