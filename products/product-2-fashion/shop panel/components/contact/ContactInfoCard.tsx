import { Card, CardContent, CardHeader } from "@/components/ui/card";
import React from "react";
import { FiMail } from "react-icons/fi";
import type { ContactInfoItem } from "./contact.data";

type Props = {
  info: ContactInfoItem[];
};

const ContactInfoCard: React.FC<Props> = ({ info }) => {
  return (
    <Card className="rounded-none border-0 shadow-[0px_0px_12px_rgba(0,0,0,0.12)] p-0 gap-0">
      <CardHeader className="px-4! pt-4!">
        <div className="flex items-center gap-2 text-lg font-bold text-black">
          <FiMail className="h-6 w-6" />
          <span>
            Contact Information
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-0">
        <div className="divide-y divide-[#F1F1F1]">
          {info.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex gap-4 p-4">
                <div className="flex h-8 w-8 items-center justify-center bg-black text-white">
                  <Icon className="h-4 w-4" />
                </div>

                <div className="space-y-1">
                  <p className="text-base font-semibold text-black">{item.title}</p>
                  {item.lines.map((line, idx) => (
                    <p key={`${item.id}-${idx}`} className="text-sm text-[#3A3A3A]">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactInfoCard;
