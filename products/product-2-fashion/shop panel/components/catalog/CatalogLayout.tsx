import React from "react";

export type CatalogLayoutProps = {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
};

const CatalogLayout: React.FC<CatalogLayoutProps> = ({ sidebar, header, children }) => {
  return (
    <div className="flex gap-6 lg:gap-10">
      <aside className="sticky top-[calc(var(--shop-header-offset,72px)+12px)] hidden w-64 shrink-0 self-start transition-[top] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block xl:w-72">
        {sidebar}
      </aside>
      <div className="min-w-0 flex-1">
        {header}
        {children}
      </div>
    </div>
  );
};

export default CatalogLayout;
