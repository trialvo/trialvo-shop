import { Trash2 } from "lucide-react";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import type { BulkBuilderProduct } from "@/components/checkout/bulk-builder.types";
import type { CartItem } from "@/types";

interface BulkSelectedItemProps {
  item: CartItem;
  product: BulkBuilderProduct | undefined;
  mode: "bulk" | "combo";
  onQuantityChange: (delta: number) => void;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
  onRemove: () => void;
}

/**
 * A single selected item row inside BulkComboBuilder's "Your Selection" panel.
 * Shows image, name, optional size/color selects, QuantityStepper, price, remove button.
 */
export function BulkSelectedItem({
  item,
  product,
  mode,
  onQuantityChange,
  onSizeChange,
  onColorChange,
  onRemove,
}: BulkSelectedItemProps) {
  const step = product?.quantityStep ?? (mode === "bulk" ? 5 : 1);
  const min = product?.minQuantity ?? (mode === "bulk" ? 5 : 1);

  return (
    <div className="flex gap-3 p-3 border border-border rounded-lg bg-background group hover:border-accent/30 transition-colors">
      <div className="w-14 h-14 rounded overflow-hidden shrink-0 bg-secondary">
        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>

        {/* Size / Color selects */}
        <div className="flex flex-wrap gap-2 mt-1.5">
          {product && product.sizes.length > 1 && (
            <select
              value={item.size}
              onChange={(e) => onSizeChange(e.target.value)}
              className="h-7 px-2 text-xs border border-input rounded bg-background text-foreground"
            >
              {product.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {product && product.colors.length > 1 && (
            <select
              value={item.color}
              onChange={(e) => onColorChange(e.target.value)}
              className="h-7 px-2 text-xs border border-input rounded bg-background text-foreground"
            >
              {product.colors.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <QuantityStepper
            value={item.quantity}
            onChange={(v) => onQuantityChange(v - item.quantity)}
            min={min}
            step={step}
            size="sm"
          />
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${item.title}`}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
