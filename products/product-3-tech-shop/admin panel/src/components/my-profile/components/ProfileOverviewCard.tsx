import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/button/Button";
import type { ProfileUser } from "../types";
import { imageFallbackSvgDataUri } from "@/utils/imageFallback";
import { toPublicUrl } from "@/utils/toPublicUrl";

type Props = {
  user: ProfileUser;
  onLogout: () => void;
  onSelectAvatarFile: (file: File) => void;
  uploading?: boolean;
};

export default function ProfileOverviewCard({
  user,
  onLogout,
  onSelectAvatarFile,
  uploading = false,
}: Props) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const name = useMemo(() => {
    const n = `${user.firstName} ${user.lastName}`.trim();
    return n || "—";
  }, [user.firstName, user.lastName]);
  const fallback = useMemo(() => imageFallbackSvgDataUri(name), [name]);
  const avatarSrc = user.avatarUrl ? toPublicUrl(user.avatarUrl) : fallback;

  const statusClass =
    user.status === "active" ? "bg-success-600 text-white" : "bg-gray-600 text-white";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900">
            <img
              src={avatarSrc}
              alt={name}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(event) => {
                const target = event.currentTarget;
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
          </div>

          <span
            className={`absolute bottom-1 right-2 inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold ${statusClass}`}
          >
            {user.status.toUpperCase()}
          </span>
        </div>

        <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">{name}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user.email}</p>

        <span className="mt-3 inline-flex items-center rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
          {user.role}
        </span>

        {user.lastVisitAt ? (
          <p className="mt-3 text-sm text-brand-500">
            {t("myProfile.overview.lastLogin", { date: user.lastVisitAt })}
          </p>
        ) : null}

        <div className="mt-5 w-full">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSelectAvatarFile(file);
              e.currentTarget.value = "";
            }}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            isLoading={uploading}
            loadingText={t("myProfile.overview.uploadLoading")}
          >
            {t("myProfile.overview.uploadButton")}
          </Button>
        </div>

        <div className="mt-3 w-full">
          <Button onClick={onLogout} className="w-full">
            {t("myProfile.overview.logout")}
          </Button>
        </div>
      </div>
    </div>
  );
}
