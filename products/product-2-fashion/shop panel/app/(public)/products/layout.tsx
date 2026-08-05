import React from "react";

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <section className="container mx-auto max-[501px]:pt-11.5 max-[501px]:px-2 pb-6">{children}</section>;
}
