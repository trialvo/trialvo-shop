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

const iconClass = "h-6 w-6";

const ServicesBar: React.FC<ServicesBarProps> = ({ className }) => {
  const { t } = useTranslation();
  const [paused, setPaused] = React.useState(false);

  const items = React.useMemo(() => [
    {
      icon: <FaTruckFast className={iconClass} />,
      label: t("home.services.fastDelivery"),
    },
    {
      icon: <LuRefreshCcw className={iconClass} />,
      label: t("home.services.exchange"),
    },
    {
      icon: <CiBadgeDollar className={iconClass} />,
      label: t("home.services.bestPrice"),
    },
    {
      icon: <IoShieldCheckmarkOutline className={iconClass} />,
      label: t("home.services.afterSell"),
    },
  ], [t]);

  const marqueeItems = React.useMemo(() => [...items, ...items], [items]);

  return (
    <section className={cn("w-full bg-background", className)}>
      <div className="sm:hidden">
        <div
          className="relative overflow-hidden border-y border-black/[0.08] bg-background py-3.5"
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

      <div className="hidden border-y border-black/[0.08] sm:block">
        <div className="container mx-auto px-6 py-7 min-[992px]:px-8 min-[992px]:py-8 min-[1200px]:px-10">
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4 lg:gap-10">
            {items.map((item, idx) => (
              <ServiceItem
                key={idx}
                icon={item.icon}
                label={item.label}
                layout="stack"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesBar;
