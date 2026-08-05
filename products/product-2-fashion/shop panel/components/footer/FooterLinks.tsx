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
      <h4 className="mb-7 text-base text-white font-semibold uppercase tracking-wide">
        {title}
      </h4>

      <ul className="space-y-5.5 text-sm text-white">
        {links.map((link) => (
          <li key={link.label}>
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
  );
};

export default FooterLinks;
