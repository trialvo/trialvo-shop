import React from "react";

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <section className="container mx-auto pb-6 max-[500px]:px-2 max-[500px]:pt-2">{children}</section>;
}
