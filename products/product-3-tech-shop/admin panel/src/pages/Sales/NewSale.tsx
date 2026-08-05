import React from "react";
import PageMeta from "@/components/common/PageMeta";
import NewSalePage from "@/components/sales/NewSalePage";

const NewSale: React.FC = () => {
  return (
    <>
      <PageMeta title="New Sale" description="Create a new sale order" />
      <NewSalePage />
    </>
  );
};

export default NewSale;
