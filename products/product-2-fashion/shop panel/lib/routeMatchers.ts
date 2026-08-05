function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return p !== "/" ? p.replace(/\/+$/, "") : "/";
}

type RouteRule =
  | { type: "exact"; path: string }
  | { type: "prefix"; path: string }
  | { type: "regex"; pattern: RegExp };

const HIDE_BOTTOM_NAV_RULES: RouteRule[] = [
  { type: "regex", pattern: /^\/products\/[^/]+\/\d+$/ },

  { type: "prefix", path: "/account/profile-edit" },
  { type: "regex", pattern: /^\/account\/my-order\/\d+$/ },
  { type: "regex", pattern: /^\/account\/address\/\d+\/edit$/ },

  { type: "exact", path: "/checkout/success" },
  { type: "exact", path: "/checkout" },
];

export function isProductDetailsRoute(pathname: string): boolean {
  const p = normalizePath(pathname);
  return /^\/products\/[^/]+\/\d+$/.test(p);
}

export function shouldHideBottomNav(pathname: string): boolean {
  const p = normalizePath(pathname);

  return HIDE_BOTTOM_NAV_RULES.some((rule) => {
    if (rule.type === "exact") return p === normalizePath(rule.path);
    if (rule.type === "prefix") return p.startsWith(normalizePath(rule.path));
    return rule.pattern.test(p);
  });
}
