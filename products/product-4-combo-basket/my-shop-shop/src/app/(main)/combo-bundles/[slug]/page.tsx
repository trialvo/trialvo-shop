"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Package, Tag, CheckCircle2, Truck, ShoppingBag,
  ArrowRight, ChevronRight, ShoppingCart, Check,
} from "lucide-react";
import { getImageUrl } from "@/lib/imageUrl";
import { useComboBundle, type ComboProductItem } from "@/api/comboBundles";
import { dn } from "@/utils/displayName";
import { useOrder } from "@/context/OrderContext";
import { useFlyToCart } from "@/hooks/useFlyToCart";

export default function CombeBundleDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { data, isLoading } = useComboBundle(slug);
  const { addItem } = useOrder();
  const { flyTo } = useFlyToCart();
  const mainBtnRef = useRef<HTMLButtonElement>(null);
  const [added, setAdded] = useState(false);
  // Track per-item add state
  const [itemAdded, setItemAdded] = useState<Record<number, boolean>>({});

  const combo = data?.combo;

  /** Add a single item to the normal cart */
  const handleAddItem = (item: ComboProductItem, btnEl: HTMLButtonElement | null) => {
    if (!item.product) return;
    for (let i = 0; i < item.qty; i++) {
      addItem(
        {
          productId: item.product.id,
          name: item.custom_label || dn(item.product),
          slug: item.product.slug,
          price: Number(item.product.price),
          originalPrice: Number(item.product.original_price || item.product.price),
          image: item.product.image,
        },
        "single",
      );
    }
    flyTo(btnEl, "nav-cart-icon", { color: "#e91e63", size: 48, duration: 900 });
    setItemAdded((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => setItemAdded((prev) => ({ ...prev, [item.id]: false })), 1800);
  };

  /** Add ALL items to normal cart as ONE combo bundle item */
  const handleAddAllToCart = () => {
    if (!combo?.items?.length) return;
    addItem(
      {
        productId: combo.id,
        name: dn(combo),
        slug: combo.slug,
        price: Number(combo.bundle_price),
        originalPrice: Number(combo.original_price) || Number(combo.bundle_price),
        image: combo.image || '',
        itemType: 'combo',
        combo_items: combo.items
          .filter((ci) => ci.product)
          .map((ci) => ({
            productId: ci.product!.id,
            name: ci.custom_label || dn(ci.product!),
            qty: ci.qty,
            price: Number(ci.product!.price),
            image: ci.product!.image || undefined,
          })),
      },
      'single',
    );
    flyTo(mainBtnRef.current, 'nav-cart-icon', { color: '#e91e63', size: 52, duration: 950 });
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] px-4 py-12">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-8 w-32 rounded-xl bg-slate-200" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="h-[400px] rounded-2xl bg-slate-200" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 rounded-xl bg-slate-200" />
              <div className="h-4 w-full rounded-xl bg-slate-100" />
              <div className="h-4 w-5/6 rounded-xl bg-slate-100" />
              <div className="h-16 w-full rounded-xl bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!combo) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto h-16 w-16 text-slate-200" />
          <p className="mt-4 text-lg font-bold text-[#0f172a]">কম্বো পাওয়া যায়নি</p>
          <Link href="/combo-bundles" className="mt-3 inline-flex items-center gap-2 text-sm text-[#e91e63] hover:underline">
            <ArrowLeft className="h-4 w-4" /> কম্বো লিস্টে ফিরুন
          </Link>
        </div>
      </div>
    );
  }

  const bp = Number(combo.bundle_price);
  const op = Number(combo.original_price);
  const discPct = op > bp ? Math.round(((op - bp) / op) * 100) : 0;
  const saving = op > bp ? op - bp : 0;
  const images = [combo.image, ...(combo.images || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-20 lg:pb-10">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <div className="mx-auto max-w-7xl flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-[#e91e63]">হোম</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/combo-bundles" className="hover:text-[#e91e63]">কম্বো বান্ডেল</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-[#0f172a] font-medium truncate max-w-[160px]">{dn(combo)}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* ─── Left: Image ─── */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 border border-slate-100 aspect-square">
              {images[0] ? (
                <img
                  src={getImageUrl(images[0])}
                  alt={dn(combo)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-24 w-24 text-rose-200" />
                </div>
              )}
              {discPct > 0 && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-[#e91e63] px-3 py-1.5 text-sm font-bold text-white shadow-lg">
                  <Tag className="h-3.5 w-3.5" />
                  {discPct}% ছাড়
                </div>
              )}
            </div>
            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.slice(1, 5).map((img, i) => (
                  <div key={i} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-slate-100">
                    <img src={getImageUrl(img)} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Right: Info ─── */}
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold text-[#0f172a] leading-snug">{dn(combo)}</h1>
              {combo.short_description && (
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{combo.short_description}</p>
              )}
            </div>

            {/* Pricing */}
            <div className="rounded-2xl bg-gradient-to-br from-[#fff1f6] to-[#fff8fa] border border-[#e91e63]/10 p-5">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-3xl font-extrabold text-[#e91e63]">৳{bp.toLocaleString()}</span>
                {op > bp && (
                  <span className="text-lg text-slate-400 line-through">৳{op.toLocaleString()}</span>
                )}
                {discPct > 0 && (
                  <span className="rounded-full bg-[#e91e63] px-2.5 py-0.5 text-xs font-bold text-white">
                    {discPct}% ছাড়
                  </span>
                )}
              </div>
              {saving > 0 && (
                <div className="mt-2 flex items-center gap-2 text-sm text-emerald-700 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  আপনি ৳{saving.toLocaleString()} সাশ্রয় করছেন!
                </div>
              )}
            </div>

            {/* Items included */}
            <div>
              <h2 className="text-sm font-bold text-[#0f172a] mb-3">
                এই কম্বোতে রয়েছে ({combo.items?.length || 0} টি পণ্য)
              </h2>
              <div className="space-y-2">
                {(combo.items || []).map((item) => {
                  const itemBtnRef = { current: null as HTMLButtonElement | null };
                  const isAdded = itemAdded[item.id];
                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                      <div className="shrink-0 h-12 w-12 overflow-hidden rounded-lg bg-slate-50 border border-slate-100">
                        {item.product?.image ? (
                          <img src={getImageUrl(item.product.image)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-5 w-5 text-slate-200" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#0f172a] truncate">
                          {item.custom_label || (item.product ? dn(item.product) : `পণ্য #${item.product_id}`)}
                        </p>
                        {item.product && (
                          <p className="text-xs text-slate-400">
                            ৳{Number(item.product.price).toLocaleString()}
                            {item.product.original_price && Number(item.product.original_price) > Number(item.product.price) && (
                              <span className="ml-1 line-through text-slate-300">৳{Number(item.product.original_price).toLocaleString()}</span>
                            )}
                          </p>
                        )}
                      </div>
                      {/* Per-item qty badge + add-to-cart */}
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">×{item.qty}</span>
                        {item.product?.in_stock && (
                          <button
                            ref={(el) => { itemBtnRef.current = el; }}
                            onClick={() => handleAddItem(item, itemBtnRef.current)}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all active:scale-95 ${isAdded
                              ? "bg-emerald-500 text-white"
                              : "bg-[#e91e63] text-white hover:bg-[#c2185b]"
                              }`}
                          >
                            {isAdded ? <Check className="h-3 w-3" /> : <ShoppingCart className="h-3 w-3" />}
                            {isAdded ? "যোগ!" : "কার্ট"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2 text-sm">
              {combo.in_stock ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-700 font-medium">স্টকে আছে</span>
                  {combo.stock_qty > 0 && (
                    <span className="text-slate-400">· মাত্র {combo.stock_qty} টি বাকি</span>
                  )}
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="text-red-600 font-medium">স্টকে নেই</span>
                </>
              )}
            </div>

            {/* CTA */}
            {combo.in_stock ? (
              <div className="space-y-2">
                <button
                  ref={mainBtnRef}
                  onClick={handleAddAllToCart}
                  className={`w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold transition-all duration-200 shadow-md ${added
                    ? "bg-emerald-500 text-white"
                    : "bg-gradient-to-r from-[#e91e63] to-pink-500 text-white hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
                    }`}
                >
                  {added ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      সব পণ্য কার্টে যোগ হয়েছে!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      সব পণ্য কার্টে যোগ করুন
                    </>
                  )}
                </button>
                <Link
                  href="/checkout"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#e91e63] py-3.5 text-sm font-bold text-[#e91e63] hover:bg-pink-50 transition-colors"
                  onClick={handleAddAllToCart}
                >
                  এখনই কিনুন
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <button disabled className="w-full rounded-2xl bg-slate-100 py-4 text-sm font-bold text-slate-400 cursor-not-allowed">
                স্টke নেই
              </button>
            )}

            {/* Delivery note */}
            <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <p className="text-xs text-slate-500 leading-relaxed">
                নির্দিষ্ট পরিমাণের উপরে অর্ডারে <strong>ফ্রি ডেলিভারি</strong>। সাধারণত ১–৩ কার্যদিবসের মধ্যে।
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {combo.description && (
          <div className="mt-10">
            <h2 className="text-base font-bold text-[#0f172a] mb-4">বিস্তারিত বিবরণ</h2>
            <div
              className="prose prose-sm max-w-none text-slate-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: combo.description }}
            />
          </div>
        )}
      </div>

      {/* Mobile sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex-1">
            <p className="text-xs font-bold text-[#0f172a]">৳{bp.toLocaleString()}</p>
            {discPct > 0 && <p className="text-[10px] text-emerald-600">{discPct}% ছাড়</p>}
          </div>
          <button
            onClick={handleAddAllToCart}
            disabled={!combo.in_stock}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all ${!combo.in_stock ? "bg-slate-300 cursor-not-allowed" : added ? "bg-emerald-500" : "bg-[#e91e63]"
              }`}
          >
            <ShoppingCart className="h-4 w-4" />
            {added ? "যোগ হয়েছে!" : "কার্টে যোগ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
