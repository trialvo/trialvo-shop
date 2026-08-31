import Link from "next/link";
import React from "react";
import { FiShare2 } from "react-icons/fi";
import type { SocialLink } from "./contact.data";
import { cn } from "@/lib/utils";

type Props = {
  socials: SocialLink[];
};

const FollowUsCard: React.FC<Props> = ({ socials }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
      <div className="border-b border-black/6 px-4 py-4 min-[768px]:px-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F3F1ED] text-[#191919]">
            <FiShare2 className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-[#191919] min-[768px]:text-base">
              Follow us
            </h2>
            <p className="text-xs text-[#8A8A8A]">New arrivals & offers</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 min-[768px]:px-5 min-[768px]:py-5">
        <div className="grid grid-cols-2 gap-2.5">
          {socials.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.id}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-black/8 bg-[#FAF8F5]",
                  "text-[13px] font-semibold text-[#191919] transition-colors hover:border-black/15 hover:bg-[#F3F1ED]",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </Link>
            );
          })}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-[#8A8A8A]">
          Follow for new drops, styling ideas, and member-only discounts.
        </p>
      </div>
    </div>
  );
};

export default FollowUsCard;
