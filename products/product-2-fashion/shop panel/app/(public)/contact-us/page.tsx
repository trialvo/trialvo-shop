import ContactUsPage from "@/components/contact/ContactUsPage";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

const title = "Contact Us | Graduate";
const description =
  "Get in touch with Graduate. Send us a message, view our contact details, follow us on social media, and find our store location.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/contact-us",
  ogTitle: title,
  ogDescription:
    "Send us a message, view contact information, business hours, and find our store location.",
  ogImage: "/og-contact.jpg",
});

const Page: React.FC = () => {
  return <ContactUsPage />;
};

export default Page;
