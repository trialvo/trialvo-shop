import type React from "react";
import { Tag } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";

interface SidebarShippingStickerCardProps {
  onOpenGenerator: () => void;
}

const SidebarShippingStickerCard: React.FC<SidebarShippingStickerCardProps> = ({
  onOpenGenerator,
}) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
          <Tag size={18} />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
            {t("orders.orderEditor.shippingLabels")}
          </div>
          <div className="text-base font-semibold text-gray-900 dark:text-white">
            {t("orders.orderEditor.generateSticker")}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {t("orders.orderEditor.shippingStickerDesc")}
        </p>

        <div className="flex items-center gap-4">
          <Button onClick={onOpenGenerator} size="sm" variant="primary">
            {t("orders.orderEditor.stickerGenerator")}
          </Button>

          <div className="ml-auto rounded-xl border border-gray-100 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              <div className="grid h-[60px] w-[60px] grid-cols-9 gap-[2px] rounded-lg bg-gray-100 p-1.5 dark:bg-gray-700">
                {Array.from({ length: 81 }).map((_, i) => (
                  <span
                    key={i}
                    className="rounded-[1px] bg-gray-900 dark:bg-white"
                    style={{
                      opacity: i % 3 === 0 || i % 8 === 0 ? 0.9 : 0.08,
                    }}
                  />
                ))}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                <div className="font-semibold text-gray-700 dark:text-gray-200">
                  {t("orders.orderEditor.preview")}
                </div>
                <div className="mt-0.5">{t("orders.orderEditor.variants")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarShippingStickerCard;
