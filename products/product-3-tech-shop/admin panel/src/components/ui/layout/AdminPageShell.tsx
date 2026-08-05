import type { ReactNode } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageHeader from "@/components/ui/layout/PageHeader";
import { cn } from "@/lib/utils";

export type AdminPageShellProps = {
  /** Page title segment (app name appended automatically by PageMeta). */
  title: string;
  description?: string;
  /** Breadcrumb / header title shown in the page body */
  pageTitle?: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  /** Hide breadcrumb when a custom header is enough */
  showBreadcrumb?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Standardized admin page chrome for every vertical (fashion / tech / lifestyle).
 * Composition only — does not change page business logic.
 */
export function AdminPageShell({
  title,
  description,
  pageTitle,
  subtitle,
  badge,
  actions,
  showBreadcrumb = true,
  className,
  children,
}: Readonly<AdminPageShellProps>) {
  const heading = pageTitle ?? title;

  return (
    <div className={cn("space-y-5", className)}>
      <PageMeta title={title} description={description} />
      {showBreadcrumb ? <PageBreadcrumb pageTitle={heading} /> : null}
      {(subtitle || badge || actions) && !showBreadcrumb ? (
        <PageHeader
          title={heading}
          subtitle={subtitle}
          badge={badge}
          actions={actions}
        />
      ) : null}
      {children}
    </div>
  );
}

export default AdminPageShell;
