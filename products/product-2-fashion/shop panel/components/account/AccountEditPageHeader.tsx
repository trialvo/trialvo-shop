"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import { FiArrowLeft } from "react-icons/fi";

type Props = {
  title: string;
  description?: string;
  backHref?: string;
  /** Prefer this for edit flows so return path stays consistent (no Link remount jump). */
  onBack?: () => void;
  backLabel: string;
  eyebrow?: string;
  className?: string;
};

const backClassName =
  "inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-[13px] font-semibold text-[#191919] shadow-[0_1px_3px_rgba(20,16,12,0.06)] transition-colors hover:border-black/18 hover:bg-[#FAF8F5]";

const AccountEditPageHeader: React.FC<Props> = ({
  title,
  description,
  backHref,
  onBack,
  backLabel,
  eyebrow,
  className,
}) => {
  const backInner = (
    <>
      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#F3F1ED]">
        <FiArrowLeft className="h-3.5 w-3.5 shrink-0" />
      </span>
      {backLabel}
    </>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {onBack ? (
        <button type="button" onClick={onBack} className={backClassName}>
          {backInner}
        </button>
      ) : (
        <Link href={backHref || "/account"} className={backClassName}>
          {backInner}
        </Link>
      )}

      <div>
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A8A8A]">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={cn(
            "text-[26px] font-bold leading-none tracking-[-0.02em] text-[#191919] min-[768px]:text-[28px]",
            eyebrow ? "mt-1.5" : "",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5F5F5F]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default AccountEditPageHeader;
