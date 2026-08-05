"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
} from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProfileImageCropDialog } from "@/components/account/profile/ProfileImageCropDialog";
import { AppButton } from "@/components/shared/AppButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthContext } from "@/context/AuthContext";
import type { User } from "@/lib/api/auth/service";
import { displayNameFromUser, toDashboardWelcome } from "@/lib/adapters/accountDashboard";
import { getUnknownErrorMessage } from "@/lib/api/errors";
import { resolveMediaUrl } from "@/lib/media/url";
import {
  PROFILE_IMAGE_ACCEPT_ATTR,
  profileImageValidationMessage,
  revokeObjectUrl,
  validateProfileImageFile,
  type ProfileCropResult,
} from "@/lib/media/profileCrop";
import { cn } from "@/lib/utils";

type ProfilePhotoFieldProps = Readonly<{
  user: User | null | undefined;
  className?: string;
}>;

function resolveAvatarSrc(
  user: User | null | undefined,
  localPreview: string | null,
): string | null {
  if (localPreview) return localPreview;
  const path = user?.img_path;
  if (!path) return null;
  const url = resolveMediaUrl(path, "");
  if (!url || url === "/placeholder.jpg") return null;
  if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) return null;
  return url;
}

/**
 * Profile photo control — pick → crop (circle/square guide) → upload.
 * Uploads immediately via updateProfile({ profile }) so text fields stay independent.
 */
export function ProfilePhotoField({
  user,
  className,
}: ProfilePhotoFieldProps): ReactElement {
  const auth = useAuthContext();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState<string | undefined>();
  const [cropOpen, setCropOpen] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const welcome = toDashboardWelcome(user);
  const avatarSrc = resolveAvatarSrc(user, localPreview);
  const displayName = displayNameFromUser(user);

  // Drop stale previews when the server avatar path updates.
  useEffect(() => {
    if (!user?.img_path) return;
    setLocalPreview((prev) => {
      revokeObjectUrl(prev);
      return null;
    });
  }, [user?.img_path]);

  useEffect(() => {
    return () => {
      revokeObjectUrl(sourceUrl);
      revokeObjectUrl(localPreview);
    };
    // Only on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    // Allow re-selecting the same file later
    event.target.value = "";

    const validation = validateProfileImageFile(file);
    if (validation || !file) {
      toast.error(
        profileImageValidationMessage(validation ?? "missing"),
      );
      return;
    }

    revokeObjectUrl(sourceUrl);
    const nextUrl = URL.createObjectURL(file);
    setSourceUrl(nextUrl);
    setSourceName(file.name);
    setCropOpen(true);
  };

  const handleCropOpenChange = (open: boolean) => {
    setCropOpen(open);
    if (!open) {
      revokeObjectUrl(sourceUrl);
      setSourceUrl(null);
      setSourceName(undefined);
    }
  };

  const handleApplyCrop = async (result: ProfileCropResult) => {
    revokeObjectUrl(localPreview);
    setLocalPreview(result.previewUrl);
    setUploading(true);
    try {
      await auth.updateProfile({ profile: result.file });
      toast.success("Profile photo updated");
    } catch (err) {
      revokeObjectUrl(result.previewUrl);
      setLocalPreview(null);
      toast.error(
        getUnknownErrorMessage(
          err,
          auth.error || "Failed to upload profile photo",
        ),
      );
    } finally {
      setUploading(false);
      revokeObjectUrl(sourceUrl);
      setSourceUrl(null);
      setSourceName(undefined);
    }
  };

  const busy = uploading;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative shrink-0">
        <Avatar
          className={cn(
            "h-20 w-20 rounded-full border border-border",
            busy && "opacity-70",
          )}
        >
          {avatarSrc ? (
            <AvatarImage
              src={avatarSrc}
              alt={`${displayName} profile photo`}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="bg-secondary text-sm font-semibold font-heading">
            {welcome.initials}
          </AvatarFallback>
        </Avatar>
        {busy ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/50">
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
            <span className="sr-only">Uploading photo</span>
          </span>
        ) : null}
      </div>

      <div className="min-w-0 space-y-1.5">
        <p className="text-sm font-medium">Profile photo</p>
        <p className="text-[11px] text-muted-foreground">
          JPG, PNG or WebP · max 5 MB · crop before upload
        </p>
        <div className="flex flex-wrap gap-2 pt-0.5">
          <AppButton
            type="button"
            size="sm"
            variant="outline"
            className="text-xs h-8"
            disabled={busy}
            onClick={openPicker}
          >
            <Camera className="h-3.5 w-3.5 mr-1.5" aria-hidden />
            {avatarSrc ? "Change photo" : "Upload photo"}
          </AppButton>
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept={PROFILE_IMAGE_ACCEPT_ATTR}
            className="sr-only"
            onChange={handleFileChange}
            disabled={busy}
          />
        </div>
      </div>

      {sourceUrl ? (
        <ProfileImageCropDialog
          open={cropOpen}
          imageUrl={sourceUrl}
          fileName={sourceName}
          onOpenChange={handleCropOpenChange}
          onApply={(result) => void handleApplyCrop(result)}
        />
      ) : null}
    </div>
  );
}
