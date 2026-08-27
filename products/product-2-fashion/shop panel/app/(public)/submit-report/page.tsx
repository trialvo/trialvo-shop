import SubmitReportForm from "@/components/report/SubmitReportForm";
import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

const title = "Submit a Report | Vellora";
const description =
  "Submit a formal report or support request to Vellora. Describe your issue and receive a tracking token to monitor your report status.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/submit-report",
  ogTitle: title,
  ogDescription: description,
  ogImage: "/og-contact.jpg",
});

const Page: React.FC = () => {
  return (
    <section className="container mx-auto px-1.5 pb-6 pt-2 sm:px-0 sm:pt-0">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Contact", href: "/contact-us" },
          { label: "Submit a Report" },
        ]}
      />

      <div className="sm:mb-17.5">
        <SubmitReportForm />
      </div>
    </section>
  );
};

export default Page;
