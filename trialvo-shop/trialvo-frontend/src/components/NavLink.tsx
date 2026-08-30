"use client";

import LocalizedLink from "@/components/i18n/LocalizedLink";
import { usePathname } from "next/navigation";
import { forwardRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { parsePathname } from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";

interface NavLinkCompatProps extends Omit<ComponentProps<typeof LocalizedLink>, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, href, ...props }, ref) => {
    const pathname = usePathname() || "/";
    const { language } = useLanguage();
    const { path } = parsePathname(pathname);
    const hrefStr = typeof href === "string" ? href : href.pathname || "";
    const isActive =
      hrefStr === "/" || hrefStr === `/${language}`
        ? path === "/"
        : path.startsWith(hrefStr.replace(/^\/(bn|en)/, "") || hrefStr);

    return (
      <LocalizedLink
        ref={ref}
        href={href}
        className={cn(className, isActive && activeClassName)}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
