"use client";

import ModalShell from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/redux/hooks";
import { closeModalById } from "@/redux/slices/modalManagerSlice";
import { X } from "lucide-react";
import React from "react";
import { FiPlus } from "react-icons/fi";
import MultiAddItemRow, { type MultiAddLineState } from "./MultiAddItemRow";
import { MultiAddProduct, MultiAddSubmitPayload } from "./types";
import { useAnalytics } from "@/lib/analytics/useAnalytics";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTop?: boolean;
  zIndex?: number;

  product: MultiAddProduct;

  modalId?: number;

  onAddToCart?: (payload: MultiAddSubmitPayload) => void | Promise<void>;
  className?: string;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const makeLine = (p: MultiAddProduct): MultiAddLineState => ({
  rowId: uid(),
  product: p,
  size: p.sizes?.[0] ?? (""),
  color: p.colors?.[0] ?? (""),
  quantity: 1,
});

const MultiAddModal: React.FC<Props> = ({
  open,
  onOpenChange,
  isTop = true,
  zIndex = 70,
  product,
  modalId,
  onAddToCart,
  className,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { trackAddToCart: fireAddToCart } = useAnalytics();
  const [lines, setLines] = React.useState<MultiAddLineState[]>(() => [makeLine(product)]);
  const MAX = 5;

  React.useEffect(() => {
    if (!open) return;
    setLines([makeLine(product)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product.id]);

  const handleClose = () => {
    onOpenChange(false);
    if (typeof modalId === "number") dispatch(closeModalById(modalId));
  };

  const addMore = () => {
    setLines((prev) => {
      if (prev.length >= MAX) return prev;
      return [...prev, makeLine(product)];
    });
  };

  const removeLineAt = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLineAt = (idx: number, next: MultiAddLineState) => {
    setLines((prev) => prev.map((x, i) => (i === idx ? next : x)));
  };

  const handleAddToCart = async () => {
    const payload: MultiAddSubmitPayload = {
      lines: lines.map((l) => ({
        productId: l.product.id,
        size: l.size,
        color: l.color,
        quantity: l.quantity,
      })),
    };

    await onAddToCart?.(payload);
    // Fire analytics event for each line
    for (const l of lines) {
      fireAddToCart({
        content_ids: [String(l.product.id)],
        content_name: l.product.title ?? "",
        content_type: "product",
        value: (l.product.price ?? 0) * l.quantity,
        quantity: l.quantity,
      });
    }
    handleClose();
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
        else onOpenChange(v);
      }}
      isTop={isTop}
      zIndex={zIndex}
      contentClassName={cn(
        "w-[calc(100vw-24px)] max-w-[850px]",
        "p-0 rounded-none border border-[#EDEDED] bg-white",
        className,
      )}
    >
      <Button
        type="button"
        onClick={handleClose}
        className="absolute -right-5 -top-5 h-10 w-10 rounded-none bg-black p-0 text-white hover:bg-black/90"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </Button>

      <div className="p-4 lg:p-6">
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          {lines.map((line, idx) => (
            <MultiAddItemRow
              key={line.rowId}
              index={idx}
              line={line}
              onChange={(next) => updateLineAt(idx, next)}
              onRemove={idx === 0 ? undefined : () => removeLineAt(idx)}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={addMore}
            disabled={lines.length >= MAX}
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-black",
              "hover:underline underline-offset-4 disabled:opacity-40 disabled:hover:no-underline",
            )}
          >
            <FiPlus className="h-4 w-4" />
            {t("multiAdd.addMore")}
          </button>

          <div className="flex-1">
            <Button
              type="button"
              onClick={handleAddToCart}
              className="h-9 w-full rounded-none bg-black text-sm font-medium text-white hover:bg-black/90"
            >
              {t("multiAdd.addToCart")}
            </Button>
          </div>
        </div>

        {lines.length >= MAX ? (
          <div className="mt-2 text-xs text-black/50">{t("multiAdd.maxItems").replace("{MAX}", String(MAX))}</div>
        ) : null}
      </div>
    </ModalShell>
  );
};

export default MultiAddModal;
