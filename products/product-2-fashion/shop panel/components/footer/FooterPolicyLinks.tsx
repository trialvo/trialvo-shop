"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { getLocalName } from "@/lib/utils";
import type { PolicySummary } from "@/lib/api/policy";

type Props = {
  policies: PolicySummary[];
};

const FooterNavLinks = ({ policies }: Props) => {
  const { language, t } = useTranslation();

  const companyLinks = [
    { label: t("footer.links.about"),       href: "/about"         },
    { label: t("footer.links.faqs"),         href: "/faqs"          },
    { label: t("footer.links.contactUs"),    href: "/contact-us"    },
    { label: t("footer.links.submitReport"), href: "/submit-report" },
    { label: t("footer.links.trackReport"),  href: "/track-report"  },
  ];

  return (
    <>
      {/* Company column */}
      <div>
        <h4 className="mb-7 text-base text-white font-semibold uppercase tracking-wide">
          {t("footer.companyTitle")}
        </h4>
        <ul className="space-y-5.5 text-sm text-white">
          {companyLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="font-normal hover:underline hover:underline-offset-4 transition"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Legal & Policies column — only shows if policies exist */}
      {policies.length > 0 && (
        <div>
          <h4 className="mb-7 text-base text-white font-semibold uppercase tracking-wide">
            {t("footer.legalTitle")}
          </h4>
          <ul className="space-y-5.5 text-sm text-white">
            {policies.map((p) => (
              <li key={p.policy_key}>
                <Link
                  href={`/policy/${p.policy_key}`}
                  className="font-normal hover:underline hover:underline-offset-4 transition"
                >
                  {/* getLocalName: shows bd_title if language=bn and bd_title exists, else English title */}
                  {getLocalName(p.title, p.bd_title, language)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default FooterNavLinks;
