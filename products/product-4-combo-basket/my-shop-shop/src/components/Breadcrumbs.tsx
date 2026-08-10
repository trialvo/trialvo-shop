import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-gray-500 sm:text-sm">
        <li>
          <Link
            href="/"
            className="flex items-center gap-1 rounded-lg px-2 py-1 transition-all duration-200 hover:bg-pink-50 hover:text-[#e91e63]"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
        </li>
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-gray-300" />
            {item.href ? (
              <Link
                href={item.href}
                className="rounded-lg px-2 py-1 transition-all duration-200 hover:bg-pink-50 hover:text-[#e91e63]"
              >
                {item.label}
              </Link>
            ) : (
              <span className="rounded-lg bg-pink-50 px-2 py-1 font-medium text-[#e91e63]">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
