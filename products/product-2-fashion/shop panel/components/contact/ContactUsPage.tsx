"use client";

import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import Link from "next/link";
import React from "react";
import ContactFormCard from "./ContactFormCard";
import ContactInfoCard from "./ContactInfoCard";
import FindUsCard from "./FindUsCard";
import FollowUsCard from "./FollowUsCard";
import { CONTACT_INFO, CONTACT_MAP, CONTACT_SOCIALS } from "./contact.data";

const ContactUsPage: React.FC = () => {
  return (
    <section className="container mx-auto px-3 pb-16 pt-2 min-[768px]:px-0 min-[768px]:pb-20 min-[768px]:pt-0">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact Us" }]} />

      <div className="mt-1 min-[768px]:mt-2">
        <h1 className="text-[26px] font-bold leading-none tracking-[-0.02em] text-[#191919] min-[768px]:text-[32px]">
          Contact us
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5F5F5F]">
          Questions about an order, sizing, or delivery — send a message or reach
          us directly. We usually reply within a few hours.
        </p>
      </div>

      <div className="mt-6 space-y-6 min-[768px]:mt-8 min-[768px]:space-y-8">
        <div className="grid grid-cols-1 gap-6 min-[992px]:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] min-[992px]:gap-8">
          <ContactFormCard />
          <div className="flex min-w-0 flex-col gap-6">
            <ContactInfoCard info={CONTACT_INFO} />
            <FollowUsCard socials={CONTACT_SOCIALS} />
          </div>
        </div>

        <FindUsCard
          title={CONTACT_MAP.title}
          subtitle={CONTACT_MAP.subtitle}
          mapSrc={CONTACT_MAP.mapSrc}
        />

        <div className="rounded-2xl bg-[#F7F4EE] px-4 py-5 min-[768px]:flex min-[768px]:items-center min-[768px]:justify-between min-[768px]:gap-6 min-[768px]:px-6 min-[768px]:py-6">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold tracking-tight text-[#191919]">
              Looking for quick answers?
            </p>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-[#5F5F5F]">
              Payment, delivery, returns, and order questions are covered in our FAQs.
            </p>
          </div>
          <Link
            href="/faqs"
            className="mt-4 inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[#191919] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-black min-[768px]:mt-0"
          >
            Browse FAQs
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ContactUsPage;
