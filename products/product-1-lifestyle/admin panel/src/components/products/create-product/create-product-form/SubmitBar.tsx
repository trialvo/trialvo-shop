import Button from "@/components/ui/button/Button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

function SubmitBar({
  onSubmit,
  loading,
}: {
  onSubmit: () => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between rounded-xl bg-white px-6 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-14px_rgba(16,24,40,0.14)] dark:bg-gray-900 dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_10px_24px_-14px_rgba(0,0,0,0.45)]">
      <p className="hidden text-xs text-gray-400 sm:block dark:text-gray-500">
        {t("products.createProduct.reviewSections")}
      </p>
      <div className="flex w-full items-center gap-3 sm:w-auto">
        <Button
          className="h-11 w-full gap-2 rounded-lg bg-brand-600 px-6 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 sm:w-auto"
          onClick={onSubmit}
          disabled={loading}
          startIcon={
            loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )
          }
        >
          {loading ? t("products.createProduct.creatingProduct") : t("products.createProduct.createProduct")}
        </Button>
      </div>
    </div>
  );
}

export default SubmitBar;