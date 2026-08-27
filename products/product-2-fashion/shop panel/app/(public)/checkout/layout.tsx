import React from "react";

type Props = {
  children: React.ReactNode;
};

const CheckoutLayout: React.FC<Props> = ({ children }) => {
  return (
    <section className="container mx-auto pb-10 pt-2 max-[500px]:px-3 max-[500px]:pb-28">
      {children}
    </section>
  );
};

export default CheckoutLayout;
