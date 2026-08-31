import React from "react";
import { LiaMapMarkedAltSolid } from "react-icons/lia";

type Props = {
  title: string;
  subtitle: string;
  mapSrc: string;
};

const FindUsCard: React.FC<Props> = ({ title, subtitle, mapSrc }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
      <div className="border-b border-black/6 px-4 py-4 min-[768px]:px-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F3F1ED] text-[#191919]">
            <LiaMapMarkedAltSolid className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-[#191919] min-[768px]:text-base">
              {title}
            </h2>
            <p className="text-xs text-[#8A8A8A]">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="p-3 min-[768px]:p-4">
        <div className="overflow-hidden rounded-xl border border-black/6 bg-[#F7F4EE]">
          <iframe
            title="Store location map"
            src={mapSrc}
            className="h-[280px] w-full min-[768px]:h-[360px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
};

export default FindUsCard;
