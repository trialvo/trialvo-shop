import React from "react";

type Props = {
  sidebar: React.ReactNode;
  children: React.ReactNode;
};

const AccountLayout: React.FC<Props> = ({ sidebar, children }) => {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      <div className="block">{sidebar}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
};

export default AccountLayout;
