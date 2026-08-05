import { Card, CardContent, CardHeader } from "@/components/ui/card";
import React from "react";
import { LiaMapMarkedAltSolid } from "react-icons/lia";

type Props = {
  title: string;
  subtitle: string;
  mapSrc: string;
};

const FindUsCard: React.FC<Props> = ({ title, subtitle, mapSrc }) => {
  return (
    <Card className="rounded-none border-0 shadow-[0px_0px_12px_rgba(0,0,0,0.12)] p-0 gap-0">
      <CardHeader className="pt-4">
        <div className="flex items-center gap-2 text-lg font-bold text-black">
          <LiaMapMarkedAltSolid className="h-6 w-6" />
          {title}
        </div>
      </CardHeader>

      <CardContent className="pb-5 pt-1">
        <p className="mb-3 text-sm text-[#3A3A3A]">{subtitle}</p>

        <div className="overflow-hidden border border-[#F1F1F1] bg-white">
          <iframe
            title="Store location map"
            src={mapSrc}
            className="h-82.5 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default FindUsCard;
