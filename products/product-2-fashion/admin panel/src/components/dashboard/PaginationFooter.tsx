import Button from "../ui/button/Button";
import { useTranslation } from "react-i18next";

interface Props {
  total: number;
  page: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
}

const PaginationFooter = ({ total, page, pageSize, onPrev, onNext }: Props) => {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>{t("dashboard.pagination.showingEntries", { count: total })}</span>
        <span className="text-gray-400">→</span>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="text-sm text-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("dashboard.pagination.prev")}
        </button>

        <Button size="sm" variant="primary" className="min-w-[34px] px-0">
          {page}
        </Button>

        <button
          onClick={onNext}
          disabled={!canNext}
          className="text-sm text-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("dashboard.pagination.next")}
        </button>
      </div>
    </div>
  );
};

export default PaginationFooter;
