import React from "react";

type Props = {
  sidebar: React.ReactNode;
  children: React.ReactNode;
};

const AccountLayout: React.FC<Props> = ({ sidebar, children }) => {
  return (
    <div className="grid grid-cols-1 gap-4 min-[992px]:grid-cols-[220px_1fr] min-[992px]:gap-6">
      <div className="min-w-0">{sidebar}</div>
      <div className="account-panel-enter min-w-0">{children}</div>
    </div>
  );
};

export default AccountLayout;
