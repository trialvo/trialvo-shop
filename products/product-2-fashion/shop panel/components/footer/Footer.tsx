import React from "react";
import FooterBottom from "./FooterBottom";
import FooterBrand from "./FooterBrand";
import FooterPolicyLinks from "./FooterPolicyLinks";
import FooterSubscribe from "./FooterSubscribe";
import { fetchPublicPolicies } from "@/lib/api/policy";

const Footer = async () => {
  const policies = await fetchPublicPolicies();

  return (
    <footer className="bg-[#1f1f1f] text-white max-[500px]:pb-15.25">
      <div className="container mx-auto px-4 pt-10 pb-3">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <FooterBrand />

          {/*
            FooterPolicyLinks is a "use client" component.
            It renders both the Company column (with t() translation)
            and the Legal & Policies column (with getLocalName for bd_title).
          */}
          <FooterPolicyLinks policies={policies} />

          <FooterSubscribe />
        </div>

        <FooterBottom />
      </div>
    </footer>
  );
};

export default Footer;
