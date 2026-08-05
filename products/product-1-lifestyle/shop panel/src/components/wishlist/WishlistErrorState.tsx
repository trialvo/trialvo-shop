"use client";

interface WishlistErrorStateProps {
  onRetry: () => void;
}

export function WishlistErrorState({ onRetry }: WishlistErrorStateProps) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm font-semibold text-foreground">Unable to load wishlist</p>
      <p className="text-xs text-muted-foreground mt-1">Please try again in a moment.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 px-5 py-2 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
