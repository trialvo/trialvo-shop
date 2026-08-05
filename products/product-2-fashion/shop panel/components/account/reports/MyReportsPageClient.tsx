"use client";

import React from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import AccountLayout from "@/components/account/AccountLayout";
import AccountSidebar from "@/components/account/AccountSidebar";
import MyReportsCard from "./MyReportsCard";
import { ExternalLink, FileText } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  highlightReportId?: number | null;
};

function ContentSkeleton() {
  return (
    <div className="space-y-3">
      {/* Header skeleton */}
      <div className="border-0 bg-white px-4 py-2.5 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-28 rounded" />
          </div>
          <Skeleton className="h-4 w-28 rounded" />
        </div>
      </div>

      {/* Card skeleton */}
      <div className="bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between border-b border-black/[0.04] px-5 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-3 w-52 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3 border-b border-black/[0.04] px-5 py-4 last:border-0 animate-pulse">
            <div className="mt-1.5 h-2 w-2 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-5 w-12 rounded" />
              </div>
            </div>
            <Skeleton className="mt-1 h-4 w-4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BreadcrumbSkeleton() {
  return (
    <div className="flex items-center gap-2 py-3">
      <Skeleton className="h-3.5 w-12 rounded" />
      <Skeleton className="h-3.5 w-3 rounded" />
      <Skeleton className="h-3.5 w-16 rounded" />
      <Skeleton className="h-3.5 w-3 rounded" />
      <Skeleton className="h-3.5 w-20 rounded" />
    </div>
  );
}

const MyReportsPageClient: React.FC<Props> = ({ highlightReportId }) => {
  const { isLangReady } = useLanguage();

  return (
    <section className="container mx-auto pt-11 px-1.5 pb-6 sm:pt-0 sm:px-0">
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

      <div className="sm:mb-17.5">
        <AccountLayout sidebar={<AccountSidebar activeKey="my-reports" />}>
          {isLangReady ? (
            <div className="space-y-3">
              <div className="border-0 bg-white px-4 py-2.5 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-black" />
                    <h1 className="text-xl font-bold text-black">My Reports</h1>
                  </div>
                  <Link
                    href="/track-report"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-black transition-opacity hover:opacity-60"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Track with token
                  </Link>
                </div>
              </div>

              <MyReportsCard highlightReportId={highlightReportId} />
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
