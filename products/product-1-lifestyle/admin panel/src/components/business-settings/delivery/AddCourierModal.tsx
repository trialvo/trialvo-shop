// src/components/delivery-settings/AddCourierModal.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Image as ImageIcon } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import Modal from "@/components/ui/modal/Modal";

import { cn } from "@/lib/utils";
import { toPublicUrl } from "@/utils/toPublicUrl";

import { createDeliveryCharge, getDeliveryCharge, updateDeliveryCharge } from "@/api/delivery-charges.api";
import { deliveryTypeLabel, normalizeDeliveryType, type DeliveryChargeType } from "./types";

type Option = { value: string; label: string };

const TYPE_OPTIONS: Option[] = [
  { value: "outside_of_dhaka", label: "Outside Dhaka" },
  { value: "inside_of_dhaka", label: "Inside Dhaka" },
  { value: "inside_chittagong", label: "Inside Chittagong" },
  { value: "outside_chittagong", label: "Outside Chittagong" },
  { value: "free_delivery", label: "Free Delivery" },
];

function safeNumber(v: string, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function AddCourierModal({
  open,
  onClose,
  onSaved,
  mode,
  editId,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;

  // ✅ dynamic mode
  mode: "create" | "edit";
  editId?: number;
}) {
  const isEdit = mode === "edit";

  // load single for edit
  const editQuery = useQuery({
    queryKey: ["deliveryCharge", editId],
    queryFn: () => {
      if (!editId) return Promise.resolve(null);
      return getDeliveryCharge(editId);
    },
    enabled: Boolean(open && isEdit && editId),
    retry: 1,
  });

  const [title, setTitle] = useState("");
  const [type, setType] = useState<DeliveryChargeType>("outside_of_dhaka");

  const [customerCharge, setCustomerCharge] = useState("60");
  const [ourCharge, setOurCharge] = useState("40");
  const [weightFreeKg, setWeightFreeKg] = useState("0");
  const [extraPerKg, setExtraPerKg] = useState("0");

  const [status, setStatus] = useState(true);

  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreviewUrl, setImgPreviewUrl] = useState("");

  const isFree = type === "free_delivery";

  // hydrate form on edit load
  useEffect(() => {
    if (!open) return;

    if (!isEdit) {
      // create defaults
      setTitle("");
      setType("outside_of_dhaka");
      setCustomerCharge("60");
      setOurCharge("40");
      setWeightFreeKg("0");
      setExtraPerKg("0");
      setStatus(true);

      setImgFile(null);
      if (imgPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(imgPreviewUrl);
      setImgPreviewUrl("");
      return;
    }

    const data = editQuery.data;
    if (!data) return;

    setTitle(String(data.title ?? ""));
    setType(normalizeDeliveryType(data.type));

    setCustomerCharge(String(Number(data.customer_charge ?? 0)));
    setOurCharge(String(Number(data.our_charge ?? 0)));
    setWeightFreeKg(String(Number(data.default_weight_kg ?? 0)));
    setExtraPerKg(String(Number(data.extra_charge_per_kg ?? 0)));

    setStatus(Boolean(data.status));

    // show existing server image
    setImgFile(null);
    if (imgPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(imgPreviewUrl);

    const serverImg = data.img_path ? toPublicUrl(data.img_path) : "";
    setImgPreviewUrl(serverImg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, editQuery.data]);

  // cleanup blob url
  useEffect(() => {
    return () => {
      if (imgPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(imgPreviewUrl);
    };
  }, [imgPreviewUrl]);

  const errors = useMemo(() => {
    const t = title.trim();
    const customer = safeNumber(customerCharge, NaN);
    const own = safeNumber(ourCharge, NaN);

    return {
      title: !t ? "Title is required." : "",
      customer: isFree ? "" : !(customer >= 0) ? "Enter a valid customer charge." : "",
      own: !(own >= 0) ? "Enter a valid our charge." : "",
    };
  }, [title, customerCharge, ourCharge, isFree]);

  const canSave = useMemo(() => !errors.title && !errors.customer && !errors.own, [errors]);

  const createMutation = useMutation({
    mutationFn: () =>
      createDeliveryCharge({
        delivery_img: imgFile ?? null,
        title: title.trim(),
        type,
        customer_charge: isFree ? 0 : Math.max(0, safeNumber(customerCharge, 0)),
        our_charge: Math.max(0, safeNumber(ourCharge, 0)),
        default_weight_kg: Math.max(0, safeNumber(weightFreeKg, 0)),
        extra_charge_per_kg: Math.max(0, safeNumber(extraPerKg, 0)),
        status,
      }),
    onSuccess: (res: any) => {
      if (res?.success === true) {
        toast.success("Courier charge created");
        onSaved();
        return;
      }
      const msg = res?.error ?? res?.message ?? "Failed to create";
      toast.error(msg);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? "Failed to create";
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editId) throw new Error("Missing editId");

      return updateDeliveryCharge(editId, {
        // only send file if user selected a new one
        ...(imgFile ? { delivery_img: imgFile } : {}),
        title: title.trim(),
        type,
        customer_charge: isFree ? 0 : Math.max(0, safeNumber(customerCharge, 0)),
        our_charge: Math.max(0, safeNumber(ourCharge, 0)),
        default_weight_kg: Math.max(0, safeNumber(weightFreeKg, 0)),
        extra_charge_per_kg: Math.max(0, safeNumber(extraPerKg, 0)),
        status,
      });
    },
    onSuccess: (res: any) => {
      if (res?.success === true) {
        toast.success("Courier charge updated");
        onSaved();
        return;
      }
      const msg = res?.error ?? res?.message ?? "Failed to update";
      toast.error(msg);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? "Failed to update";
      toast.error(msg);
    },
  });

  const saving = createMutation.isPending || updateMutation.isPending;

  const save = () => {
    if (!canSave) return;
    if (isEdit) updateMutation.mutate();
    else createMutation.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (saving) return;
        onClose();
      }}
      title={isEdit ? "Edit Courier" : "Add New Courier"}
      description={isEdit ? "Update delivery charge settings." : "Create delivery charge (multipart form-data) for a zone and manage availability."}
      size="xl"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => {
              if (saving) return;
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave || saving || (isEdit && editQuery.isLoading)}>
            {saving ? "Saving..." : isEdit ? "Update" : "Add Courier"}
          </Button>
        </>
      }
    >
      {isEdit && editQuery.isLoading ? (
        <div className="space-y-3">
          <div className="h-12 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
          <div className="h-12 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
          <div className="h-12 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Courier Info</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Title, zone type and pricing.</p>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Title <span className="text-error-500">*</span>
                  </p>
                  <Input value={title} onChange={(e) => setTitle(String(e.target.value))} placeholder="dhakar baire" />
                  {errors.title ? <p className="text-xs text-error-500">{errors.title}</p> : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</p>
                  <Select
                    key={`type-${type}`}
                    options={TYPE_OPTIONS}
                    placeholder="Select type"
                    defaultValue={String(type)}
                    onChange={(v) => setType(String(v) as DeliveryChargeType)}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Customer Charge (BDT) {!isFree ? <span className="text-error-500">*</span> : null}
                  </p>
                  <Input
                    value={isFree ? "0" : customerCharge}
                    onChange={(e) => setCustomerCharge(String(e.target.value))}
                    placeholder="200"
                    disabled={isFree}
                  />
                  {errors.customer ? (
                    <p className="text-xs text-error-500">{errors.customer}</p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Checkout এ customer কে দেখাবে।</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Our Charge (BDT) <span className="text-error-500">*</span>
                  </p>
                  <Input value={ourCharge} onChange={(e) => setOurCharge(String(e.target.value))} placeholder="100" />
                  {errors.own ? (
                    <p className="text-xs text-error-500">{errors.own}</p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Internal cost (profit calculation ready)।</p>
                  )}
                </div>

                {/* Weight surcharge settings */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Free Weight Threshold (kg)
                  </p>
                  <Input
                    value={weightFreeKg}
                    onChange={(e) => setWeightFreeKg(String(e.target.value))}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Orders up to this weight pay no extra charge. 0 = always charge per kg.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Extra Charge per kg (BDT)
                  </p>
                  <Input
                    value={extraPerKg}
                    onChange={(e) => setExtraPerKg(String(e.target.value))}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Charged per kg above the free threshold. 0 = no weight surcharge.
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Availability</p>
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/40">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{status ? "Enabled" : "Disabled"}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Disable to stop showing this delivery option.</p>
                    </div>

                    <Switch key={`st-${status}`} label="" defaultChecked={status} onChange={(checked) => setStatus(checked)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Delivery Image</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Uploaded as <span className="font-mono">delivery_img</span> (optional).
              </p>

              <div className="mt-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                    {imgPreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgPreviewUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="text-gray-400" size={18} />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/[0.03]">
                      Upload
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setImgFile(f);
                          if (!f) return;

                          if (imgPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(imgPreviewUrl);
                          setImgPreviewUrl(URL.createObjectURL(f));
                        }}
                      />
                    </label>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setImgFile(null);
                        if (imgPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(imgPreviewUrl);
                        setImgPreviewUrl("");
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Preview</p>

                  <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">{title.trim() || "—"}</p>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Type: <span className="font-semibold text-gray-700 dark:text-gray-200">{deliveryTypeLabel(type)}</span>
                  </p>

                  <div className="mt-3 space-y-1">
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Customer: {isFree ? 0 : Math.max(0, safeNumber(customerCharge, 0))} BDT
                    </p>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Our Cost: {Math.max(0, safeNumber(ourCharge, 0))} BDT
                    </p>
                  </div>

                  <div
                    className={cn(
                      "mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                      status
                        ? "bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                        : "bg-error-100 text-error-700 dark:bg-error-500/10 dark:text-error-300",
                    )}
                  >
                    {status ? "Active" : "Inactive"}
                  </div>
                </div>

                {isEdit ? (
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Note: Image will only be updated if you upload a new one.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
