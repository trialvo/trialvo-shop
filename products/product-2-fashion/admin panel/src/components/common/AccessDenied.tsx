import { Lock, ArrowLeft, ShieldOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Props = {
  /** Short title shown below the icon. Defaults to "Access Restricted" */
  title?: string;
  /** Longer explanation shown beneath the title. */
  description?: string;
  /** Extra hint line (e.g. who to contact). */
  hint?: string;
};

export default function AccessDenied({
  title = "Access Restricted",
  description = "You don't have permission to view this page.",
  hint = "Please contact a Super Admin if you believe this is a mistake.",
}: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/10 ring-8 ring-amber-50/60 dark:ring-amber-500/5">
          <Lock size={36} className="text-amber-500" />
        </div>

        {/* Badge */}
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
          <ShieldOff size={12} />
          403 — Forbidden
        </span>

        {/* Heading */}
        <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>

        {/* Description */}
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>

        {/* Hint */}
        {hint && (
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {hint}
          </p>
        )}

        {/* Divider */}
        <div className="my-6 h-px w-full bg-gray-100 dark:bg-gray-800" />

        {/* Action */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={15} />
          Go back
        </button>
      </div>
    </div>
  );
}
