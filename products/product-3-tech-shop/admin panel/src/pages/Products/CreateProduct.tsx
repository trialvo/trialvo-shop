import PageMeta from "@/components/common/PageMeta";
import CreateProductPage from "@/components/products/create-product/CreateProductPage";

export default function CreateProduct() {
  return (
    <>
      <PageMeta title="Create Product" description="Create a new product" />
      <CreateProductPage />
    </>
  );
}
