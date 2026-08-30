"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { localePath, parsePathname } from "@/lib/i18n";

export default function Redirect({ href }: { href: string }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const { locale } = parsePathname(pathname);

  useEffect(() => {
    router.replace(localePath(locale, href));
  }, [href, locale, router]);

  return null;
}
