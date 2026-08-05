import { User } from "lucide-react";
import type { ReactElement } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { HeaderAccountViewModel } from "@/lib/adapters/authUser";

type HeaderUserAvatarProps = Readonly<{
  account?: HeaderAccountViewModel | null;
  className?: string;
  /** Guest / fallback — lucide User icon */
  showGuestIcon?: boolean;
}>;

/**
 * Circular avatar for header account UI.
 */
export function HeaderUserAvatar({
  account,
  className,
  showGuestIcon = false,
}: HeaderUserAvatarProps): ReactElement {
  if (showGuestIcon || !account) {
    return <User className={cn("h-5 w-5", className)} aria-hidden />;
  }

  return (
    <Avatar className={cn("h-8 w-8 rounded-full", className)}>
      {account.avatarUrl ? (
        <AvatarImage
          src={account.avatarUrl}
          alt=""
          className="rounded-full object-cover"
        />
      ) : null}
      <AvatarFallback className="rounded-full gradient-primary text-primary-foreground text-[11px] font-bold">
        {account.initials}
      </AvatarFallback>
    </Avatar>
  );
}

export default HeaderUserAvatar;
