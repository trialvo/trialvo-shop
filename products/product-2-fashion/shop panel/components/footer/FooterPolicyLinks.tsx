"use client";

import { useTranslation } from "@/hooks/useTranslation";
import type { PolicySummary } from "@/lib/api/policy";
import { getLocalName } from "@/lib/utils";
import Link from "next/link";
import React from "react";

type Props = {
  policies: PolicySummary[];
};

const headingClass =
  "mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/45";
const listClass = "space-y-3 text-sm";
const linkClass =
  "text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white";

const FooterNavLinks = ({ policies }: Props) => {
  const { language, t } = useTranslation();

  const companyLinks = [
    { label: t("footer.links.about"), href: "/about" },
    { label: t("footer.links.faqs"), href: "/faqs" },
    { label: t("footer.links.contactUs"), href: "/contact-us" },
    { label: t("footer.links.submitReport"), href: "/submit-report" },
    { label: t("footer.links.trackReport"), href: "/track-report" },
  ];

  return (
    <>
      <div>
        <h4 className={headingClass}>{t("footer.companyTitle")}</h4>
        <ul className={listClass}>
          {companyLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={linkClass}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {policies.length > 0 ? (
        <div>
          <h4 className={headingClass}>{t("footer.legalTitle")}</h4>
          <ul className={listClass}>
            {policies.map((p) => (
              <li key={p.policy_key}>
                <Link href={`/policy/${p.policy_key}`} className={linkClass}>
                  {getLocalName(p.title, p.bd_title, language)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
};

export default FooterNavLinks;
