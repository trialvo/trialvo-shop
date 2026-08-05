import React from "react";

type Props = {
  children: React.ReactNode;
};

const CheckoutLayout: React.FC<Props> = ({ children }) => {
  return <section className="container mx-auto sm:pb-6">{children}</section>;
};

export default CheckoutLayout;
