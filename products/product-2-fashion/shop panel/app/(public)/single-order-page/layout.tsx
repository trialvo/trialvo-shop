import React from "react";

/**
 * Layout for /single-order-page/* routes.
 * Hides the default shop header, footer, and bottom nav
 * so the single-order-page renders as a standalone experience.
 * Our custom headers use data-sop="true" to be exempted.
 */
export default function SingleOrderPageLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div id="single-order-page-root">
      <style dangerouslySetInnerHTML={{ __html: `
        #single-order-page-root { position: relative; z-index: 999; }
        /* Hide the default shop layout elements — exempt our data-sop headers */
        header:not([data-sop]) { display: none !important; }
        [data-mobile-header-chrome] { display: none !important; }
        footer:not([data-sop]) { display: none !important; }
        nav:not([data-sop]) { display: none !important; }
        [class*="min-[500px]:block"][class*="sticky"]:not([data-sop]) { display: none !important; }
        [class*="min-[500px]:hidden"]:not([data-sop]) { display: none !important; }
        main:not([data-sop]) { padding: 0 !important; margin: 0 !important; }
      `}} />
      {children}
    </div>
  );
}
