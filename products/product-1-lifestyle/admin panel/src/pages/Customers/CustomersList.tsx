import PageMeta from "@/components/common/PageMeta";
import CustomersListPage from "@/components/customers/customers-list/CustomersListPage";

export default function CustomersList() {
  return (
    <>
      <PageMeta
        title="Customers List"
        description="Customer Management - Customers List"
      />
      <CustomersListPage />
    </>
  );
}
