import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  Tag,
  AlertTriangle,
  Layers,
  Star,
  ToggleLeft,
  ToggleRight,
  Search,
  TrendingDown,
} from "lucide-react";
import {
  useComboBundles,
  useToggleComboBundle,
  useDeleteComboBundle,
} from "../hooks/useComboBundles";
import {
  Pagination,
  EmptyState,
  TableSkeleton,
  Toggle,
  Badge,
} from "../components/ui";
import { getImageUrl } from "../lib/imageUrl";

/* ─── Stats Chip ──────────────────────────────────────────────────────────── */
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

/* ─── Delete Warning Modal ────────────────────────────────────────────────── */
function DeleteWarningModal({ combo, onConfirm, onCancel, isPending }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isPending ? undefined : onCancel}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Red top bar */}
        <div className="h-1.5 bg-gradient-to-r from-red-400 to-rose-500" />

        <div className="p-6">
          {/* Icon + Title */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 border-4 border-red-100 mb-4">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-[#0f172a]">
              কম্বো মুছে ফেলতে চান?
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না
            </p>
          </div>

          {/* Combo info box */}
          {combo && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5 flex items-center gap-3">
              {combo.image ? (
                <img
                  src={getImageUrl(combo.image)}
                  alt={combo.name}
                  className="h-12 w-12 rounded-lg object-cover shrink-0 border border-red-200/50"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-red-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-[#0f172a]">{combo.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {combo.items?.length || 0} টি পণ্য • ৳
                  {Number(combo.bundle_price || 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Warning list */}
          <div className="space-y-2 mb-6">
            {[
              "কম্বো বান্ডেলটি স্থায়ীভাবে মুছে যাবে",
              "সংযুক্ত সমস্ত পণ্য আইটেম সরিয়ে যাবে",
              "শপ ফ্রন্টেন্ডে আর দেখাবে না",
            ].map((w, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-slate-600"
              >
                <span className="mt-0.5 h-4 w-4 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0 text-[10px] font-bold">
                  !
                </span>
                {w}
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isPending}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              বাতিল করুন
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                boxShadow: "0 4px 15px rgba(239,68,68,0.35)",
              }}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  মুছছে...
                </span>
              ) : (
                "হ্যাঁ, মুছে ফেলুন"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
export default function ComboBundles() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteCombo, setDeleteCombo] = useState(null); // full combo object

  const { data, isLoading } = useComboBundles({ search, page, limit: 15 });
  const toggleMut = useToggleComboBundle();
  const deleteMut = useDeleteComboBundle();

  const combos = data?.combos || [];
  const total = data?.total || 0;
  const activeCount = combos.filter((c) => c.is_active).length;
  const featuredCount = combos.filter((c) => c.is_featured).length;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">কম্বো বান্ডেল</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            মোট <span className="font-semibold text-[#0f172a]">{total}</span> টি
            কম্বো প্যাকেজ
          </p>
        </div>
        <button
          onClick={() => navigate("/combo-bundles/new")}
          className="btn-primary shrink-0"
        >
          <Plus className="h-4 w-4" /> নতুন কম্বো
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="flex flex-wrap gap-2">
        <StatChip
          icon={Layers}
          label="মোট"
          value={total}
          color="bg-slate-700 text-white"
        />
        <StatChip
          icon={ToggleRight}
          label="সক্রিয়"
          value={activeCount}
          color="bg-emerald-100 text-emerald-700"
        />
        <StatChip
          icon={Star}
          label="ফিচার্ড"
          value={featuredCount}
          color="bg-amber-100 text-amber-700"
        />
      </div>

      {/* ── Search ── */}
      <div className="card !p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="input pl-10 w-full"
            placeholder="কম্বোর নাম খুঁজুন..."
            value={search}
            onChange={(v) => {
              setSearch(v.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card !p-0 overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : combos.length === 0 ? (
          <EmptyState
            icon={Package}
            title="কোনো কম্বো নেই"
            description="নতুন কম্বো বান্ডেল তৈরি করুন"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    কম্বো
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    পণ্যসমূহ
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    বান্ডেল মূল্য
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    সাশ্রয়
                  </th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    সক্রিয়
                  </th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {combos.map((combo) => {
                  const origPrice = Number(combo.original_price || 0);
                  const bundlePrice = Number(combo.bundle_price || 0);
                  const saving =
                    origPrice > bundlePrice ? origPrice - bundlePrice : 0;
                  const discPct =
                    origPrice > bundlePrice
                      ? Math.round((saving / origPrice) * 100)
                      : 0;

                  return (
                    <tr
                      key={combo.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Combo info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {combo.image ? (
                            <img
                              src={getImageUrl(combo.image)}
                              alt={combo.name}
                              className="h-12 w-12 rounded-xl object-cover border border-slate-100 shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-100 to-rose-200 flex items-center justify-center shrink-0">
                              <Package className="h-5 w-5 text-rose-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-[#0f172a] text-sm group-hover:text-[#e91e63] transition-colors">
                              {combo.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {combo.is_featured && (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full font-semibold">
                                  <Star className="h-2.5 w-2.5 fill-amber-400 stroke-amber-400" />
                                  ফিচার্ড
                                </span>
                              )}
                              {!combo.in_stock && (
                                <span className="inline-flex items-center text-[10px] bg-red-50 text-red-500 border border-red-200 px-1.5 py-0.5 rounded-full font-semibold">
                                  স্টক শেষ
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {(combo.items || []).slice(0, 3).map((item) => (
                            <span
                              key={item.id}
                              className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-medium"
                            >
                              <Tag className="h-2.5 w-2.5" />
                              {item.product?.name?.slice(0, 16) || "—"}
                              {item.qty > 1 && (
                                <span className="text-slate-400">
                                  ×{item.qty}
                                </span>
                              )}
                            </span>
                          ))}
                          {combo.items?.length > 3 && (
                            <span className="text-[11px] text-slate-400 px-1 py-0.5">
                              +{combo.items.length - 3} আরো
                            </span>
                          )}
                          {!combo.items?.length && (
                            <span className="text-[11px] text-slate-400">
                              —
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Bundle price */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-[#0f172a] text-sm">
                          ৳{bundlePrice.toLocaleString()}
                        </p>
                        {origPrice > bundlePrice && (
                          <p className="text-xs text-slate-400 line-through mt-0.5">
                            ৳{origPrice.toLocaleString()}
                          </p>
                        )}
                      </td>

                      {/* Saving */}
                      <td className="px-5 py-4">
                        {discPct > 0 ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <TrendingDown className="h-3 w-3" />
                              {discPct}% ছাড়
                            </span>
                            <p className="text-xs text-emerald-600 mt-0.5">
                              ৳{saving.toLocaleString()} সাশ্রয়
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Toggle active */}
                      <td className="px-5 py-4 text-center">
                        <Toggle
                          checked={combo.is_active}
                          onChange={() => toggleMut.mutate(combo.id)}
                          disabled={toggleMut.isPending}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() =>
                              navigate(`/combo-bundles/${combo.id}/edit`)
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-[#e91e63]/40 hover:text-[#e91e63] hover:shadow-md"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            এডিট
                          </button>
                          <button
                            onClick={() => setDeleteCombo(combo)}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-400 shadow-sm transition-all hover:bg-red-50 hover:text-red-600 hover:shadow-md"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data?.pages > 1 && (
        <Pagination
          page={page}
          pages={data.pages}
          total={total}
          onChange={setPage}
          label="টি কম্বো"
        />
      )}

      {/* ── Delete Warning Modal ── */}
      {deleteCombo && (
        <DeleteWarningModal
          combo={deleteCombo}
          isPending={deleteMut.isPending}
          onCancel={() => setDeleteCombo(null)}
          onConfirm={() => {
            deleteMut.mutate(deleteCombo.id, {
              onSuccess: () => setDeleteCombo(null),
            });
          }}
        />
      )}
    </div>
  );
}
