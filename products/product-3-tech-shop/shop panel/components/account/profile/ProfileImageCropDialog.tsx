"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Circle, Square } from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  cropProfileImageToFile,
  type ProfileCropResult,
  type ProfileCropShape,
} from "@/lib/media/profileCrop";

type ProfileImageCropDialogProps = Readonly<{
  open: boolean;
  imageUrl: string;
  fileName?: string;
  onOpenChange: (open: boolean) => void;
  onApply: (result: ProfileCropResult) => void;
}>;

/**
 * Standard avatar crop dialog — zoom + circle/square mask.
 * Output is always a square JPEG (circle is preview mask only).
 */
export function ProfileImageCropDialog({
  open,
  imageUrl,
  fileName,
  onOpenChange,
  onApply,
}: ProfileImageCropDialogProps): ReactElement {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [shape, setShape] = useState<ProfileCropShape>("circle");
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset editor state whenever a new source image opens.
  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setShape("circle");
    setCroppedPixels(null);
    setSaving(false);
    setError(null);
  }, [open, imageUrl]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedPixels(pixels);
  }, []);

  const handleApply = async () => {
    if (!croppedPixels || saving) return;
    setSaving(true);
    setError(null);
    try {
      const result = await cropProfileImageToFile({
        imageSrc: imageUrl,
        pixelCrop: croppedPixels,
        fileName,
      });
      onApply(result);
      onOpenChange(false);
    } catch {
      setError("Could not crop this image. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="rounded-sm sm:max-w-xl gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border space-y-1">
          <DialogTitle className="font-heading">Crop profile photo</DialogTitle>
          <DialogDescription className="text-xs">
            Drag to reposition. Choose circle or square for the guide — upload
            stays a square photo.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          <div className="relative w-full overflow-hidden rounded-sm bg-black">
            <div className="relative w-full pt-[100%]">
              <div className="absolute inset-0">
                <Cropper
                  image={imageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape={shape === "circle" ? "round" : "rect"}
                  showGrid={shape === "square"}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  restrictPosition
                  objectFit="contain"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Zoom</span>
                <span className="tabular-nums">{zoom.toFixed(2)}×</span>
              </div>
              <Slider
                min={1}
                max={3}
                step={0.01}
                value={[zoom]}
                onValueChange={(v) => setZoom(v[0] ?? 1)}
                aria-label="Zoom"
              />
            </div>

            <div className="shrink-0 space-y-1.5">
              <p className="text-xs text-muted-foreground">Crop guide</p>
              <ToggleGroup
                type="single"
                value={shape}
                onValueChange={(v) => {
                  if (v === "circle" || v === "square") setShape(v);
                }}
                variant="outline"
                size="sm"
                className="justify-start"
                aria-label="Crop shape"
              >
                <ToggleGroupItem value="circle" aria-label="Circle" className="gap-1.5 px-3">
                  <Circle className="h-3.5 w-3.5" aria-hidden />
                  Circle
                </ToggleGroupItem>
                <ToggleGroupItem value="square" aria-label="Square" className="gap-1.5 px-3">
                  <Square className="h-3.5 w-3.5" aria-hidden />
                  Square
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="px-5 py-4 border-t border-border sm:justify-end gap-2">
          <AppButton
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </AppButton>
          <AppButton
            type="button"
            disabled={saving || !croppedPixels}
            isLoading={saving}
            loadingText="Applying…"
            onClick={() => void handleApply()}
          >
            Apply crop
          </AppButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
