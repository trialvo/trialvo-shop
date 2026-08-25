"use client";

import React from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import AccountLayout from "@/components/account/AccountLayout";
import AccountSidebar from "@/components/account/AccountSidebar";
import MyReportsCard from "./MyReportsCard";
import { ExternalLink } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  highlightReportId?: number | null;
};

function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
        <Skeleton className="h-7 w-36 rounded-sm" />
        <Skeleton className="h-4 w-28 rounded-sm" />
      </div>

      <div className="overflow-hidden rounded-md border border-[#E5E5E5] bg-white">
        <div className="flex items-center justify-between border-b border-[#F0F0F0] px-4 py-3.5">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-40 rounded-sm" />
            <Skeleton className="h-3 w-52 rounded-sm" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-start gap-3 border-b border-[#E5E5E5] px-4 py-3.5 last:border-0"
          >
            <div className="mt-1.5 h-2 w-2 animate-pulse rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/4 rounded-sm" />
              <Skeleton className="h-3 w-1/2 rounded-sm" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-sm" />
                <Skeleton className="h-5 w-12 rounded-sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BreadcrumbSkeleton() {
  return (
    <div className="flex items-center gap-2 py-3">
      <Skeleton className="h-3.5 w-12 rounded-sm" />
      <Skeleton className="h-3.5 w-3 rounded-sm" />
      <Skeleton className="h-3.5 w-16 rounded-sm" />
      <Skeleton className="h-3.5 w-3 rounded-sm" />
      <Skeleton className="h-3.5 w-20 rounded-sm" />
    </div>
  );
}

const MyReportsPageClient: React.FC<Props> = ({ highlightReportId }) => {
  const { isLangReady } = useLanguage();

  return (
    <section className="container mx-auto px-3 pb-10 pt-11 min-[768px]:px-0 min-[768px]:pb-14 min-[768px]:pt-0">
      {isLangReady ? (
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Account", href: "/account" },
            { label: "My Reports" },
          ]}
        />
      ) : (
        <BreadcrumbSkeleton />
      )}

      <div className="mt-2 min-[768px]:mb-14">
        <AccountLayout sidebar={<AccountSidebar activeKey="my-reports" />}>
          {isLangReady ? (
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-3 border-b border-[#E5E5E5] pb-3">
                <h1 className="text-xl font-semibold tracking-tight text-black min-[768px]:text-[22px]">
                  My Reports
                </h1>
                <Link
                  href="/track-report"
                  className="mb-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-black/60 transition-colors duration-200 ease-out hover:text-black"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Track with token
                </Link>
              </div>

              <MyReportsCard
                highlightReportId={highlightReportId}
                hideTitle
              />
            </div>
          ) : (
            <ContentSkeleton />
          )}
        </AccountLayout>
      </div>
    </section>
  );
};

export default MyReportsPageClient;
