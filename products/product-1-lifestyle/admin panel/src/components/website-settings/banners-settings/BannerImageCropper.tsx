"use client";

import React, { useCallback, useMemo, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button/Button";
import {
  getModalBackdropStyle,
  getModalDialogStyle,
  useModalTransition,
} from "@/components/ui/modal/useModalTransition";

type Props = {
  open: boolean;
  imageUrl: string;
  fileName?: string;
  aspect?: number; // default 3/1
  onClose: () => void;
  onApply: (result: { file: File; previewUrl: string }) => void;
};

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area, mimeType: string) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Canvas not supported");

  canvas.width = Math.max(1, Math.floor(pixelCrop.width));
  canvas.height = Math.max(1, Math.floor(pixelCrop.height));

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) return reject(new Error("Crop failed"));
        resolve(b);
      },
      mimeType || "image/jpeg",
      0.92
    );
  });

  return blob;
}

export default function ImageCropperModal({
  open,
  imageUrl,
  fileName,
  aspect = 3 / 1,
  onClose,
  onApply,
}: Props) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const { isMounted, isVisible, handleTransitionEnd } = useModalTransition(open);

  const prettyAspect = useMemo(() => `${aspect.toFixed(2)}:1`, [aspect]);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedPixels(areaPixels);
  }, []);

  const applyCrop = useCallback(async () => {
    if (!croppedPixels) return;
    try {
      setSaving(true);

      // Prefer png if original looks like png (transparent) else jpeg
      const mime = "image/jpeg";
      const blob = await getCroppedBlob(imageUrl, croppedPixels, mime);

      const safeName = fileName?.trim() ? fileName.trim() : "banner.jpg";
      const finalName = safeName.toLowerCase().endsWith(".png")
        ? safeName.replace(/\.png$/i, ".jpg")
        : safeName.toLowerCase().endsWith(".jpeg") || safeName.toLowerCase().endsWith(".jpg")
          ? safeName
          : `${safeName}.jpg`;

      const file = new File([blob], finalName, { type: blob.type || mime });
      const previewUrl = URL.createObjectURL(file);

      onApply({ file, previewUrl });
    } finally {
      setSaving(false);
    }
  }, [croppedPixels, fileName, imageUrl, onApply]);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <button
        type="button"
        style={getModalBackdropStyle(isVisible)}
        className="absolute inset-0 bg-black/70"
        onClick={() => !saving && onClose()}
        aria-label={t("bannerImageCropper.closeOverlay")}
      />

      <div
        onTransitionEnd={handleTransitionEnd}
        style={getModalDialogStyle(isVisible)}
        className="relative w-[96vw] max-w-5xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("bannerImageCropper.title")}
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400"
              dangerouslySetInnerHTML={{ __html: t("bannerImageCropper.ratioHint", { ratio: prettyAspect }) }}
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => !saving && onClose()}
            ariaLabel="Close"
            startIcon={<X size={18} />}
          />
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Crop area */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800">
                {/* 3:1 stage */}
                <div className="relative w-full overflow-hidden rounded-xl bg-black">
                  <div className="pt-[33.333%]" />
                  <div className="absolute inset-0">
                    <Cropper
                      image={imageUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={aspect}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                      restrictPosition
                      showGrid
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-5">
              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("bannerImageCropper.zoom")}</p>
                <div className="mt-3">
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>1x</span>
                    <span>{zoom.toFixed(2)}x</span>
                    <span>3x</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("bannerImageCropper.tips")}
                </h4>
                <ul className="mt-3 space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <li>• {t("bannerImageCropper.tipDrag")}</li>
                  <li>• {t("bannerImageCropper.tipZoom")}</li>
                  <li>• {t("bannerImageCropper.tipOutput")}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => !saving && onClose()} disabled={saving}>
            {t("bannerImageCropper.cancel")}
          </Button>
          <Button onClick={applyCrop} disabled={saving || !croppedPixels}>
            {saving ? t("bannerImageCropper.applying") : t("bannerImageCropper.applyCrop")}
          </Button>
        </div>
      </div>
    </div>
  );
}
