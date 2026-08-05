"use client";

export function HotDealsSkeleton() {
  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="h-1 w-full gradient-accent rounded-t-sm" />
        <div className="hot-deals-stage hot-deals-glow rounded-b-sm overflow-hidden min-h-[520px] animate-pulse border border-primary/20 border-t-0">
          <div className="h-16 border-b border-primary-foreground/10 bg-foreground/20" />
          <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 h-[420px] rounded-sm bg-primary-foreground/5" />
            <div className="lg:col-span-4 flex flex-col gap-3">
              <div className="h-24 rounded-sm bg-primary-foreground/5" />
              <div className="h-24 rounded-sm bg-primary-foreground/5" />
              <div className="h-24 rounded-sm bg-primary-foreground/5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
