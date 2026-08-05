import PageMeta from "@/components/common/PageMeta";
import ProductCategoryPage from "@/components/products/product-category/ProductCategoryPage";

export default function ProductCategory() {
  return (
    <>
      <PageMeta
        title="Product Category"
        description="Manage Category, Sub Category and Child Category"
      />
      <ProductCategoryPage />
    </>
  );
}
