"use client";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import React from "react";

type MegaSaleBannerProps = {
  loading: boolean;
  bannerImage: string | null;
  bannerHref: string;
  bannerTitle?: string | null;
  countdown?: React.ReactNode;
};

const BannerContent: React.FC<{ title?: string | null; countdown?: React.ReactNode }> = ({
  title,
  countdown,
}) => {
  const resolvedTitle = typeof title === "string" && title.trim().length > 0 ? title.trim() : "Featured Deals";

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-[28rem] bg-black/35 px-3 py-3 backdrop-blur-[1px] sm:px-4 sm:py-4">
        <p className="inline-flex h-8 items-center border border-white/65 bg-black/55 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-[1px]">
          Mega Sale
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">{resolvedTitle}</h1>
      </div>

      {countdown ? <div className="w-full sm:max-w-[356px]">{countdown}</div> : <div />}
    </div>
  );
};

const BannerFx: React.FC<{ rich?: boolean }> = ({ rich = false }) => {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-black/46" />
      <div className="pointer-events-none absolute inset-0 [background:linear-gradient(108deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.03)_36%,rgba(255,255,255,0)_68%)]" />
      <div className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 bg-white/15 blur-2xl animate-[megasale-sweep_9s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute left-8 top-8 h-14 w-14 border border-white/24 animate-[megasale-float_7s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute right-10 top-10 h-12 w-12 border border-white/20 animate-[megasale-float_8s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute right-12 bottom-10 h-[1px] w-32 bg-white/25 animate-[megasale-drift_7s_ease-in-out_infinite]" />
      {rich ? (
        <>
          <div className="pointer-events-none absolute left-24 top-24 h-12 w-12 border border-white/18 animate-[megasale-float_7s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute right-24 top-16 h-[1px] w-32 bg-white/26 animate-[megasale-drift_8s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute left-8 bottom-8 h-[1px] w-24 bg-white/24 animate-[megasale-drift_9s_ease-in-out_infinite]" />
        </>
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-white/30 animate-[megasale-line_5s_linear_infinite]" />
    </>
  );
};

const MegaSaleBanner: React.FC<MegaSaleBannerProps> = ({
  loading,
  bannerImage,
  bannerHref,
  bannerTitle,
  countdown,
}) => {
  if (loading) {
    return (
      <div className="mt-4 overflow-hidden border border-[#E5E5E5] bg-white">
        <Skeleton className="h-56 w-full rounded-none sm:h-72" />
      </div>
    );
  }

  if (bannerImage) {
    return (
      <div className="mt-4 overflow-hidden border border-[#E5E5E5] bg-white shadow-[0_6px_18px_rgba(17,17,17,0.06)]">
        <Link href={bannerHref} className="group block">
          <div className="relative h-56 w-full overflow-hidden bg-[#111111] sm:h-72">
            <ImageWithFallback
              src={bannerImage}
              alt={bannerTitle || "Mega Sale Campaign"}
              fill
              className="object-cover scale-[1.01] transition-transform duration-[1400ms] group-hover:scale-[1.04]"
            />
            <BannerFx />
            <BannerContent title={bannerTitle} countdown={countdown} />
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-hidden border border-[#E5E5E5] bg-white shadow-[0_6px_18px_rgba(17,17,17,0.06)]">
      <div className="relative h-56 overflow-hidden bg-[#111111] sm:h-72">
        <BannerFx rich />
        <BannerContent title={bannerTitle} countdown={countdown} />
      </div>
    </div>
  );
};

export default MegaSaleBanner;
