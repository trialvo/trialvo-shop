"use client";

import { useState, useRef, useEffect } from "react";
import { Product } from "@/types";
import { getImageUrl } from "@/lib/imageUrl";
import { dn } from "@/utils/displayName";
import {
  Star,
  Truck,
  Minus,
  Plus,
  ShoppingCart,
  MessageCircle,
  ArrowRight,
  Heart,
  Share2,
  ShieldCheck,
  RefreshCw,
  Package,
  CheckCircle2,
  ChevronRight,
  Play,
} from "lucide-react";
import { useProductReviews } from "@/api/reviews";
import { useOrder } from "@/context/OrderContext";

interface ProductDetailClientProps {
  product: Product;
  discount: number;
  relatedProducts: Product[];
}

export default function ProductDetailClient({
  product,
  discount,
}: ProductDetailClientProps) {
  const { addItem, setOrderMode } = useOrder();
  const { data: reviewData, isLoading: reviewsLoading } = useProductReviews(product.id);
  const reviews = reviewData?.reviews ?? [];

  // Build image list: prefer gallery array, fall back to single main image
  const allImages: string[] =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];

  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "description" | "specifications" | "reviews" | "video"
  >("description");
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // If the browser already has the image cached, onLoad never fires
  useEffect(() => {
    if (imgRef.current?.complete) {
      setImageLoaded(true);
    }
  }, [selectedImage]);

  const tabs = [
    { id: "description" as const, label: "বিবরণ", labelEn: "Description" },
    {
      id: "specifications" as const,
      label: "স্পেসিফিকেশন",
      labelEn: "Specifications",
    },
    { id: "reviews" as const, label: "রিভিউ", labelEn: "Reviews" },
    ...(product.videoUrl ? [{ id: "video" as const, label: "ভিডিও", labelEn: "Video" }] : []),
  ];

  return (
    <>
      {/* Product Main */}
      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* ─── Image Gallery ─── */}
        <div className="animate-fade-in-left space-y-4">
          {/* Main Image */}
          <div className="shadow-card group relative aspect-square overflow-hidden rounded-2xl bg-white">
            {/* Badges */}
            <div className="absolute top-3 left-3 z-10 flex gap-1.5">
              {product.tags.includes("combo") && (
                <span className="badge-combo">COMBO</span>
              )}
              {discount > 0 && (
                <span className="badge-discount">-{discount}%</span>
              )}
            </div>

            {/* Floating Actions */}
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`flex h-10 w-10 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 ${isWishlisted
                  ? "bg-[#e91e63] text-white"
                  : "bg-white/90 text-slate-400 hover:text-[#e91e63]"
                  }`}
              >
                <Heart
                  className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`}
                />
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:text-[#e91e63]">
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            {/* Image */}
            <div className="relative h-full w-full overflow-hidden">
              <img
                ref={imgRef}
                src={getImageUrl(allImages[selectedImage] ?? product.image)}
                alt={dn(product)}
                className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-105 ${imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e91e63] border-t-transparent" />
                </div>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-3 overflow-x-auto pb-1">
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => {
                  setImageLoaded(false);
                  setSelectedImage(i);
                }}
                className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ${i === selectedImage
                  ? "border-[#e91e63] shadow-md shadow-[#e91e63]/20"
                  : "border-transparent opacity-60 hover:opacity-100"
                  }`}
              >
                <img
                  src={getImageUrl(img)}
                  alt={`${dn(product)} - ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* ─── Product Info ─── */}
        <div className="animate-fade-in-right space-y-5">
          {/* Category */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-500">
              {product.category}
            </span>
            {product.inStock && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                স্টকে আছে
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a] sm:text-3xl lg:text-4xl">
            {dn(product)}
          </h1>

          {/* Short Description */}
          <p className="text-sm leading-relaxed text-slate-500">
            {product.shortDescription}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor(product.rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-200"
                    }`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-slate-700">
              {product.rating}
            </span>
            <span className="text-sm text-slate-400">
              ({product.reviewCount} রিভিউ)
            </span>
          </div>

          {/* ── Price Block ── */}
          <div className="rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50 to-pink-50/30 p-5">
            <div className="flex flex-wrap items-end gap-3">
              <span className="text-3xl font-bold text-[#e91e63] sm:text-4xl">
                BDT {(product.discountPrice ?? product.price).toLocaleString()}
              </span>
              {product.discountPrice && product.price > product.discountPrice && (
                <>
                  <span className="text-lg text-slate-400 line-through">
                    BDT {product.price.toLocaleString()}
                  </span>
                  <span className="rounded-full bg-[#e91e63] px-3 py-1 text-xs font-bold text-white shadow-sm shadow-[#e91e63]/25">
                    {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% ছাড়
                  </span>
                </>
              )}
            </div>
            {product.discountPrice && product.price > product.discountPrice && (
              <p className="mt-2 text-xs text-emerald-600">
                আপনি সাশ্রয় করছেন BDT {(product.price - product.discountPrice).toLocaleString()}!
              </p>
            )}
          </div>

          {/* ── Color Selector ── */}
          {product.colors && product.colors.length > 0 && (
            <div>
              <p className="mb-2.5 text-sm font-semibold text-slate-700">
                রঙ বাছাই করুন
              </p>
              <div className="flex gap-2.5">
                {product.colors.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(i)}
                    className={`relative h-9 w-9 rounded-full border-2 transition-all duration-300 hover:scale-110 ${i === selectedColor
                      ? "border-[#e91e63] ring-2 ring-[#e91e63]/30"
                      : "border-slate-200"
                      }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {i === selectedColor && (
                      <CheckCircle2
                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white text-[#e91e63]"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Quantity + CTA ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <p className="text-sm font-semibold text-slate-700">পরিমাণ</p>
              <div className="flex items-center rounded-xl border border-slate-200 bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-10 w-10 items-center justify-center text-slate-500 transition-colors hover:text-[#e91e63] disabled:opacity-30"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-bold text-[#0f172a]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-10 w-10 items-center justify-center text-slate-500 transition-colors hover:text-[#e91e63]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm text-slate-400">
                মোট: BDT {((product.discountPrice ?? product.price) * quantity).toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button
                onClick={() => {
                  setOrderMode("single");
                  addItem({
                    productId: product.id,
                    name: dn(product),
                    slug: product.slug,
                    price: product.discountPrice ?? product.price,
                    ...(product.discountPrice ? { originalPrice: product.price } : {}),
                    image: product.image,
                  }, "single");  // always write to single cart
                }}
                className="btn-pink flex-1 px-6 py-3.5 text-sm"
              >
                কার্টে যোগ করুন
                <ArrowRight className="h-4 w-4" />
              </button>
              <button className="btn-whatsapp flex items-center justify-center gap-2 px-6 py-3.5 text-sm">
                <MessageCircle className="h-4 w-4" />
                হোয়াটসঅ্যাপ অর্ডার
              </button>
            </div>

            <button className="btn-outline w-full px-6 py-3 text-sm">
              <ShoppingCart className="h-4 w-4" />
              উইশলিস্টে যোগ করুন
            </button>
          </div>

          {/* ── Trust Badges (inline) ── */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              {
                icon: Truck,
                label: "ফ্রি ডেলিভারি",
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                icon: ShieldCheck,
                label: "অরিজিনাল",
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                icon: RefreshCw,
                label: "রিটার্ন পলিসি",
                color: "text-orange-600",
                bg: "bg-orange-50",
              },
              {
                icon: Package,
                label: "সিকিউর প্যাকিং",
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
            ].map((badge, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center gap-1.5 rounded-xl ${badge.bg} px-3 py-3 text-center transition-all duration-200 hover:shadow-sm`}
              >
                <badge.icon className={`h-5 w-5 ${badge.color}`} />
                <span
                  className={`text-[10px] font-semibold ${badge.color}`}
                >
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Tabbed Detail Section ─── */}
      <div className="mt-14">
        {/* Tab Headers */}
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative whitespace-nowrap px-6 py-3.5 text-sm font-semibold transition-all duration-300 ${activeTab === tab.id
                ? "text-[#e91e63]"
                : "text-slate-400 hover:text-slate-600"
                }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] text-slate-400">
                {tab.labelEn}
              </span>
              {activeTab === tab.id && (
                <span className="absolute right-0 bottom-0 left-0 h-[3px] rounded-t-full bg-gradient-to-r from-[#e91e63] to-[#ff4081]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in-up mt-6">
          {/* Description Tab */}
          {activeTab === "description" && (
            <div className="shadow-card rounded-2xl bg-white p-6 sm:p-8">
              {product.description ? (
                <div
                  className="prose-product mb-6"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="mb-6 text-sm text-slate-400">বিবরণ পাওয়া যায়নি</p>
              )}

              {product.features && product.features.length > 0 && (
                <>
                  <h3 className="mb-4 text-base font-bold text-[#0f172a]">
                    ✨ মূল বৈশিষ্ট্যসমূহ
                  </h3>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {product.features.map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3 transition-all hover:bg-slate-100"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                        <span className="text-sm text-slate-600">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Specifications Tab */}
          {activeTab === "specifications" && (
            <div className="shadow-card overflow-hidden rounded-2xl bg-white">
              <table className="w-full">
                <tbody>
                  {product.specifications &&
                    Object.entries(product.specifications).map(
                      ([key, value], i) => (
                        <tr
                          key={key}
                          className={`transition-colors hover:bg-pink-50/30 ${i % 2 === 0 ? "bg-slate-50/50" : "bg-white"
                            }`}
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                            {key}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {value}
                          </td>
                        </tr>
                      )
                    )}
                </tbody>
              </table>
              {(!product.specifications ||
                Object.keys(product.specifications).length === 0) && (
                  <p className="p-8 text-center text-sm text-slate-400">
                    স্পেসিফিকেশন পাওয়া যায়নি
                  </p>
                )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="space-y-4">
              {/* Reviews Summary */}
              <div className="shadow-card flex flex-wrap items-center gap-6 rounded-2xl bg-white p-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-[#0f172a]">
                    {product.rating}
                  </p>
                  <div className="mt-1 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < Math.floor(product.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                          }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {product.reviewCount} রিভিউ
                  </p>
                </div>
                <div className="h-16 w-px bg-slate-100" />
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const pct =
                      star === 5
                        ? 68
                        : star === 4
                          ? 22
                          : star === 3
                            ? 7
                            : star === 2
                              ? 2
                              : 1;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="w-3 text-[10px] font-medium text-slate-500">
                          {star}
                        </span>
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-amber-400 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-[10px] text-slate-400">
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review Cards - Loading skeleton */}
              {reviewsLoading && (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!reviewsLoading && reviews.length === 0 && (
                <div className="shadow-card rounded-2xl bg-white py-12 text-center">
                  <Star className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-400">এখনো কোনো রিভিউ নেই</p>
                </div>
              )}

              {/* Review cards */}
              {!reviewsLoading && reviews.map((review) => (
                <div
                  key={review.id}
                  className="shadow-card rounded-2xl bg-white p-5 transition-all duration-200 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#e91e63] to-[#ff4081] text-xs font-bold text-white shadow-sm">
                      {(review.user?.name ?? "U").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {review.user?.name ?? "গ্রাহক"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(review.created_at).toLocaleDateString("bn-BD")}
                      </p>
                    </div>
                  </div>
                  <div className="mb-2 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className={`h-3.5 w-3.5 ${j < review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                          }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {review.comment}
                  </p>
                </div>
              ))}

              {/* Load More */}
              {reviews.length > 0 && (
                <button className="mx-auto flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-500 transition-all hover:border-[#e91e63] hover:text-[#e91e63]">
                  আরো রিভিউ দেখুন
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          {/* Video Tab */}
          {activeTab === "video" && product.videoUrl && (
            <div className="shadow-card rounded-2xl bg-white overflow-hidden">
              {product.videoUrl.includes("youtube.com") || product.videoUrl.includes("youtu.be") ? (
                <div className="aspect-video">
                  <iframe
                    src={product.videoUrl
                      .replace("watch?v=", "embed/")
                      .replace("youtu.be/", "youtube.com/embed/")}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              ) : (
                <video
                  src={getImageUrl(product.videoUrl) || undefined}
                  controls
                  className="w-full max-h-[500px] bg-black"
                  poster={getImageUrl(product.image) || undefined}
                >
                  আপনার ব্রাউজার ভিডিও সমর্থন করে না।
                </video>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-[#e91e63]" />
                  <p className="text-sm font-semibold text-[#0f172a]">{dn(product)} — পণ্য ভিডিও</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
