import Layout from "@/components/layout/Layout";
import { AppButton } from '@/components/shared/AppButton';
import { Home, Search, ShoppingBag, Cpu } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <Layout>
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.08),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_hsl(var(--accent)/0.08),_transparent_50%)]"
          aria-hidden
        />
        <div className="container relative py-16 md:py-24">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-sm border border-border bg-card shadow-sm">
              <Cpu className="h-7 w-7 text-primary" aria-hidden />
            </div>

            <p className="font-heading text-6xl md:text-7xl font-bold tracking-tight text-primary">
              404
            </p>
            <h1 className="mt-3 font-heading text-xl md:text-2xl font-bold text-foreground">
              Page not found
            </h1>
            <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
              This page doesn&apos;t exist or the gadget you&apos;re looking for
              has moved. Try searching the shop or head back home.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <AppButton asChild className="font-semibold">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </AppButton>
              <AppButton asChild variant="outline" className="rounded-sm font-semibold">
                <Link href="/shop">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Browse Shop
                </Link>
              </AppButton>
            </div>

            <div className="mt-10 rounded-sm border border-border bg-card p-4 text-left shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" />
                Popular destinations
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <li>
                  <Link
                    href="/shop?badge=sale"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Hot deals
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop?badge=new"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    New arrivals
                  </Link>
                </li>
                <li>
                  <Link
                    href="/order-tracking"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Track order
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Contact support
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
