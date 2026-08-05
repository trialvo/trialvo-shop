import { Button } from "@/components/ui/button";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import React from "react";

type GoogleAuthButtonProps = {
  onClick?: () => void;
  label?: string;
  disabled?: boolean;
};

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onClick,
  label = "Sign-Up with Google",
  disabled,
}) => {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="h-9 w-full justify-center gap-3 rounded-none border-[#CBCBCB] text-sm font-medium"
    >
      <div className="relative h-7 w-7">
        <ImageWithFallback
          src="/g-auth.svg"
          alt="g auth button"
          fill
          className="object-cover w-full"
          preload
        />
      </div>

      <span>{label}</span>
    </Button>
  );
};

export default GoogleAuthButton;
