import type { ReactNode } from "react";

/**
 * Passthrough — do not wrap Header/Layout here.
 * Site chrome is provided by page-level Layout (same as /shop, /cart, …).
 */
export default function CheckoutLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
