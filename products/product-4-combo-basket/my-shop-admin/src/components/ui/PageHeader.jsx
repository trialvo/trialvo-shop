/**
 * PageHeader — standard top-of-page title bar.
 *
 * Usage:
 *   <PageHeader
 *     title="পণ্য তালিকা"
 *     subtitle="মোট 42 টি পণ্য"
 *     action={<Link to="/products/new" className="btn-primary">নতুন পণ্য</Link>}
 *   />
 */
export default function PageHeader({ title, subtitle, action, backButton }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {backButton}
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
