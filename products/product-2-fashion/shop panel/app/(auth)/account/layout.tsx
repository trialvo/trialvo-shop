import React from "react";

type Props = {
  children: React.ReactNode;
};

const AccountLayout: React.FC<Props> = ({ children }) => {
  return <>{children}</>;
};

export default AccountLayout;
