import { Product } from "@/types";

export function generateProductJsonLd(product: Product, baseUrl: string) {
  // Safely build the images array regardless of what the API returned
  const imageArray: string[] =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: imageArray.map((img) =>
      img.startsWith("http") ? img : `${baseUrl}${img}`,
    ),
    sku: `SKU-${product.id}`,
    brand: {
      "@type": "Brand",
      name: "My Shop",
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/products/${product.slug}`,
      priceCurrency: "BDT",
      price: product.discountPrice ?? product.price, // sell price (what customer pays)
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
  };
}

export function generateOrganizationJsonLd(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "My Shop",
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png`,
    description: "Premium online store offering curated quality products.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+880-1234-567890",
      contactType: "customer service",
      availableLanguage: ["English", "Bengali"],
    },
    sameAs: [
      "https://facebook.com/myshop",
      "https://instagram.com/myshop",
      "https://twitter.com/myshop",
    ],
  };
}

export function generateWebSiteJsonLd(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "My Shop",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateBreadcrumbJsonLd(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
