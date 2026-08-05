// src/components/orders/order-editor/OrderFormCard.tsx

import type React from "react";
import { ClipboardList, Save } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { useTranslation } from "react-i18next";
import AdminZonePicker, { type ZoneSelection } from "@/components/shared/AdminZonePicker";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "./types";

interface OrderFormValues {
  billingName: string;
  shippingAddress: string;
  orderStatus: OrderStatus;
  phone: string;
  paymentStatus: PaymentStatus;
  city: string;
  area_name: string;
  location_mapping_id: number | null;
  postalCode: string;
  email: string;
  paymentMethod: PaymentMethod;
  note: string;
}

interface OrderFormCardProps {
  values: OrderFormValues;
  onChange: <K extends keyof OrderFormValues>(key: K, value: OrderFormValues[K]) => void;
  onSubmit: () => void;
}

const OrderFormCard: React.FC<OrderFormCardProps> = ({ values, onChange, onSubmit }) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <ClipboardList size={18} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
              {t("orders.orderEditor.orderDetails")}
            </div>
            <div className="text-base font-semibold text-gray-900 dark:text-white">
              {t("orders.orderEditor.customerAndStatus")}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t("orders.orderEditor.updateFieldsDesc")}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
        {/* Left column */}
        <div className="space-y-5">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
              {t("orders.orderEditor.billingName")}
            </div>
            <Input
              value={values.billingName}
              onChange={(e) => onChange("billingName", e.target.value)}
              placeholder={t("orders.orderEditor.billingNamePlaceholder")}
              className="bg-white dark:bg-gray-800/50"
            />
          </div>

          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
              {t("orders.orderEditor.orderStatus")}
            </div>
            <Select
              options={[
                { value: "new", label: t("orders.status.new") },
                { value: "approved", label: t("orders.status.approved") },
                { value: "processing", label: t("orders.status.processing") },
                { value: "packaging", label: t("orders.status.packaging") },
                { value: "shipped", label: t("orders.status.shipped") },
                { value: "out_for_delivery", label: t("orders.status.outForDelivery") },
                { value: "delivered", label: t("orders.status.delivered") },
                { value: "returned", label: t("orders.status.returned") },
                { value: "cancelled", label: t("orders.status.cancelled") },
                { value: "on_hold", label: t("orders.status.onHold") },
                { value: "trash", label: t("orders.status.trash") },
              ]}
              defaultValue={values.orderStatus}
              onChange={(v) => onChange("orderStatus", v as OrderStatus)}
              className="bg-white dark:bg-gray-800/50"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                {t("orders.orderEditor.paymentStatus")}
              </div>
              <Select
                options={[
                  { value: "paid", label: t("orders.paymentStatus.paid") },
                  { value: "partial_paid", label: t("orders.paymentStatus.partialPaid") },
                  { value: "unpaid", label: t("orders.paymentStatus.unpaid") },
                ]}
                defaultValue={values.paymentStatus}
                onChange={(v) => onChange("paymentStatus", v as PaymentStatus)}
                className="bg-white dark:bg-gray-800/50"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
              {t("orders.orderEditor.email")}
            </div>
            <Input
              type="email"
              value={values.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder={t("orders.orderEditor.email")}
              className="bg-white dark:bg-gray-800/50"
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
              {t("orders.orderEditor.shippingAddress")}
            </div>
            <Input
              value={values.shippingAddress}
              onChange={(e) => onChange("shippingAddress", e.target.value)}
              placeholder={t("orders.orderEditor.shippingAddressPlaceholder")}
              className="bg-white dark:bg-gray-800/50"
            />
          </div>

          <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                {t("orders.orderEditor.phone")}
              </div>
              <Input
                value={values.phone}
                onChange={(e) => onChange("phone", e.target.value)}
                placeholder={t("orders.orderEditor.phone")}
                className="bg-white dark:bg-gray-800/50"
              />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                {t("orders.orderEditor.zone")}
              </div>
              <AdminZonePicker
                value={
                  values.location_mapping_id
                    ? { location_mapping_id: values.location_mapping_id, city_name: values.city, area_name: values.area_name ?? "" }
                    : null
                }
                onChange={(sel: ZoneSelection | null) => {
                  onChange("city", sel?.city_name ?? "");
                  onChange("area_name", sel?.area_name ?? "");
                  onChange("location_mapping_id", sel?.location_mapping_id ?? null);
                }}
              />
            </div>
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                {t("orders.orderEditor.postalCode")}
              </div>
              <Input
                value={values.postalCode}
                onChange={(e) => onChange("postalCode", e.target.value)}
                placeholder={t("orders.orderEditor.postalCodePlaceholder")}
                className="bg-white dark:bg-gray-800/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                {t("orders.orderEditor.paymentType")}
              </div>
              <Select
                options={[
                  { value: "gateway", label: t("orders.paymentMethod.gateway") },
                  { value: "cod", label: t("orders.paymentMethod.cod") },
                  { value: "mixed", label: t("orders.paymentMethod.mixed") },
                ]}
                defaultValue={values.paymentMethod}
                onChange={(v) => onChange("paymentMethod", v as PaymentMethod)}
                className="bg-white dark:bg-gray-800/50"
              />
            </div>
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                {t("orders.orderEditor.note")}
              </div>
              <Input
                value={values.note}
                onChange={(e) => onChange("note", e.target.value)}
                placeholder={t("orders.orderEditor.addNote")}
                className="bg-white dark:bg-gray-800/50"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={onSubmit} size="md" variant="primary" startIcon={<Save size={16} />}>
              {t("orders.orderEditor.updateOrder")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFormCard;
