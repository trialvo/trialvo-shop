import React from "react";
import { FiPhone } from "react-icons/fi";
import type { ContactInfoItem } from "./contact.data";

type Props = {
  info: ContactInfoItem[];
};

const ContactInfoCard: React.FC<Props> = ({ info }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
      <div className="border-b border-black/6 px-4 py-4 min-[768px]:px-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F3F1ED] text-[#191919]">
            <FiPhone className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-[#191919] min-[768px]:text-base">
              Contact information
            </h2>
            <p className="text-xs text-[#8A8A8A]">Reach us anytime</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-black/6">
        {info.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="flex gap-3.5 px-4 py-4 min-[768px]:px-5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#191919] text-white">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>

              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold tracking-tight text-[#191919]">
                  {item.title}
                </p>
                {item.lines.map((line, idx) => (
                  <p
                    key={`${item.id}-${idx}`}
                    className="text-sm leading-relaxed text-[#5F5F5F]"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContactInfoCard;
