"use client";

/**
 * components/layout/PaymentIcons.tsx — SVG payment method icons
 *
 * Replaces text-based payment badges with recognizable brand icons.
 * Uses inline SVGs for zero external dependencies and optimal performance.
 */

interface PaymentIconProps {
  className?: string;
}

export function VisaIcon({ className = "h-5 w-auto" }: PaymentIconProps) {
  return (
    <svg viewBox="0 0 780 500" className={className} aria-label="Visa" role="img">
      <rect width="780" height="500" rx="40" fill="currentColor" opacity="0.15" />
      <path
        d="M293.2 348.7l33.4-195.8h53.4l-33.4 195.8H293.2zm222.6-191c-10.5-4-27.1-8.3-47.7-8.3-52.6 0-89.7 26.6-89.9 64.6-.3 28.1 26.4 43.8 46.5 53.2 20.7 9.6 27.6 15.7 27.5 24.3-.1 13.1-16.5 19.1-31.7 19.1-21.2 0-32.5-3-50-10.3l-6.8-3.1-7.4 43.7c12.4 5.5 35.3 10.2 59.1 10.5 55.9 0 92.2-26.3 92.5-66.9.2-22.3-14-39.3-44.7-53.3-18.6-9.1-30-15.1-29.9-24.3 0-8.1 9.6-16.8 30.4-16.8 17.4-.3 30 3.5 39.8 7.5l4.8 2.3 7.2-42.1h.1zm137.1-4.9h-41.1c-12.7 0-22.3 3.5-27.9 16.3l-79.1 179.6h55.9s9.1-24.1 11.2-29.4h68.3c1.6 6.9 6.5 29.4 6.5 29.4H700l-41.1-196h.1v.1zm-65.7 126.6c4.4-11.3 21.3-55 21.3-55-.3.5 4.4-11.4 7.1-18.8l3.6 17s10.2 47 12.4 56.8h-44.4zm-327.1-126.6L206.3 296l-5.5-27c-9.7-31.2-39.8-65.1-73.5-82.1l47.7 171.6h56.3l83.8-195.8h-56.3v.1z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M146.9 152.9H60.3l-.7 4.1c66.7 16.2 110.9 55.4 129.2 102.4l-18.7-89.6c-3.2-12.3-12.5-16.3-23.2-16.9z"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}

export function MastercardIcon({ className = "h-5 w-auto" }: PaymentIconProps) {
  return (
    <svg viewBox="0 0 780 500" className={className} aria-label="Mastercard" role="img">
      <rect width="780" height="500" rx="40" fill="currentColor" opacity="0.15" />
      <circle cx="310" cy="250" r="140" fill="currentColor" opacity="0.35" />
      <circle cx="470" cy="250" r="140" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

export function BkashIcon({ className = "h-5 w-auto" }: PaymentIconProps) {
  return (
    <svg viewBox="0 0 780 500" className={className} aria-label="bKash" role="img">
      <rect width="780" height="500" rx="40" fill="currentColor" opacity="0.15" />
      <g transform="translate(250, 130)" fill="currentColor" opacity="0.6">
        <path d="M140 0C62.7 0 0 62.7 0 140s62.7 140 140 140 140-62.7 140-140S217.3 0 140 0zm0 240c-55.2 0-100-44.8-100-100S84.8 40 140 40s100 44.8 100 100-44.8 100-100 100z" />
        <text x="140" y="155" fontSize="72" fontWeight="bold" textAnchor="middle" fill="currentColor" opacity="0.7">b</text>
      </g>
    </svg>
  );
}

export function NagadIcon({ className = "h-5 w-auto" }: PaymentIconProps) {
  return (
    <svg viewBox="0 0 780 500" className={className} aria-label="Nagad" role="img">
      <rect width="780" height="500" rx="40" fill="currentColor" opacity="0.15" />
      <g transform="translate(200, 130)" fill="currentColor" opacity="0.6">
        <path d="M190 0H0v240h190c66.3 0 120-53.7 120-120S256.3 0 190 0zm0 200H40V40h150c44.2 0 80 35.8 80 80s-35.8 80-80 80z" />
        <text x="190" y="155" fontSize="72" fontWeight="bold" textAnchor="middle" fill="currentColor" opacity="0.7">N</text>
      </g>
    </svg>
  );
}

export function CodIcon({ className = "h-5 w-auto" }: PaymentIconProps) {
  return (
    <svg viewBox="0 0 780 500" className={className} aria-label="Cash on Delivery" role="img">
      <rect width="780" height="500" rx="40" fill="currentColor" opacity="0.15" />
      <text x="390" y="270" fontSize="100" fontWeight="bold" textAnchor="middle" fill="currentColor" opacity="0.5">COD</text>
    </svg>
  );
}

/** Map of payment method name to icon component */
export const PAYMENT_ICON_MAP: Record<string, React.FC<PaymentIconProps>> = {
  visa: VisaIcon,
  mastercard: MastercardIcon,
  bkash: BkashIcon,
  nagad: NagadIcon,
  cod: CodIcon,
};

export function PaymentMethodIcon({
  method,
  className,
}: {
  method: string;
  className?: string;
}) {
  const Icon = PAYMENT_ICON_MAP[method.toLowerCase()];
  if (!Icon) {
    // Fallback to text badge
    return (
      <span className="text-[10px] tracking-wider uppercase text-primary-foreground/30 border border-primary-foreground/15 px-2.5 py-1 rounded">
        {method}
      </span>
    );
  }
  return (
    <div className="border border-primary-foreground/15 px-2 py-1 rounded flex items-center justify-center">
      <Icon className={className ?? "h-4 w-auto text-primary-foreground/50"} />
    </div>
  );
}
