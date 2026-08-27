import { cn } from "@/lib/utils";

export type BrandLogoSize = "sm" | "md" | "lg";
export type BrandLogoTone = "default" | "onDark" | "onLight";

export type BrandLogoProps = {
  /** Show wordmark beside the mark */
  withWordmark?: boolean;
  wordmark?: string;
  size?: BrandLogoSize;
  tone?: BrandLogoTone;
  className?: string;
  markClassName?: string;
};

const SIZE_PX: Record<BrandLogoSize, number> = {
  sm: 28,
  md: 36,
  lg: 44,
};

const WORDMARK_CLASS: Record<BrandLogoSize, string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-xl",
};

/**
 * Trialvo Shop brand mark.
 * Geometric storefront + rising bar chart (commerce growth) in marketplace green.
 */
export function BrandLogo({
  withWordmark = false,
  wordmark = "Trialvo Shop",
  size = "md",
  tone = "default",
  className,
  markClassName,
}: Readonly<BrandLogoProps>) {
  const px = SIZE_PX[size];
  const wordmarkColor =
    tone === "onDark"
      ? "text-white"
      : tone === "onLight"
        ? "text-zinc-900"
        : "text-foreground";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("shrink-0", markClassName)}
        aria-hidden={withWordmark ? true : undefined}
        role={withWordmark ? undefined : "img"}
        aria-label={withWordmark ? undefined : wordmark}
      >
        <title>{wordmark}</title>
        {/* Soft tile */}
        <rect width="40" height="40" rx="10" className="fill-accent" />
        {/* Storefront roof */}
        <path
          d="M8 16.5L20 9l12 7.5V18H8v-1.5Z"
          fill="white"
          fillOpacity="0.95"
        />
        {/* Store body */}
        <rect
          x="10"
          y="18"
          width="20"
          height="13"
          rx="2"
          fill="white"
          fillOpacity="0.95"
        />
        {/* Door */}
        <rect x="17.5" y="22" width="5" height="9" rx="1" className="fill-accent" />
        {/* Growth bars — marketplace / digital goods signal */}
        <rect x="12" y="24.5" width="2.2" height="4" rx="0.6" className="fill-accent" fillOpacity="0.55" />
        <rect x="25.5" y="23" width="2.2" height="5.5" rx="0.6" className="fill-accent" fillOpacity="0.7" />
        {/* Accent spark */}
        <circle cx="31.5" cy="11.5" r="2.2" fill="white" fillOpacity="0.9" />
      </svg>

      {withWordmark ? (
        <span
          className={cn(
            "font-display font-bold tracking-tight",
            WORDMARK_CLASS[size],
            wordmarkColor,
          )}
        >
          {wordmark}
        </span>
      ) : null}
    </span>
  );
}

export default BrandLogo;
