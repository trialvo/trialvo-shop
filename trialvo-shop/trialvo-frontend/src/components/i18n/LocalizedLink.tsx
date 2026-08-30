"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { localePath } from "@/lib/i18n";

type LocalizedLinkProps = ComponentProps<typeof Link>;

export default function LocalizedLink({ href, ...props }: LocalizedLinkProps) {
  const { language } = useLanguage();
  const nextHref = typeof href === "string" ? localePath(language, href) : href;
  return <Link href={nextHref} {...props} />;
}
