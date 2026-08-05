import React from "react";
import { FiInfo } from "react-icons/fi";

const DeliveryInfo: React.FC = () => {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border border-[#75BFFF] bg-[#F3FAFF] px-3 py-2 text-[10px] font-normal">
      <span className="font-medium">Selected:</span>
      <span>Office Pickup</span>
      <span className="h-1 w-1 rounded-full bg-black">•</span>
      <span className="font-medium">Charge:</span>
      <span>
        Free
      </span>
      <span className="h-1 w-1 rounded-full bg-black"></span>
      <span className="font-medium">Time:</span>
      <span>
        Same day
      </span>
      <span className="flex items-center gap-1">
        <FiInfo className="h-4 w-4" />
        Free delivery above ৳10,000.00
      </span>
    </div>
  );
};

export default DeliveryInfo;
