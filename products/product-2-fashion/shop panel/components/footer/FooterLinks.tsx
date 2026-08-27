import Link from "next/link";
import React from "react";
import { FooterLink } from "./types";

type Props = {
  title: string;
  links: FooterLink[];
};

const FooterLinks: React.FC<Props> = ({ title, links }) => {
  return (
    <div>
      <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
        {title}
      </h4>

      <ul className="space-y-3 text-sm">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FooterLinks;
