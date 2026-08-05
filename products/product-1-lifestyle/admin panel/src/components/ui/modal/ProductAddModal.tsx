import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { CartItem, SaleProduct } from "@/components/sales/types";

interface Props {
  open: boolean;
  onClose: () => void;
  product: SaleProduct | null;
  onAdd: (item: CartItem) => void;
}

const ProductAddModal = ({ open, onClose, product, onAdd }: Props) => {
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState<string>("");
  const [size, setSize] = useState<string>("");

  useEffect(() => {
    if (!open || !product) return;
    setQty(1);
    setVariant(product.variants?.[0]?.name ?? "");
    setSize(product.sizes?.[0]?.name ?? "");
  }, [open, product]);

  const key = useMemo(() => {
    if (!product) return "";
    return [product.id, variant || "-", size || "-"].join("__");
  }, [product, variant, size]);

  if (!product) return null;

  const unitPrice = Number(product.price ?? 0);
  const total = useMemo(() => unitPrice * qty, [unitPrice, qty]);
  const displayTitle = product.title ?? product.name ?? "Product";
  const displaySku = product.sku ?? "";
  const displayImage = product.image ?? "";

  const titleId = "product-add-modal-title";

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      titleId={titleId}
      className="w-full max-w-[920px] overflow-hidden"
    >
      {/* Header (SOLID BG) */}
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="min-w-0">
          <h3
            id={titleId}
            className="truncate text-lg font-semibold text-gray-900 dark:text-white"
          >
            Add to Cart
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Choose variant, size and quantity
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-12">
        {/* Left Preview */}
        <div className="col-span-12 md:col-span-5 border-b bg-white md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 dark:bg-gray-900">
          <div className="p-6">
            <div className="overflow-hidden rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
              <img
                src={displayImage}
                alt={displayTitle}
                className="h-64 w-full object-cover md:h-[360px]"
              />
            </div>

            <p className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
              {displayTitle}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {product.id} • {displaySku}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {[product.category, product.subCategory, product.childCategory]
                .filter(Boolean)
                .map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {c}
                  </span>
                ))}
            </div>

            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  Unit Price
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${unitPrice.toFixed(2)}
                </span>
              </div>

              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  Total
                </span>
                <span className="font-semibold text-brand-500">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="col-span-12 md:col-span-7 bg-white dark:bg-gray-900">
          <div className="max-h-[520px] overflow-y-auto px-6 py-6 custom-scrollbar">
            {/* Variant */}
            {product.variants?.length ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Variant
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const active = variant === v.name;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setVariant(v.name)}
                        className={`rounded-xl px-4 py-2 text-sm font-medium ring-1 ${
                          active
                            ? "bg-brand-500 text-white ring-brand-500"
                            : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-800"
                        }`}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Size */}
            {product.sizes?.length ? (
              <div className="mt-6">
                <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Size
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => {
                    const active = size === s.name;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSize(s.name)}
                        className={`rounded-xl px-4 py-2 text-sm font-medium ring-1 ${
                          active
                            ? "bg-brand-500 text-white ring-brand-500"
                            : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-800"
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Quantity */}
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                Quantity
              </p>

              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="h-10 w-10 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200"
                  >
                    <Minus size={16} />
                  </button>

                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) =>
                      setQty(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="h-10 w-20 rounded-xl border border-gray-200 text-center font-semibold text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  />

                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="h-10 w-10 rounded-xl bg-brand-500 text-white hover:bg-brand-600"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    ${total.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer (SOLID BG – NO OPACITY) */}
          <div className="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                startIcon={<ShoppingCart size={16} />}
                onClick={() => {
                  onAdd({
                    key,
                    productId: product.id,
                    title: displayTitle,
                    sku: displaySku,
                    image: displayImage,
                    unitPrice,
                    qty,
                    variant: variant || undefined,
                    size: size || undefined,
                  });
                  onClose();
                }}
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductAddModal;
