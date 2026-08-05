import type { GigCardSellerProps } from "@/types/gigCard";

/** Compact seller row — avatar + name on one baseline */
export function GigCardSeller({
  name,
  avatarLetter,
}: Readonly<GigCardSellerProps>) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-bold text-accent"
        aria-hidden="true"
      >
        {avatarLetter}
      </span>
      <p className="truncate text-[13px] font-semibold leading-none text-foreground">
        {name}
      </p>
    </div>
  );
}

export default GigCardSeller;
