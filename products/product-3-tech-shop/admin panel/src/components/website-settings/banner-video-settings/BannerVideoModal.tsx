"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Save, Tag, Link as LinkIcon, Image as ImageIcon, Hash } from "lucide-react";
import toast from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import VideoUploader from "@/components/ui/upload/VideoUploader";

import {
  createBannerVideo,
  getBannerVideoById,
  updateBannerVideo,
  type BannerVideoApi,
  type CreateBannerVideoPayload,
  type UpdateBannerVideoPayload,
} from "@/api/banner-videos.api";

import { toPublicUrl } from "@/utils/toPublicUrl";
import type { BannerVideoRow } from "./types";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial: BannerVideoRow | null;
  onClose: () => void;
};

function getApiErrorMessage(err: unknown): string {
  const anyErr = err as any;
  const data = anyErr?.response?.data;
  if (typeof data?.error === "string" && data.error.trim()) return data.error.trim();
  if (typeof data?.message === "string" && data.message.trim()) return data.message.trim();
  if (typeof anyErr?.message === "string" && anyErr.message.trim()) return anyErr.message.trim();
  return "Something went wrong!";
}

function mapApiToRow(v: BannerVideoApi): BannerVideoRow {
  return {
    id: v.id,
    productId: v.product_id ?? null,
    productName: v.product_name ?? null,
    label: v.label ?? null,
    videoUrl: v.video_url,
    path: v.path ?? null,
    thumb: v.thumb ?? null,
    createdAt: v.created_at,
    updatedAt: v.updated_at,
  };
}

function compactPayload<T extends Record<string, any>>(input: T): Partial<T> {
  const out: Record<string, any> = {};
  Object.entries(input).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    out[k] = v;
  });
  return out as Partial<T>;
}

