import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  useAdminProfile,
  useUpdateAdminProfile,
} from "@/hooks/profile/useProfile";
import { useUploadAdminProfile } from "@/hooks/useAdmins";
import { useAuth } from "@/context/AuthProvider";
import type { ProfileContact, ProfileUser } from "./types";
import { formatNow, mapAdminProfileToUi } from "./utils";

import ProfileOverviewCard from "./components/ProfileOverviewCard";
import ProfileDetailsForm from "./components/ProfileDetailsForm";
import ChangePasswordModal from "./components/ChangePasswordModal";
import ProfileContactCard from "./components/ProfileContactCard";
import ProfileImageCropperModal from "./components/ProfileImageCropperModal";

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded bg-gray-100 dark:bg-gray-900" />
        <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-900" />
        <div className="h-4 w-3/4 rounded bg-gray-100 dark:bg-gray-900" />
        <div className="h-10 w-full rounded bg-gray-100 dark:bg-gray-900" />
      </div>
    </div>
  );
}

export default function MyProfilePage() {
  const { t } = useTranslation();
  const [refreshedAt, setRefreshedAt] = useState<string>(() => formatNow());
  const [pwdOpen, setPwdOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  const [cropSourceName, setCropSourceName] = useState<string | undefined>(
    undefined,
  );

  const { logout } = useAuth();
  const { data, isLoading, isFetching, refetch } = useAdminProfile();
  const update = useUpdateAdminProfile();
  const uploadAvatar = useUploadAdminProfile({
    onSuccess: async () => {
      await refetch();
      setRefreshedAt(formatNow());
    },
  });

  const user: ProfileUser | null = useMemo(() => {
    if (!data) return null;
    return mapAdminProfileToUi(data);
  }, [data]);

  const contact = useMemo<ProfileContact>(() => {
    return {
      email: user?.email || "",
      address: user?.address || "",
      phonePrimary: user?.phone || "",
    };
  }, [user]);

  const onRefresh = async () => {
    await refetch();
    setRefreshedAt(formatNow());
  };

  const openCropForFile = (file: File) => {
    if (cropSourceUrl) {
      URL.revokeObjectURL(cropSourceUrl);
    }
    const src = URL.createObjectURL(file);
    setCropSourceUrl(src);
    setCropSourceName(file.name);
    setCropOpen(true);
  };

  const closeCrop = () => {
    if (cropSourceUrl) {
      URL.revokeObjectURL(cropSourceUrl);
    }
    setCropSourceUrl(null);
    setCropSourceName(undefined);
    setCropOpen(false);
  };

  useEffect(() => {
    return () => {
      if (cropSourceUrl) {
        URL.revokeObjectURL(cropSourceUrl);
      }
    };
  }, [cropSourceUrl]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="h-9 w-44 rounded bg-gray-100 dark:bg-gray-900" />
            <div className="mt-2 h-4 w-96 rounded bg-gray-100 dark:bg-gray-900" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="xl:col-span-8">
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            {t("myProfile.title")}
          </h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-200 dark:hover:bg-white/[0.06]"
            onClick={onRefresh}
            disabled={isFetching}
          >
            <span className="text-gray-500 dark:text-gray-400">
              {t("myProfile.refreshedLabel")}
            </span>
            <RefreshCw size={16} className="text-brand-500" />
          </button>

          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-200">
            {refreshedAt}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left */}
        <div className="space-y-6 xl:col-span-4">
          <ProfileOverviewCard
            user={user}
            onLogout={() => logout()}
            onSelectAvatarFile={openCropForFile}
            uploading={uploadAvatar.isPending}
          />
          <ProfileContactCard contact={contact} />
        </div>

        {/* Right */}
        <div className="xl:col-span-8">
          <ProfileDetailsForm
            user={user}
            saving={update.isPending}
            onOpenChangePassword={() => setPwdOpen(true)}
            onSave={(payload) => update.mutate(payload)}
          />
        </div>
      </div>

      <ChangePasswordModal
        isOpen={pwdOpen}
        onClose={() => setPwdOpen(false)}
        email={user.email}
        onChanged={() => {
          setPwdOpen(false);
          logout();
        }}
      />

      {cropSourceUrl ? (
        <ProfileImageCropperModal
          open={cropOpen}
          imageUrl={cropSourceUrl}
          fileName={cropSourceName}
          aspect={1}
          onClose={closeCrop}
          onApply={({ file }) => {
            closeCrop();
            uploadAvatar.mutate({ id: user.id, file });
          }}
        />
      ) : null}
    </div>
  );
}
