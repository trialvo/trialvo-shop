import EditAddressClient from "@/components/account/address-book/EditAddressClient";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

type Props = {
  params: { id: string };
};

const title = "Edit Address | Graduate";
const description = "Update your delivery or billing address details.";

export const generateMetadata = async ({ params }: Props): Promise<Metadata> =>
  buildMetadata({
    title,
    description,
    canonical: `/account/address/${params.id}/edit`,
    ogTitle: title,
    ogDescription: description,
    ogImage: "/og-address.jpg",
    robots: "noindex,nofollow",
  });

const Page: React.FC = () => {
  return <EditAddressClient />;
};

export default Page;
