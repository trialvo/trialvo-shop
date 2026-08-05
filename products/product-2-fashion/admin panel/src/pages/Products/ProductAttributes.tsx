import PageMeta from "@/components/common/PageMeta";
import ProductAttributesPage from "@/components/products/product-attributes/ProductAttributesPage";

export default function ProductAttributes() {
  return (
    <>
      <PageMeta
        title="Product Attributes"
        description="Manage product brand, color, attributes and variants"
      />
      <ProductAttributesPage />
    </>
  );
}
