export default function JsonLd() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ShopLinkBD",
    url: "https://shoplinkbd.com",
    logo: "https://shoplinkbd.com/icon.svg",
    description:
      "Bangladesh's trusted destination for premium gadgets, tech accessories, and smart devices.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Banani",
      addressLocality: "Dhaka",
      postalCode: "1213",
      addressCountry: "BD",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@shoplinkbd.com",
      availableLanguage: ["English", "Bengali"],
    },
    sameAs: [],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ShopLinkBD",
    url: "https://shoplinkbd.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://shoplinkbd.com/shop?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const storeSchema = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "ShopLinkBD",
    url: "https://shoplinkbd.com",
    description:
      "Premium tech accessories and gadgets online store in Bangladesh",
    currenciesAccepted: "BDT",
    paymentAccepted: "Cash, bKash, Nagad, Visa, Mastercard",
    priceRange: "৳৳",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dhaka",
      addressCountry: "BD",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(storeSchema),
        }}
      />
    </>
  );
}
