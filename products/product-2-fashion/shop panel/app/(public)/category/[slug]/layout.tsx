import React from "react";

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="container mx-auto pb-6 max-[501px]:pt-11.5 max-[501px]:px-2">
      {children}
    </section>
  );
}
