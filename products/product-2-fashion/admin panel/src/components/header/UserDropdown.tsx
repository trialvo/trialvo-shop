import { useMemo, useState } from "react";
import { ChevronDown, HelpCircle, LogOut, Settings, User } from "lucide-react";

import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useAuth } from "@/context/AuthProvider";
import { useAdminProfile } from "@/hooks/profile/useProfile";
import { toPublicUrl } from "@/utils/toPublicUrl";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const { admin, isAuthed, logout } = useAuth();

  // fetch profile from API (only when authed)
  const profileQuery = useAdminProfile({ enabled: isAuthed });
  const profile = profileQuery.data;

  const displayName = useMemo(() => {
    const firstName = profile?.first_name ?? admin?.first_name ?? null;
    const lastName = profile?.last_name ?? admin?.last_name ?? null;

    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;

    const email = profile?.email ?? admin?.email ?? null;
    if (email) return email;

    return "Admin";
  }, [
    admin?.email,
    admin?.first_name,
    admin?.last_name,
    profile?.email,
    profile?.first_name,
    profile?.last_name,
  ]);

  const displayEmail = useMemo(
    () => profile?.email ?? admin?.email ?? "",
    [admin?.email, profile?.email],
  );

  const avatarSrc = useMemo(() => {
    const path = profile?.profile_img_path ?? admin?.profile_img_path ?? null;
    const url = path ? toPublicUrl(path) : "";
    return url || "/images/user/owner.jpg";
  }, [admin?.profile_img_path, profile?.profile_img_path]);

  function toggleDropdown() {
    setIsOpen((v) => !v);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        className="dropdown-toggle flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04] xl:pr-2"
        aria-label="Open user menu"
        aria-expanded={isOpen}
      >
        <span className="h-10 w-10 overflow-hidden rounded-full border border-gray-200 dark:border-gray-700">
          <img
            src={avatarSrc}
            alt={displayName}
            className="h-full w-full object-cover"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src.includes("/images/user/owner.jpg")) return;
              img.src = "/images/user/owner.jpg";
            }}
          />
        </span>

        <span className="mr-0.5 hidden max-w-[140px] truncate text-sm font-medium xl:block">
          {displayName}
        </span>

        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {displayName}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {displayEmail || (isAuthed ? "" : "Not signed in")}
          </span>
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/my-profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <User className="h-5 w-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300" />
              Edit profile
            </DropdownItem>
          </li>

          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/support"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <HelpCircle className="h-5 w-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300" />
              Support
            </DropdownItem>
          </li>
        </ul>

        <button
          type="button"
          onClick={() => {
            closeDropdown();
            logout();
          }}
          className="flex w-full items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          <LogOut className="h-5 w-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300" />
          Sign out
        </button>
      </Dropdown>
    </div>
  );
}
