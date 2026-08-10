"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Product } from "@/types";
import { getImageUrl } from "@/lib/imageUrl";
import { dn } from "@/utils/displayName";
import {
  Heart,
  ShoppingCart,
  Star,
  Gift,
  Truck,
  Eye,
  Check,
  Plus,
} from "lucide-react";
import { useOrder } from "@/context/OrderContext";
import { useFlyToCart } from "@/hooks/useFlyToCart";

interface ProductCardProps {
  product: Product;
  viewMode?: "grid" | "list";
  href?: string; // override link (e.g. for combo products → /combo-bundles/[slug])
}

type BtnState = "idle" | "added";

export default function ProductCard({
  product,
  viewMode = "grid",
  href,
}: ProductCardProps) {
  const productHref = href ?? `/products/${product.slug}`;
  const { addItem, comboItems } = useOrder();
  const { flyTo } = useFlyToCart();
  const router = useRouter();
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const comboBtnRef = useRef<HTMLButtonElement>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [cartState, setCartState] = useState<BtnState>("idle");
  const [comboState, setComboState] = useState<BtnState>("idle");

  // Check if already in combo cart
  const inCombo = (comboItems ?? []).some((i) => i.productId === product.id);

  // Discount % when discountPrice < price
  const discount = product.discountPrice && product.price > product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  // Effective price: discountPrice if set, otherwise selling price
  const effectivePrice = product.discountPrice ?? product.price;

  /** Add to single cart + fly animation */
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: dn(product),
      slug: product.slug,
      price: effectivePrice,
      ...(product.discountPrice ? { originalPrice: product.price } : {}),
      image: product.image,
    }, "single");
    flyTo(cartBtnRef.current, "nav-cart-icon", {
      color: "#e91e63",
      size: 52,
      duration: 950,
    });
    setCartState("added");
    setTimeout(() => setCartState("idle"), 1800);
  };

  /** Add to combo cart + fly animation */
  const handleAddToCombo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: dn(product),
      slug: product.slug,
      price: effectivePrice,
      ...(product.discountPrice ? { originalPrice: product.price } : {}),
      image: product.image,
    }, "combo");
    flyTo(comboBtnRef.current, "nav-combo-btn", {
      color: "#9333ea",
      size: 46,
      duration: 1000,
    });
    setComboState("added");
    setTimeout(() => setComboState("idle"), 1800);
  };

  /* ─── List Mode ─── */
  if (viewMode === "list") {
    return (
      <article className="group flex overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
        <Link
          href={productHref}
          className="relative w-36 shrink-0 overflow-hidden sm:w-48"
        >
          {product.image ? (
            <img
              src={getImageUrl(product.image)}
              alt={dn(product)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-pink-50">
              <ShoppingCart className="h-10 w-10 text-slate-200" />
            </div>
          )}
          {discount > 0 && (
            <span className="absolute top-2 left-2 rounded-full bg-[#e91e63] px-2 py-0.5 text-[9px] font-bold text-white">
              -{discount}%
            </span>
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
          <div>
            <div className="mb-1.5 flex items-start justify-between gap-2">
              <Link href={productHref}>
                <h3 className="line-clamp-2 text-sm font-bold text-[#0f172a] transition-colors group-hover:text-[#e91e63]">
                  {dn(product)}
                </h3>
              </Link>
              <span className="badge-free-delivery shrink-0 text-[9px]">
                <Truck className="h-2.5 w-2.5" />ফ্রি
              </span>
            </div>
            <p className="line-clamp-1 text-xs text-slate-400">{product.shortDescription}</p>
            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3 w-3 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
              ))}
              <span className="ml-1 text-[10px] text-slate-400">({product.reviewCount})</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              {product.discountPrice ? (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-extrabold text-[#e91e63]">৳{effectivePrice.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 line-through">৳{product.price.toLocaleString()}</span>
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">-{discount}%</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 font-medium">৳{(product.price - effectivePrice).toLocaleString()} সাশ্রয়</p>
                </>
              ) : (
                <span className="text-lg font-extrabold text-[#e91e63]">৳{effectivePrice.toLocaleString()}</span>
              )}
            </div>
            <button
              ref={cartBtnRef}
              onClick={handleAddToCart}
              className="flex items-center gap-1.5 rounded-xl bg-[#e91e63] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-[#c2185b] active:scale-95"
            >
              {cartState === "added" ? (
                <><Check className="h-3 w-3" /> যোগ হয়েছে!</>
              ) : (
                <><ShoppingCart className="h-3 w-3" /> কার্টে যোগ করুন</>
              )}
            </button>
          </div>
        </div>
      </article>
    );
  }

  /* ─── Grid Mode ─── */
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      {/* ── Image Block ── */}
      <Link href={productHref} className="relative block aspect-square overflow-hidden bg-gradient-to-br from-slate-50 via-pink-50/20 to-slate-50">
        {product.image ? (
          <img
            src={getImageUrl(product.image)}
            alt={dn(product)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
            style={{ transitionTimingFunction: "cubic-bezier(.4,0,.2,1)" }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingCart className="h-14 w-14 text-slate-100" />
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Product Type Badge — top left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {!product.isComboEligible ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#e91e63] to-pink-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              <Gift className="h-3 w-3" /> কম্বো প্যাক
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-500 shadow-sm backdrop-blur-sm">
              ✦ সিঙ্গেল
            </span>
          )}
        </div>

        {/* Discount badge — top right */}
        {discount > 0 && (
          <span className="absolute top-3 right-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
            -{discount}%
          </span>
        )}

        {/* Hover quick actions — floating over image */}
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 translate-y-8 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
            className={`flex h-9 w-9 items-center justify-center rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 ${wishlisted ? "bg-[#e91e63] text-white" : "bg-white/90 text-slate-500 hover:text-[#e91e63]"}`}
            aria-label="Wishlist"
          >
            <Heart className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(productHref); }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:text-[#e91e63]"
            aria-label="Quick view"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </Link>

      {/* ── Info Block ── */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Name */}
        <Link href={productHref}>
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[#0f172a] transition-colors group-hover:text-[#e91e63]">
            {dn(product)}
          </h3>
        </Link>

        <div className="flex items-start justify-between">    {/* Price */}
          <div className="flex flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              {product.discountPrice ? (
                <>
                  <span className="text-sm font-extrabold text-[#e91e63]">৳{effectivePrice.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 line-through">৳{product.price.toLocaleString()}</span>
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">-{discount}%</span>
                </>
              ) : (
                <span className="text-sm font-extrabold text-[#e91e63]">৳{effectivePrice.toLocaleString()}</span>
              )}
            </div>
            {product.discountPrice && discount > 0 && (
              <p className="text-[10px] font-medium text-emerald-600">
                ৳{(product.price - effectivePrice).toLocaleString()} সাশ্রয়
              </p>
            )}
          </div>

          {/* Rating + Price row */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-2.5 w-2.5 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-slate-100"}`} />
              ))}
              <span className="ml-1 text-[10px] text-slate-400">({product.reviewCount})</span>
            </div>
          </div>
        </div>



        {/* CTA Buttons */}
        <div className="mt-auto pt-1">
          {product.isComboEligible ? (
            /* Row layout: 60% cart | 40% combo */
            <div className="flex gap-1.5">
              <button
                ref={cartBtnRef}
                onClick={handleAddToCart}
                style={{ flexBasis: "60%" }}
                className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-[10px] font-bold shadow-sm transition-all duration-200 active:scale-95 sm:gap-1.5 sm:text-[11px] ${cartState === "added"
                  ? "bg-emerald-500 text-white"
                  : "bg-[#e91e63] text-white hover:bg-[#c2185b] hover:shadow-md"
                  }`}
              >
                {cartState === "added" ? (
                  <><Check className="h-3 w-3 shrink-0" /> যোগ!</>
                ) : (
                  <><ShoppingCart className="h-3 w-3 shrink-0" /> <span className="truncate">কার্টে যোগ</span></>
                )}
              </button>

              <button
                ref={comboBtnRef}
                onClick={handleAddToCombo}
                style={{ flexBasis: "40%" }}
                className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-[10px] font-bold transition-all duration-200 active:scale-95 sm:gap-1.5 sm:text-[11px] ${comboState === "added"
                  ? "border-violet-400 bg-violet-500 text-white"
                  : inCombo
                    ? "border-[#e91e63]/40 bg-[#e91e63]/8 text-[#e91e63] hover:bg-[#e91e63]/15"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#e91e63] hover:text-[#e91e63]"
                  }`}
              >
                {comboState === "added" ? (
                  <><Check className="h-3 w-3 shrink-0" /></>
                ) : inCombo ? (
                  <><Gift className="h-3 w-3 shrink-0" /> <span className="truncate">আছে ✓</span></>
                ) : (
                  <><Gift className="h-3 w-3 shrink-0" /> <span className="truncate">কম্বো</span></>
                )}
              </button>
            </div>
          ) : (
            /* Full-width cart button for non-combo products */
            <button
              ref={cartBtnRef}
              onClick={handleAddToCart}
              className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-bold shadow-sm transition-all duration-200 active:scale-95 ${cartState === "added"
                ? "bg-emerald-500 text-white"
                : "bg-[#e91e63] text-white hover:bg-[#c2185b] hover:shadow-md"
                }`}
            >
              {cartState === "added" ? (
                <><Check className="h-3.5 w-3.5" /> কার্টে যোগ হয়েছে!</>
              ) : (
                <><ShoppingCart className="h-3.5 w-3.5" /> কার্টে যোগ করুন</>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
