"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string | ((props: { isActive: boolean }) => string);
}

export default function NavLink({ href, children, className }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const cls = typeof className === "function" ? className({ isActive }) : className;
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
