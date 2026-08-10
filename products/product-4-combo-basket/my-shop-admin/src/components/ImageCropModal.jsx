import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  X,
  Crop,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
} from "lucide-react";
import { uploadFile } from "../api/upload.api";

// ── Helpers ─────────────────────────────────────────────────────────────────
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

async function getCroppedBlob(image, crop, scale = 1, rotate = 0) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();
  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.92,
    );
  });
}

// ── Main Modal ───────────────────────────────────────────────────────────────
export default function ImageCropModal({
  file,
  aspect = 1, // 1 = square, 4/3 = landscape, etc.
  onDone, // (url: string) => void
  onCancel,
  label = "প্রধান ছবি", // shown in header
}) {
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const imgRef = useRef(null);

  // Read file into data URL
  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () =>
      setImgSrc(reader.result?.toString() || ""),
    );
    reader.readAsDataURL(file);
  }, [file]);

  const onImageLoad = useCallback(
    (e) => {
      const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
      setCrop(centerAspectCrop(w, h, aspect));
    },
    [aspect],
  );

  // Live preview
  useEffect(() => {
    if (!completedCrop || !imgRef.current) return;
    let alive = true;
    getCroppedBlob(imgRef.current, completedCrop, scale, rotate)
      .then((blob) => {
        if (!alive) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [completedCrop, scale, rotate]);

  const handleCropAndUpload = async () => {
    if (!completedCrop || !imgRef.current) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(
        imgRef.current,
        completedCrop,
        scale,
        rotate,
      );
      const ext = file?.name?.split(".").pop() || "jpg";
      const cropped = new File([blob], `cropped_${Date.now()}.${ext}`, {
        type: "image/jpeg",
      });
      const res = await uploadFile(cropped);
      onDone(res.url);
    } catch (e) {
      alert("আপলোড ব্যর্থ: " + (e.response?.data?.message || e.message));
    } finally {
      setUploading(false);
    }
  };

  const aspectLabel =
    aspect === 1
      ? "১:১ (বর্গাকার)"
      : aspect === 4 / 3
        ? "৪:৩"
        : aspect === 16 / 9
          ? "১৬:৯"
          : "কাস্টম";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={uploading ? undefined : onCancel}
      />

      {/* Panel */}
      <div
        className="relative z-10 flex flex-col w-full max-w-4xl max-h-[95vh] rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #1a1f35 0%, #111827 100%)",
          boxShadow:
            "0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e91e63]/20">
              <Crop className="h-4 w-4 text-[#e91e63]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{label} ক্রপ করুন</p>
              <p className="text-[11px] text-slate-400">
                অনুপাত: {aspectLabel} • ছবির অংশ নির্বাচন করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Cropper Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto bg-black/30">
            {imgSrc ? (
              <ReactCrop
                crop={crop}
                onChange={(_, pct) => setCrop(pct)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                minWidth={80}
                minHeight={80}
                className="max-h-full"
              >
                <img
                  ref={imgRef}
                  alt="crop source"
                  src={imgSrc}
                  style={{
                    transform: `scale(${scale}) rotate(${rotate}deg)`,
                    maxHeight: "55vh",
                    maxWidth: "100%",
                    objectFit: "contain",
                  }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            ) : (
              <div className="flex items-center gap-2 text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-[#e91e63]" />
                <span className="text-sm">লোড হচ্ছে...</span>
              </div>
            )}
          </div>

          {/* Right Panel: Controls + Preview */}
          <div className="w-56 shrink-0 flex flex-col gap-4 p-4 border-l border-white/10 overflow-auto">
            {/* Zoom */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                জুম
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(1)))
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <div className="flex-1">
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.05"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-full accent-[#e91e63] h-1.5 rounded-full cursor-pointer"
                  />
                  <p className="text-center text-[10px] text-slate-500 mt-1">
                    {(scale * 100).toFixed(0)}%
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setScale((s) => Math.min(3, +(s + 0.1).toFixed(1)))
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Rotate */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                ঘোরান
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRotate((r) => r - 90)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <div className="flex-1">
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={rotate}
                    onChange={(e) => setRotate(Number(e.target.value))}
                    className="w-full accent-[#e91e63] h-1.5 rounded-full cursor-pointer"
                  />
                  <p className="text-center text-[10px] text-slate-500 mt-1">
                    {rotate}°
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRotate(0)}
                  className="text-[10px] text-slate-400 hover:text-white px-1.5 py-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  রিসেট
                </button>
              </div>
            </div>

            {/* Preview */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                প্রিভিউ
              </p>
              <div
                className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-800/60"
                style={{
                  backgroundImage:
                    "repeating-conic-gradient(#ffffff08 0% 25%, transparent 0% 50%)",
                  backgroundSize: "16px 16px",
                }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="crop preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-600 text-xs">
                    ক্রপ করুন
                  </div>
                )}
              </div>
              {completedCrop && (
                <p className="mt-1.5 text-center text-[10px] text-slate-500">
                  {Math.round(completedCrop.width)} ×{" "}
                  {Math.round(completedCrop.height)} px
                </p>
              )}
            </div>

            {/* Tip */}
            <div className="rounded-xl bg-[#e91e63]/10 border border-[#e91e63]/20 p-3">
              <p className="text-[10px] text-[#e91e63]/80 leading-relaxed">
                💡 ক্রপ বক্সটি ড্র্যাগ করে সরান বা কোণ টেনে আকার পরিবর্তন করুন
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/20">
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-40"
          >
            <X className="h-4 w-4" />
            বাতিল
          </button>

          <div className="flex items-center gap-3">
            {uploading && (
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-600 border-t-[#e91e63]" />
                আপলোড হচ্ছে...
              </span>
            )}
            <button
              type="button"
              onClick={handleCropAndUpload}
              disabled={!completedCrop || uploading}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              style={{
                background: "linear-gradient(135deg, #e91e63 0%, #c2185b 100%)",
                boxShadow: "0 4px 15px rgba(233,30,99,0.4)",
              }}
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />{" "}
                  আপলোড হচ্ছে
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> ক্রপ ও আপলোড করুন
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
