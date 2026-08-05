import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import React from "react";
import { FiShare2 } from "react-icons/fi";
import type { SocialLink } from "./contact.data";

type Props = {
  socials: SocialLink[];
};

const FollowUsCard: React.FC<Props> = ({ socials }) => {
  return (
    <Card className="rounded-none border-0 shadow-[0px_0px_12px_rgba(0,0,0,0.12)] p-0 gap-0">
      <CardHeader className="border-b border-[#F1F1F1] p-4">
        <div className="flex items-center gap-2 text-lg font-bold text-black">
          <FiShare2 className="h-6 w-6" />
          Follow Us
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="flex flex-wrap gap-3">
          {socials.map((s) => {
            const Icon = s.icon;
            return (
              <Button
                key={s.id}
                variant="outline"
                className="h-10 rounded-none border-[#CBCBCB] px-4 text-sm font-medium text-black"
                asChild
              >
                <Link href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="mr-2 inline-flex">
                    <Icon />
                  </span>
                  {s.label}
                </Link>
              </Button>
            );
          })}
        </div>

        <div className="mt-4 border border-[#75BFFF] bg-[#F3FAFF] px-3 py-2 text-xs text-black">
          <span className="font-medium">Join our community for exclusive offers!</span>{" "}
          <span className="text-[#0088FF]">Follow us</span> on social media for beauty tips, new arrivals, and special discounts.
        </div>
      </CardContent>
    </Card>
  );
};

export default FollowUsCard;
