import type { ReactNode } from "react";
import React from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return <main className="min-h-screen bg-white">{children}</main>;
};

export default AuthLayout;
