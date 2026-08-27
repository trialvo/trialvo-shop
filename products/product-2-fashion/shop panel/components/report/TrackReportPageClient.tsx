"use client";

import React from "react";
import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import TrackReportWidget from "./TrackReportWidget";
import { Search } from "lucide-react";

interface Props {
  initialToken: string;
}

const TrackReportPageClient: React.FC<Props> = ({ initialToken }) => {
  return (
    <section className="container mx-auto px-1.5 pb-6 pt-2 sm:px-0 sm:pt-0">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Support", href: "/contact-us" },
          { label: "Track Report" },
        ]}
      />

      <div className="sm:mb-17.5 space-y-3">
        <div className="border-0 bg-white px-4 py-2.5 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-black" />
            <h1 className="text-xl font-bold text-black">Track Your Report</h1>
          </div>
        </div>

        <TrackReportWidget initialToken={initialToken} />
      </div>
    </section>
  );
};

export default TrackReportPageClient;
