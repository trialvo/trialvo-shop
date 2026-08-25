import React from "react";

type Props = {
  children: React.ReactNode;
};

const CheckoutLayout: React.FC<Props> = ({ children }) => {
  return (
    <section className="container mx-auto pb-10 max-[501px]:px-3 max-[501px]:pt-11.5 max-[501px]:pb-28 sm:pt-2">
      {children}
    </section>
  );
};

export default CheckoutLayout;
