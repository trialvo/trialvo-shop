"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

type AuthShellProps = {
  children: React.ReactNode;
  className?: string;
};

const BANNER_TAGS = [
  { label: "Complimentary shipping", className: "left-[7%] top-[52%]" },
  { label: "Editor-picked styles", className: "left-[26%] top-[64%]" },
  { label: "Easy 30-day returns", className: "left-[9%] top-[76%]" },
] as const;

const GlassTag: React.FC<{ label: string; className?: string }> = ({ label, className }) => (
  <div
    className={cn(
      "absolute inline-flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5",
      "border border-white/50 bg-white/40 shadow-[0_8px_28px_rgba(0,0,0,0.08)]",
      "backdrop-blur-md backdrop-saturate-150",
      className,
    )}
  >
    <span className="h-4 w-[2px] shrink-0 rounded-full bg-primary" />
    <span className="whitespace-nowrap text-[13px] font-medium tracking-[-0.01em] text-[#191919]">
      {label}
    </span>
  </div>
);

const AuthShell: React.FC<AuthShellProps> = ({ children, className }) => {
  return (
    <div className={cn("flex min-h-screen flex-col bg-background", className)}>
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 py-6 min-[576px]:px-6 min-[768px]:flex-row min-[768px]:items-stretch min-[768px]:gap-8 min-[768px]:px-8 min-[768px]:py-8 min-[992px]:gap-12 min-[992px]:px-10 min-[1200px]:gap-16">
        <aside className="relative hidden min-h-[520px] overflow-hidden rounded-[28px] min-[768px]:block min-[768px]:min-h-[calc(100vh-4rem)] min-[768px]:w-[50%] min-[992px]:w-[54%] min-[1200px]:w-[56%]">
          <div
            className="absolute inset-0 bg-cover bg-[center_20%]"
            style={{ backgroundImage: "url(/images/categories/cat-men.jpg)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
          {BANNER_TAGS.map((tag) => (
            <GlassTag key={tag.label} label={tag.label} className={tag.className} />
          ))}
        </aside>

        <section className="flex flex-1 items-start justify-center py-8 min-[576px]:py-10 min-[768px]:items-center min-[768px]:py-6">
          <div className="w-full max-w-[400px]">{children}</div>
        </section>
      </div>
    </div>
  );
};

export default AuthShell;
