import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Gift,
  Star,
  CheckCircle,
  XCircle,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  AlertTriangle,
  Eye,
} from "lucide-react";
import {
  useProducts,
  useDeleteProduct,
  useUpdateProduct,
} from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { getImageUrl } from "../lib/imageUrl";
import { Pagination, Toggle, SearchInput } from "../components/ui";

const STOCK_OPTIONS = [
  { value: "", label: "সব স্টক" },
  { value: "true", label: "স্টকে আছে" },
  { value: "false", label: "স্টক শেষ" },
];

function StatChip({ icon: Icon, label, value, color }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold ${color}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      <span className="ml-1 rounded-full bg-white/30 px-1.5 py-0.5 text-[11px] font-bold">
        {value}
      </span>
    </div>
  );
}

// Toggle imported from ../components/ui

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [inStock, setInStock] = useState("");
  const [view, setView] = useState("table"); // table | grid

  const { data, isLoading } = useProducts({
    search,
    page,
    limit: 15,
    ...(category ? { category } : {}),
    ...(inStock !== "" ? { inStock } : {}),
  });

  const { data: catData } = useCategories();
  const deleteMut = useDeleteProduct();
  const updateMut = useUpdateProduct();

  const products = data?.products || [];
  const total = data?.total || 0;
  const featured = products.filter((p) => p.is_featured).length;
  const outOfStock = products.filter((p) => !p.in_stock).length;

  const handleDelete = (id, name) => {
    if (confirm(`"${name}" মুছে ফেলবেন?`)) deleteMut.mutate(id);
  };

  const toggleCombo = (p) =>
    updateMut.mutate({
      id: p.id,
      data: { is_combo_eligible: !p.is_combo_eligible },
    });
  const toggleFeatured = (p) =>
    updateMut.mutate({ id: p.id, data: { is_featured: !p.is_featured } });

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setInStock("");
    setPage(1);
  };
  const hasFilter = search || category || inStock;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">পণ্য তালিকা</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            মোট <span className="font-semibold text-[#0f172a]">{total}</span> টি
            পণ্য
          </p>
        </div>
        <Link to="/products/new" className="btn-primary shrink-0">
          <Plus className="h-4 w-4" /> নতুন পণ্য যোগ করুন
        </Link>
      </div>

      {/* Stats strip */}
      <div className="flex flex-wrap gap-2">
        <StatChip
          icon={Package}
          label="মোট"
          value={total}
          color="bg-slate-700 text-white"
        />
        <StatChip
          icon={Star}
          label="ফিচার্ড"
          value={featured}
          color="bg-amber-100 text-amber-700"
        />
        <StatChip
          icon={AlertTriangle}
          label="স্টক শেষ"
          value={outOfStock}
          color="bg-red-100 text-red-600"
        />
        <StatChip
          icon={Gift}
          label="কম্বো যোগ্য"
          value={products.filter((p) => p.is_combo_eligible).length}
          color="bg-pink-100 text-pink-600"
        />
      </div>

      {/* Filter bar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-10"
              placeholder="পণ্যের নাম দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {/* Category */}
          <select
            className="input w-auto min-w-[160px]"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">সব ক্যাটাগরি</option>
            {catData?.categories?.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          {/* Stock */}
          <select
            className="input w-auto min-w-[130px]"
            value={inStock}
            onChange={(e) => {
              setInStock(e.target.value);
              setPage(1);
            }}
          >
            {STOCK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {hasFilter && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:text-[#e91e63] hover:border-[#e91e63]/30 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" /> ফিল্টার মুছুন
            </button>
          )}
        </div>
        {hasFilter && (
          <p className="text-xs text-slate-400">
            <Filter className="inline h-3 w-3 mr-1" />
            {total} টি ফলাফল পাওয়া গেছে
          </p>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  পণ্য
                </th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  মূল্য
                </th>
                <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  স্টক
                </th>
                <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <span className="flex items-center justify-center gap-1">
                    <Star className="h-3 w-3 text-amber-400" />
                    ফিচার্ড
                  </span>
                </th>
                <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <span className="flex items-center justify-center gap-1">
                    <Gift className="h-3 w-3 text-[#e91e63]" />
                    কম্বো
                  </span>
                </th>
                <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  অ্যাকশন
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="h-3.5 w-40 rounded bg-slate-100 animate-pulse" />
                          <div className="h-2.5 w-24 rounded bg-slate-100 animate-pulse" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Package className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                    <p className="text-sm font-medium text-slate-400">
                      কোনো পণ্য পাওয়া যায়নি
                    </p>
                    {hasFilter && (
                      <button
                        onClick={resetFilters}
                        className="mt-3 text-xs text-[#e91e63] hover:underline"
                      >
                        ফিল্টার সরিয়ে সব দেখুন
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  // New pricing: price=MRP, discount_amount=flat off, sell_price=computed by API
                  const mrp = Number(p.price);
                  const discountAmt = Number(p.discount_amount || 0);
                  const finalPrice =
                    p.sell_price !== undefined
                      ? Number(p.sell_price)
                      : discountAmt > 0
                        ? Math.max(0, mrp - discountAmt)
                        : mrp;
                  const savings = mrp - finalPrice;
                  const discountPct =
                    savings > 0 && mrp > 0
                      ? Math.round((savings / mrp) * 100)
                      : 0;
                  const actualPrice = p.actual_price
                    ? Number(p.actual_price)
                    : null;
                  const profit =
                    actualPrice !== null ? finalPrice - actualPrice : null;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Product info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            {p.image ? (
                              <img
                                src={getImageUrl(p.image)}
                                alt={p.name}
                                className="h-12 w-12 rounded-xl object-cover shadow-sm ring-1 ring-slate-100"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
                                <Package className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                            {!p.in_stock && (
                              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#0f172a] line-clamp-1 max-w-[200px] group-hover:text-[#e91e63] transition-colors">
                              {p.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {p.category?.name && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                  {p.category.name}
                                </span>
                              )}
                              <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-medium">
                                <Star className="h-2.5 w-2.5 fill-amber-400 stroke-amber-400" />{" "}
                                {Number(p.rating || 0).toFixed(1)}
                              </span>
                              {p.review_count > 0 && (
                                <span className="text-[10px] text-slate-400">
                                  ({p.review_count} রিভিউ)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price — ultra-compact professional breakdown */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-stretch gap-4 min-w-[200px]">
                          {/* LEFT: Customer Price Info */}
                          <div className="flex-1 flex flex-col justify-center">
                            {/* Final effective price + discount badge */}
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[13px] font-extrabold text-[#e91e63] tracking-tight">
                                ৳{finalPrice.toLocaleString()}
                              </span>
                              {discountPct > 0 && (
                                <span className="rounded bg-emerald-100/80 px-1 py-[1px] text-[8.5px] font-bold tracking-wide text-emerald-700 uppercase">
                                  -{discountPct}% ছাড়
                                </span>
                              )}
                            </div>

                            {/* Original / Selling breakdwon */}
                            {discountPct > 0 && (
                              <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                                <span className="text-[9.5px] text-slate-400 line-through decoration-slate-300">
                                  ৳{mrp.toLocaleString()}
                                </span>
                                <span className="text-[9.5px] bg-slate-100 px-1 rounded text-slate-500 font-medium">
                                  বিক্রয়
                                </span>
                                {savings > 0 && (
                                  <span className="text-[9px] text-emerald-600 font-semibold">
                                    (৳{savings} সাশ্রয়)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* RIGHT: Admin Buying Price Info (border devider) */}
                          {actualPrice !== null && (
                            <div className="flex flex-col justify-center border-l-2 border-amber-100/60 pl-3 shrink-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="text-[9px] text-amber-500/80 font-medium tracking-wide uppercase">
                                  ক্রয়
                                </span>
                                <span className="text-[10.5px] font-bold text-amber-700">
                                  ৳{actualPrice.toLocaleString()}
                                </span>
                              </div>
                              {profit !== null && (
                                <div className="flex items-baseline justify-between gap-2 mt-[1px]">
                                  <span className="text-[9px] text-amber-500/80 font-medium tracking-wide border-t border-amber-100/30 pt-[1px] uppercase">
                                    লাভ
                                  </span>
                                  <span
                                    className={`text-[10px] font-extrabold tracking-tight ${profit >= 0 ? "text-emerald-600" : "text-red-500"}`}
                                  >
                                    {profit > 0 ? "+" : ""}
                                    {profit < 0 ? "-" : ""}৳
                                    {Math.abs(profit).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            p.in_stock
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          {p.in_stock ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {p.in_stock ? "আছে" : "নেই"}
                          {p.stock_qty > 0 && (
                            <span className="ml-0.5 text-[9px] opacity-70">
                              ({p.stock_qty})
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Featured */}
                      <td className="px-4 py-3.5 text-center">
                        <Toggle
                          checked={!!p.is_featured}
                          onChange={() => toggleFeatured(p)}
                          colorOn="bg-amber-400"
                          disabled={updateMut.isPending}
                        />
                      </td>

                      {/* Combo */}
                      <td className="px-4 py-3.5 text-center">
                        <Toggle
                          checked={!!p.is_combo_eligible}
                          onChange={() => toggleCombo(p)}
                          colorOn="bg-[#e91e63]"
                          disabled={updateMut.isPending}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/products/${p.id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-[#e91e63]/40 hover:text-[#e91e63] hover:shadow-md"
                          >
                            <Edit className="h-3.5 w-3.5" /> এডিট
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-400 shadow-sm transition-all hover:bg-red-50 hover:text-red-600 hover:shadow-md"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          pages={data?.pages}
          total={total}
          onChange={setPage}
          label="টি পণ্য"
        />
      </div>
    </div>
  );
}
