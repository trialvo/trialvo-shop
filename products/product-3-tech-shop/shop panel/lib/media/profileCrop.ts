import type { Area } from "react-easy-crop";

/** Crop mask shown in the editor — output file remains a square JPEG. */
export type ProfileCropShape = "circle" | "square";

export type ProfileCropResult = {
  file: File;
  previewUrl: string;
};

export type ProfileImageValidationError =
  | "missing"
  | "type"
  | "too_large"
  | "unreadable";

export const PROFILE_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp" as const;

export const PROFILE_IMAGE_ACCEPT_ATTR =
  "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" as const;

/** Max upload size before crop (5 MB). */
export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Final avatar edge length in pixels. */
export const PROFILE_CROP_OUTPUT_SIZE = 512;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export function profileImageValidationMessage(
  code: ProfileImageValidationError,
): string {
  switch (code) {
    case "missing":
      return "Please choose an image.";
    case "type":
      return "Use a JPG, PNG, or WebP image.";
    case "too_large":
      return "Image must be 5 MB or smaller.";
    case "unreadable":
      return "Could not read that image. Try another file.";
    default:
      return "Invalid image.";
  }
}

/**
 * Validate a user-selected file before opening the cropper.
 */
export function validateProfileImageFile(
  file: File | null | undefined,
): ProfileImageValidationError | null {
  if (!file) return "missing";
  if (!ALLOWED_TYPES.has(file.type.toLowerCase())) return "type";
  if (file.size <= 0 || file.size > PROFILE_IMAGE_MAX_BYTES) return "too_large";
  return null;
}

function createImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () =>
      reject(new Error("Failed to load image for crop")),
    );
    // Object URLs are local; keep CORS safe for remote previews if ever used.
    img.crossOrigin = "anonymous";
    img.src = url;
  });
}

function toJpegFileName(originalName: string | undefined): string {
  const base =
    (originalName ?? "profile").replace(/\.[^.]+$/, "").trim() || "profile";
  const safe = base.replace(/[^\w.-]+/g, "_").slice(0, 60);
  return `${safe || "profile"}.jpg`;
}

/**
 * Rasterize the cropped region to a square JPEG File (avatar-ready).
 * Circle shape only affects the on-screen crop mask — upload stays square.
 */
export async function cropProfileImageToFile(options: {
  imageSrc: string;
  pixelCrop: Area;
  fileName?: string;
  outputSize?: number;
}): Promise<ProfileCropResult> {
  const {
    imageSrc,
    pixelCrop,
    fileName,
    outputSize = PROFILE_CROP_OUTPUT_SIZE,
  } = options;

  const image = await createImageElement(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser");

  const size = Math.max(1, Math.floor(outputSize));
  canvas.width = size;
  canvas.height = size;

  // White background — avoids black edges when source had transparency.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) reject(new Error("Crop failed"));
        else resolve(b);
      },
      "image/jpeg",
      0.92,
    );
  });

  const file = new File([blob], toJpegFileName(fileName), {
    type: "image/jpeg",
  });
  const previewUrl = URL.createObjectURL(file);

  return { file, previewUrl };
}

export function revokeObjectUrl(url: string | null | undefined): void {
  if (!url?.startsWith("blob:")) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    // ignore
  }
}
