"use client";

import { Heart, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  children?: ReactNode;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref = "/",
  children,
}: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      <Icon size={48} className="mx-auto text-muted-foreground/30 mb-4" />
      <h2 className="font-display text-xl text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      {actionLabel && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 text-xs tracking-[0.2em] uppercase hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {actionLabel} <ArrowRight size={14} />
        </Link>
      )}
      {children}
    </div>
  );
}
