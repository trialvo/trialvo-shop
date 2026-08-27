import { Suspense } from "react";
import ProductsPage from "@/views/ProductsPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ProductsPage />
    </Suspense>
  );
}
