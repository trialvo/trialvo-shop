import React from "react";

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="container mx-auto px-4 pb-24 pt-2 min-[768px]:pb-12 min-[768px]:pt-0">
      {children}
    </section>
  );
}
