import PageMeta from "@/components/common/PageMeta";
import CreateCustomerPage from "@/components/customers/create-customer/CreateCustomerPage";

export default function CreateCustomer() {
  return (
    <>
      <PageMeta
        title="Create Customer"
        description="Create new customer with behavior and IP access control"
      />
      <CreateCustomerPage />
    </>
  );
}
