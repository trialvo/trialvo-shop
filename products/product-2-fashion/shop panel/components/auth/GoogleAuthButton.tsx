import { Button } from "@/components/ui/button";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import React from "react";

type GoogleAuthButtonProps = {
  onClick?: () => void;
  label?: string;
  disabled?: boolean;
  variant?: "full" | "icon";
};

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onClick,
  label = "Sign-Up with Google",
  disabled,
  variant = "full",
}) => {
  const isIcon = variant === "icon";

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={
        isIcon
          ? "h-12 w-12 justify-center rounded-[8px] border-border bg-background p-0 shadow-none hover:bg-muted"
          : "h-11 w-full justify-center gap-3 rounded-[8px] border-border bg-background text-[14px] font-medium text-foreground shadow-none hover:bg-muted"
      }
    >
      <div className="relative h-5 w-5">
        <ImageWithFallback
          src="/g-auth.svg"
          alt="g auth button"
          fill
          className="object-contain"
          preload
        />
      </div>

      {isIcon ? null : <span>{label}</span>}
    </Button>
  );
};

export default GoogleAuthButton;
