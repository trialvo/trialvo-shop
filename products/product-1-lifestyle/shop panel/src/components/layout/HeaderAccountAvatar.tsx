"use client";

import { User } from "lucide-react";
import { useEffect, useState } from "react";

interface HeaderAccountAvatarProps {
  isAuthenticated: boolean;
  avatarUrl?: string | null;
  name?: string | null;
}

export function HeaderAccountAvatar({
  isAuthenticated,
  avatarUrl,
  name,
}: HeaderAccountAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  if (isAuthenticated && avatarUrl && !imageFailed) {
    return (
      <img
        src={avatarUrl}
        alt={name || "avatar"}
        className="w-6 h-6 rounded-full object-cover border border-header-border"
        referrerPolicy="no-referrer"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return <User size={19} strokeWidth={1.5} />;
}
