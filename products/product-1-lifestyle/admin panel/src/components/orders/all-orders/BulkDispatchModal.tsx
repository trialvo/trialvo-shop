import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui";
import { Truck } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { api } from "@/api/client";
import { ordersKeys } from "@/api/orders.api";

type Props = {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onClearSelection: () => void;
};

export default function BulkDispatchModal({ open, onClose, selectedIds, onClearSelection }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<"steadfast" | "pathao">("steadfast");

  const dispatchMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/admin/orders/bulk-dispatch", {
        order_ids: selectedIds.map(Number),
        courier_provider: provider,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Bulk dispatch request successful");
      if (data.data?.failed?.length > 0) {
        toast.error(`${data.data.failed.length} orders were skipped.`, { duration: 5000 });
      }
      queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
      onClearSelection();
      onClose();
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err?.response?.data?.error || "Failed to bulk dispatch orders"
      );
    },
  });

  return (
    <Modal open={open} onClose={onClose} size="sm" title="Bulk Dispatch">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bulk Dispatch Orders
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedIds.length} orders selected
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Courier Provider
            </label>
            <div className="flex flex-col gap-3">
              <label
                className={`flex cursor-pointer border items-center gap-3 rounded-xl p-4 transition-all ${
                  provider === "steadfast"
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                    : "border-gray-200 bg-white hover:border-brand-200 dark:border-gray-800 dark:bg-gray-900"
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value="steadfast"
                  checked={provider === "steadfast"}
                  onChange={() => setProvider("steadfast")}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-600"
                />
                <span className="font-semibold text-gray-900 dark:text-white">Steadfast</span>
              </label>

              <label
                className={`flex cursor-pointer border items-center gap-3 rounded-xl p-4 transition-all ${
                  provider === "pathao"
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                    : "border-gray-200 bg-white hover:border-brand-200 dark:border-gray-800 dark:bg-gray-900"
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value="pathao"
                  checked={provider === "pathao"}
                  onChange={() => setProvider("pathao")}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-600"
                />
                <span className="font-semibold text-gray-900 dark:text-white">Pathao</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => dispatchMutation.mutate()}
            disabled={dispatchMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-50"
          >
            {dispatchMutation.isPending ? "Dispatching..." : "Confirm Dispatch"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
