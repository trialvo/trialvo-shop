import PageMeta from "@/components/common/PageMeta";
import AllProductsPage from "@/components/products/all-products/AllProductsPage";

export default function AllProducts() {
  return (
    <>
      <PageMeta title="All Products" description="Product Management - All Products" />
      <AllProductsPage />
    </>
  );
}
