import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface UploadedMedia {
  id: string;
  url: string;
  absoluteUrl?: string;
  width: number;
  height: number;
}

export type MediaKind = "product_image" | "thumbnail" | "category_icon";

interface UploadArgs {
  file: File;
  kind?: MediaKind;
  ownerType?: "product" | "category";
  ownerId?: string;
}

async function uploadMedia({ file, kind, ownerType, ownerId }: UploadArgs): Promise<UploadedMedia> {
  const fd = new FormData();
  fd.append("file", file);
  if (kind) fd.append("kind", kind);
  if (ownerType) fd.append("owner_type", ownerType);
  if (ownerId) fd.append("owner_id", ownerId);
  return api.upload<UploadedMedia>("/admin/media/upload", fd);
}

export function useUploadMedia() {
  return useMutation({ mutationFn: uploadMedia });
}

/** Best-effort cleanup of uploaded files the admin removed from the form. */
export function useCleanupMediaUrls() {
  return useMutation({
    mutationFn: (urls: string[]) =>
      api.post<{ message: string; deleted: number }>("/admin/media/cleanup", { urls }),
  });
}
