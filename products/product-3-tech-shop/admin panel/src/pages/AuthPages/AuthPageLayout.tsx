import React from "react";
import { Link } from "react-router-dom";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";
import BrandLogo from "../../components/common/BrandLogo";
import { useAppBranding } from "../../context/AppBrandingContext";

/**
 * Shared auth shell — no product brand art, works for every storefront vertical.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { branding } = useAppBranding();

  return (
    <div className="relative z-1 min-h-screen bg-gray-50 p-6 dark:bg-gray-950 sm:p-0">
      <div className="relative flex min-h-screen w-full flex-col justify-center lg:flex-row">
        {children}

        <div className="relative hidden w-full overflow-hidden lg:flex lg:w-1/2 lg:items-center lg:justify-center">
          {/* Neutral atmospheric panel — not a store brand color splash */}
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--color-brand-100)_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_var(--color-brand-200)_0%,_transparent_50%),linear-gradient(160deg,_#f8fafc_0%,_#eef2f7_100%)] dark:bg-[radial-gradient(ellipse_at_top_left,_rgba(61,90,138,0.25)_0%,_transparent_55%),linear-gradient(160deg,_#0b1220_0%,_#11192a_100%)]"
          />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.35] dark:opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(28,41,66,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(28,41,66,0.06) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative z-1 flex max-w-sm flex-col items-start px-10">
            <Link to="/" className="mb-8 block" aria-label={branding.appName}>
              <BrandLogo height={44} className="h-11" />
            </Link>

            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              One admin.
              <br />
              Every store.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {branding.authTagline}
            </p>
          </div>
        </div>

        <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
