import type { GigCardMediaProps } from "@/types/gigCard";

/**
 * Fiverr-like gig thumbnail.
 * Reference ratio ~1280×769 (native Fiverr gig image).
 */
export function GigCardMedia({
  imageSrc,
  imageAlt,
  showTrialBadge = false,
  trialLabel,
}: Readonly<GigCardMediaProps>) {
  return (
    <div className="relative aspect-[1280/769] overflow-hidden bg-muted">
      <img
        src={imageSrc}
        alt={imageAlt}
        className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        loading="lazy"
        itemProp="image"
      />
      {showTrialBadge ? (
        <span className="absolute left-2 top-2 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide text-accent-foreground">
          {trialLabel}
        </span>
      ) : null}
    </div>
  );
}

export default GigCardMedia;
