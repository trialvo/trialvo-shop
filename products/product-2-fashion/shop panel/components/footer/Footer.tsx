import { fetchPublicPolicies } from "@/lib/api/policy";
import React from "react";
import FooterBottom from "./FooterBottom";
import FooterBrand from "./FooterBrand";
import FooterPolicyLinks from "./FooterPolicyLinks";
import FooterSubscribe from "./FooterSubscribe";

const Footer = async () => {
  const policies = await fetchPublicPolicies();

  return (
    <footer className="mt-auto bg-[#191919] text-white max-[500px]:pb-15.25">
      <div className="container mx-auto px-4 pt-12 pb-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <FooterBrand />
          <FooterPolicyLinks policies={policies} />
          <FooterSubscribe />
        </div>
      </div>
      <FooterBottom />
    </footer>
  );
};

export default Footer;
