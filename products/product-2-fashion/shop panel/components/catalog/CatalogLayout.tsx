import React from "react";

export type CatalogLayoutProps = {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
};

const CatalogLayout: React.FC<CatalogLayoutProps> = ({ sidebar, header, children }) => {
  return (
    <div className="sm:mt-4 flex gap-8">
      <aside className="hidden w-72 shrink-0 lg:block">{sidebar}</aside>
      <div className="min-w-0 flex-1">
        {header}
        {children}
      </div>
    </div>
  );
};

export default CatalogLayout;
