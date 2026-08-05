"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import AuthCookies from "@/lib/auth/cookies";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/redux/hooks";
import { setError } from "@/redux/slices/authSlice";
import { useRouter } from "next/navigation";
import React from "react";
import {
  FiArrowLeft,
  FiCreditCard,
  FiHeart,
  FiList,
  FiLock,
  FiLogOut,
  FiMapPin,
  FiUser,
} from "react-icons/fi";
import AccountMenuItem from "./AccountMenuItem";

type Props = {
  onClose: () => void;
};

const AccountMenuDrawer: React.FC<Props> = ({ onClose }) => {
  const router = useRouter();
    const dispatch = useAppDispatch();

  const { signOut, isSigningOut } = useAuth();

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const logout = () => {
    AuthCookies?.clearAll();

    if (typeof window !== "undefined") {
      localStorage.removeItem("registrationEmail");
      localStorage.removeItem("otp_resend_until");
      localStorage.removeItem("Email");
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("phone_number");
    }

    dispatch(setError("You have been logged out successfully!"))
  };

  return (
    <div className="flex h-dvh w-full flex-col">
      <div className="flex h-14 items-center gap-3 border-b border-black/10 px-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className={cn("h-10 w-10 rounded-none p-0 hover:bg-black/5")}
          aria-label="Close account menu"
        >
          <FiArrowLeft className="h-6 w-6 text-black" />
        </Button>

        <h2 className="text-2xl font-extrabold text-black">My Account</h2>
      </div>

      <div className="flex-1 overflow-auto">
        <AccountMenuItem icon={FiUser} label="Account Details" onClick={() => go("/account")} />
        <AccountMenuItem icon={FiList} label="My Order" onClick={() => go("/account/orders")} />
        <AccountMenuItem
          icon={FiMapPin}
          label="Address Book"
          onClick={() => go("/account/address-book")}
        />
        <AccountMenuItem
          icon={FiHeart}
          label="Favorite List"
          onClick={() => go("/account/favorites")}
        />
        <AccountMenuItem
          icon={FiCreditCard}
          label="Payment Method"
          onClick={() => go("/account/payment-method")}
        />
        <AccountMenuItem
          icon={FiLock}
          label="Change Password"
          onClick={() => go("/account/change-password")}
        />
      </div>

      <div className="border-t border-black/10">
        <button
          type="button"
          disabled={isSigningOut}
          onClick={() => {
            logout();
            onClose();
            router.push("/sign-in");
          }}
          className={cn(
            "flex w-full cursor-pointer items-center gap-3 bg-white px-5 py-5",
            "active:bg-black/5",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          <FiLogOut className="h-6 w-6 text-black" />
          <span className="text-lg font-bold text-black">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AccountMenuDrawer;
