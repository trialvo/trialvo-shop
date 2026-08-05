"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import { CiBadgeDollar } from "react-icons/ci";
import { FaTruckFast } from "react-icons/fa6";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import { LuRefreshCcw } from "react-icons/lu";
import ServiceItem from "./ServiceItem";

export type ServicesBarProps = {
  className?: string;
};

const ServicesBar: React.FC<ServicesBarProps> = ({ className }) => {
  const { t } = useTranslation();
  const [paused, setPaused] = React.useState(false);

  const items = React.useMemo(() => [
    {
      icon: <FaTruckFast className="h-8 w-8 text-amber-500" />,
      label: t("home.services.fastDelivery"),
    },
    {
      icon: <LuRefreshCcw className="h-8 w-8 text-green-500!" />,
      label: t("home.services.exchange"),
    },
    {
      icon: <CiBadgeDollar className="h-8 w-8 text-rose-500" />,
      label: t("home.services.bestPrice"),
    },
    {
      icon: <IoShieldCheckmarkOutline className="h-8 w-8 text-orange-500" />,
      label: t("home.services.afterSell"),
    },
  ], [t]);

  const marqueeItems = React.useMemo(() => [...items, ...items], [items]);

  return (
    <section className={cn("container mx-auto w-full bg-white", className)}>
      <div className="mx-auto w-full">
        <div className="sm:hidden">
          <div
            className={cn(
              "relative overflow-hidden bg-white",
              "border-y border-black",
              "py-3"
            )}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div
              className={cn("services-marquee flex w-max items-center gap-16 pr-16")}
              style={{ animationPlayState: paused ? "paused" : "running" }}
            >
              {marqueeItems.map((item, idx) => (
                <div
                  key={`${item.label}-${idx}`}
                  className={cn("whitespace-nowrap", "**:leading-none")}
                >
                  <ServiceItem icon={item.icon} label={item.label} />
                </div>
              ))}
            </div>

            <style jsx>{`
              .services-marquee {
                animation: servicesMarquee 16s linear infinite;
                will-change: transform;
              }
              @keyframes servicesMarquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
            `}</style>
          </div>
        </div>

        <div className="hidden sm:block">
          <div className="border border-[#E5E5E5] bg-[#FAFAFA] px-6 py-7">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
              {items.map((item, idx) => (
                <ServiceItem key={idx} icon={item.icon} label={item.label} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesBar;
