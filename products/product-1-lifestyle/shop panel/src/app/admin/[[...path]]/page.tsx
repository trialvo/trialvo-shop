import { redirect } from "next/navigation";

/**
 * Option 1 / trial: shop and admin are separate apps.
 * /admin on the storefront redirects to the admin portal (ADMIN_URL).
 */
function resolveAdminUrl(pathSuffix = ""): string {
  const base = (
    process.env.ADMIN_URL ||
    process.env.NEXT_PUBLIC_ADMIN_URL ||
    "http://localhost:5174"
  )
    .trim()
    .replace(/\/+$/, "");

  if (!pathSuffix) return base;
  const suffix = pathSuffix.startsWith("/") ? pathSuffix : `/${pathSuffix}`;
  return `${base}${suffix}`;
}

type PageProps = {
  params: Promise<{ path?: string[] }>;
};

export default async function AdminPortalRedirect({ params }: PageProps) {
  const { path } = await params;
  const suffix = path?.length ? path.join("/") : "";
  redirect(resolveAdminUrl(suffix));
}
