import type { FavoriteProduct } from "./types";

export const MOCK_FAVORITES: FavoriteProduct[] = Array.from({ length: 12 }, (_, i) => {
  const id = String(i + 1);

  return {
    id,
    title: "Mens Sky Blue Formal Shirt",
    price: 1890,
    oldPrice: 1890,
    imageSrc: "/pant.png",
    href: `/product/mens-sky-blue-formal-shirt-${id}`,
  };
});
