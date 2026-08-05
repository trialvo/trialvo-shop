import { cn } from "@/lib/utils";
import type { BulkBuilderProduct } from "@/components/checkout/bulk-builder.types";

interface BulkProductCardProps {
  product: BulkBuilderProduct;
  isSelected: boolean;
  onAdd: () => void;
}

/**
 * Product browse card inside BulkComboBuilder — image, name, price, "Added" chip.
 */
export function BulkProductCard({ product, isSelected, onAdd }: BulkProductCardProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className={cn(
        "text-left p-3 border rounded-lg transition-all duration-200",
        isSelected
          ? "border-accent bg-accent/5 ring-1 ring-accent/20"
          : "border-border hover:border-accent/30 hover:shadow-sm"
      )}
    >
      <div className="aspect-square rounded overflow-hidden bg-secondary mb-2">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
      </div>
      <p className="text-xs font-medium text-foreground truncate">{product.name}</p>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs font-semibold text-foreground">${product.price}</span>
        {isSelected && (
          <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-medium">
            Added
          </span>
        )}
      </div>
    </button>
  );
}
