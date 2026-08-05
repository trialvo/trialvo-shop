"use client";

interface MegaSaleNoticeProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function MegaSaleNotice({
  title,
  description,
  actionLabel,
  onAction,
}: MegaSaleNoticeProps) {
  return (
    <div className="py-12 text-center bg-secondary">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
      {actionLabel && onAction ? (
        <button onClick={onAction} className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
