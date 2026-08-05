import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal } from "../ui/modal";
import PaginationFooter from "./PaginationFooter";
import { StockAlertProductRow } from "../../pages/Dashboard/dashboardSection5Data";

interface Props {
  open: boolean;
  onClose: () => void;
  rows: StockAlertProductRow[];
  setRows: React.Dispatch<React.SetStateAction<StockAlertProductRow[]>>;
}

const PAGE_SIZE = 10;

const StockAlertProductsModal = ({ open, onClose, rows, setRows }: Props) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (open) setPage(1);
  }, [open]);

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [page, rows]);

  const updateStock = (id: string, delta: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, stock: Math.max(0, r.stock + delta) } : r
      )
    );
  };

  const onPrev = () => setPage((p) => Math.max(1, p - 1));
  const onNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="w-full max-w-[900px] max-h-[700px] overflow-hidden"
    >
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("dashboard.stockAlertModal.title")}
        </h3>
      </div>

      <div className="max-h-[calc(700px-72px)] overflow-y-auto px-6 py-4">
        <div className="grid grid-cols-12 rounded-lg bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 dark:bg-white/[0.04] dark:text-gray-200">
          <div className="col-span-2">{t("dashboard.stockAlertModal.image")}</div>
          <div className="col-span-6">{t("dashboard.stockAlertModal.name")}</div>
          <div className="col-span-2 text-center">{t("dashboard.stockAlertModal.price")}</div>
          <div className="col-span-2 text-right">{t("dashboard.stockAlertModal.stock")}</div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {pageRows.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-12 items-center px-4 py-4"
            >
              <div className="col-span-2">
                <img
                  src={p.image}
                  alt={p.title}
                  className="h-11 w-11 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-800"
                />
              </div>

              <div className="col-span-6 min-w-0">
                <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                  {p.title}
                </p>
                <p className="text-xs text-gray-400">
                  {t("dashboard.stockAlertModal.order")}: {p.id} • {t("dashboard.stockAlertModal.sku")}: {p.sku}
                </p>
              </div>

              <div className="col-span-2 text-center text-sm text-gray-600 dark:text-gray-300">
                {p.price}
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => updateStock(p.id, -1)}
                  disabled={p.stock <= 0}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                >
                  <Minus size={14} />
                </button>

                <span className="min-w-[24px] text-right text-sm font-medium text-gray-700 dark:text-gray-200">
                  {p.stock}
                </span>

                <button
                  onClick={() => updateStock(p.id, 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 text-white hover:bg-brand-600"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <PaginationFooter
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          onPrev={onPrev}
          onNext={onNext}
        />
      </div>
    </Modal>
  );
};

export default StockAlertProductsModal;
