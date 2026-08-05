import productsData from "@/data/products.json";
import reviewsData from "@/data/reviews.json";
import type { Product, Review } from "@/types";

const allProducts: Product[] = productsData;
const allReviews: Review[] = reviewsData;

// Simulates network delay
const delay = (ms = 300) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Mock API Functions ────────────────────────────────────

export const fetchProducts = async (): Promise<Product[]> => {
  await delay(200);
  return allProducts;
};

export const fetchProductBySlug = async (slug: string): Promise<Product | null> => {
  await delay(150);
  return allProducts.find((p) => p.slug === slug) ?? null;
};

export const fetchProductsByCategory = async (category: string): Promise<Product[]> => {
  await delay(200);
  if (category === "All") return allProducts;
  return allProducts.filter((p) => p.category === category);
};

export const fetchRelatedProducts = async (
  productId: number,
  category: string
): Promise<Product[]> => {
  await delay(150);
  const related = allProducts.filter((p) => p.id !== productId && p.category === category);
  return related.length > 0
    ? related.slice(0, 4)
    : allProducts.filter((p) => p.id !== productId).slice(0, 4);
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  await delay(250);
  const q = query.toLowerCase();
  return allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
  );
};

export const fetchReviews = async (productId: number): Promise<Review[]> => {
  await delay(200);
  return allReviews.filter((r) => r.productId === productId);
};

// ─── Sync Helpers ──────────────────────────────────────────

export const getProductById = (id: number): Product | undefined =>
  allProducts.find((p) => p.id === id);

export const getProductBySlug = (slug: string): Product | undefined =>
  allProducts.find((p) => p.slug === slug);

export const getRelatedProducts = (id: number, category: string): Product[] =>
  allProducts.filter((p) => p.id !== id && p.category === category).slice(0, 4);

export const getAllProducts = (): Product[] => allProducts;
