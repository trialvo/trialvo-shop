"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";
import { FiArrowLeft } from "react-icons/fi";

type Props = {
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel: string;
  loadingLabel: string;
  cancelLabel: string;
  cancelAsBack?: boolean;
  className?: string;
};

const AccountFormActions: React.FC<Props> = ({
  onCancel,
  isLoading = false,
  submitLabel,
  loadingLabel,
  cancelLabel,
  cancelAsBack = false,
  className,
}) => {
  const cancelButton = (
    <Button
      type="button"
      variant="outline"
      onClick={onCancel}
      disabled={isLoading}
      className={cn(
        "h-11 min-w-[120px] rounded-full border-black/12 bg-white px-5 text-[13px] font-semibold text-[#191919] shadow-[0_1px_2px_rgba(20,16,12,0.04)] transition-colors hover:border-black/20 hover:bg-[#FAF8F5]",
        cancelAsBack && "gap-2",
      )}
    >
      {cancelAsBack ? <FiArrowLeft className="h-4 w-4 shrink-0" /> : null}
      {cancelLabel}
    </Button>
  );

  const submitButton = (
    <Button
      type="submit"
      disabled={isLoading}
      className="h-11 min-w-[140px] rounded-full bg-[#191919] px-6 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(20,16,12,0.18)] transition-colors hover:bg-black disabled:opacity-60"
    >
      {isLoading ? loadingLabel : submitLabel}
    </Button>
  );

  return (
    <>
      <div
        className={cn(
          "hidden items-center justify-end gap-3 border-t border-black/6 pt-5 sm:flex",
          className,
        )}
      >
        {cancelButton}
        {submitButton}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/8 bg-white/95 backdrop-blur-sm sm:hidden">
        <div className="pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex max-w-[1120px] items-center gap-2.5 px-4 py-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className={cn(
                "h-11 flex-1 rounded-full border-black/12 bg-white text-[13px] font-semibold text-[#191919]",
                cancelAsBack && "gap-2",
              )}
            >
              {cancelAsBack ? <FiArrowLeft className="h-4 w-4 shrink-0" /> : null}
              {cancelLabel}
            </Button>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 flex-[1.15] rounded-full bg-[#191919] text-[13px] font-semibold text-white hover:bg-black disabled:opacity-60"
            >
              {isLoading ? loadingLabel : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountFormActions;