export default function BannerVideoModal({ open, mode, initial, onClose }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = mode === "edit";
  const editingId = initial?.id ?? null;

  const [productId, setProductId] = useState<string>("");
  const [label, setLabel] = useState<string>("");
  const [path, setPath] = useState<string>("");
  const [thumb, setThumb] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [hasUserChanges, setHasUserChanges] = useState(false);

  const bannerVideoQuery = useQuery({
    queryKey: ["banner-video", editingId],
    queryFn: async () => {
      if (!editingId) throw new Error("Missing video id");
      const res = await getBannerVideoById(editingId);
      return res.data;
    },
    enabled: open && isEdit && !!editingId,
    staleTime: 20_000,
    retry: 1,
  });

  const apiRow = useMemo(
    () => (bannerVideoQuery.data ? mapApiToRow(bannerVideoQuery.data) : null),
    [bannerVideoQuery.data]
  );

  useEffect(() => {
    if (!open) return;
    setHasUserChanges(false);

    if (!isEdit) {
      setProductId("");
      setLabel("");
      setPath("");
      setThumb("");
      setVideoUrl("");
      return;
    }

    if (initial) {
      setProductId(initial.productId ? String(initial.productId) : "");
      setLabel(initial.label ?? "");
      setPath(initial.path ?? "");
      setThumb(initial.thumb ?? "");
      setVideoUrl(initial.videoUrl ?? "");
    }
  }, [open, isEdit, initial]);

  useEffect(() => {
    if (!open || !isEdit || !apiRow || hasUserChanges) return;
    setProductId(apiRow.productId ? String(apiRow.productId) : "");
    setLabel(apiRow.label ?? "");
    setPath(apiRow.path ?? "");
    setThumb(apiRow.thumb ?? "");
    setVideoUrl(apiRow.videoUrl ?? "");
  }, [open, isEdit, apiRow, hasUserChanges]);

  const handleChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
      (value: string) => {
        setHasUserChanges(true);
        setter(value);
      };

  const createMut = useMutation({
    mutationFn: (payload: CreateBannerVideoPayload) => createBannerVideo(payload),
    onSuccess: (res: any) => {
      if (res?.success === true) {
        toast.success(res?.message || t("bannerVideoModal.created"));
        qc.invalidateQueries({ queryKey: ["banner-videos"] });
        onClose();
        return;
      }
      toast.error(res?.message || res?.error || t("bannerVideoModal.createFailed"));
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateBannerVideoPayload }) =>
      updateBannerVideo(id, payload),
    onSuccess: (res: any) => {
      if (res?.success === true) {
        toast.success(res?.message || t("bannerVideoModal.updated"));
        qc.invalidateQueries({ queryKey: ["banner-videos"] });
        qc.invalidateQueries({ queryKey: ["banner-video", editingId] });
        onClose();
        return;
      }
      toast.error(res?.message || res?.error || t("bannerVideoModal.updateFailed"));
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const saving = createMut.isPending || updateMut.isPending;

  const onSave = () => {
    const trimmedVideo = videoUrl.trim();
    if (!trimmedVideo && !isEdit) {
      toast.error(t("bannerVideoModal.videoUrlRequired"));
      return;
    }

    const payloadBase = compactPayload({
      product_id: productId.trim() ? Number(productId) : undefined,
      label: label.trim() ? label.trim() : undefined,
      video_url: trimmedVideo || undefined,
      path: path.trim() ? path.trim() : undefined,
      thumb: thumb.trim() ? thumb.trim() : undefined,
    });

    if (isEdit) {
      if (!editingId) {
        toast.error(t("bannerVideoModal.missingId"));
        return;
      }
      const payload: UpdateBannerVideoPayload = payloadBase;
      if (!Object.keys(payload).length) {
        toast(t("bannerVideoModal.noChanges"));
        return;
      }
      updateMut.mutate({ id: editingId, payload });
      return;
    }

    const payload: CreateBannerVideoPayload = {
      ...payloadBase,
      video_url: trimmedVideo,
    } as CreateBannerVideoPayload;

    createMut.mutate(payload);
  };

  const thumbPreview = thumb.trim() ? toPublicUrl(thumb.trim()) : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? t("bannerVideoModal.titleEdit") : t("bannerVideoModal.titleCreate")}
      description={t("bannerVideoModal.description")}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("bannerVideoModal.cancel")}
          </Button>
          <Button onClick={onSave} startIcon={<Save size={16} />} disabled={saving}>
            {saving ? t("bannerVideoModal.saving") : isEdit ? t("bannerVideoModal.updateVideo") : t("bannerVideoModal.createVideo")}
          </Button>
        </>
      }
      bodyClassName="space-y-5"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          placeholder={t("bannerVideoModal.productIdPlaceholder")}
          type="number"
          value={productId}
          onChange={(e) => handleChange(setProductId)(e.target.value)}
          startIcon={<Hash size={16} />}
          hint={t("bannerVideoModal.productIdHint")}
        />

        <Input
          placeholder={t("bannerVideoModal.labelPlaceholder")}
          value={label}
          onChange={(e) => handleChange(setLabel)(e.target.value)}
          startIcon={<Tag size={16} />}
        />

        <Input
          placeholder={t("bannerVideoModal.pathPlaceholder")}
          value={path}
          onChange={(e) => handleChange(setPath)(e.target.value)}
          startIcon={<LinkIcon size={16} />}
          hint={t("bannerVideoModal.pathHint")}
        />

        <Input
          placeholder={t("bannerVideoModal.thumbPlaceholder")}
          value={thumb}
          onChange={(e) => handleChange(setThumb)(e.target.value)}
          startIcon={<ImageIcon size={16} />}
        />
      </div>

      {thumbPreview ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t("bannerVideoModal.thumbPreview")}</p>
          <div className="mt-3 h-36 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
            <img src={thumbPreview} alt="Thumbnail preview" className="h-full w-full object-cover" />
          </div>
        </div>
      ) : null}

      <VideoUploader
        label={t("bannerVideoModal.videoUrlLabel")}
        value={videoUrl}
        onChange={(next) => handleChange(setVideoUrl)(next)}
        helperText={t("bannerVideoModal.videoUrlHelper")}
      />
    </Modal>
  );
}
