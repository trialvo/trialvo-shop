import MyOrderDetailsClient from "@/components/account/orders/my-order/MyOrderDetailsClient";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

type Props = {
  params: { orderId: string };
};

const title = "My Order | Graduate";
const description = "View your order invoice details.";

export const generateMetadata = async ({ params }: Props): Promise<Metadata> =>
  buildMetadata({
    title,
    description,
    canonical: `/account/my-order/${params.orderId}`,
    ogTitle: title,
    ogDescription: description,
    ogImage: "/og-orders.jpg",
    robots: "noindex,nofollow",
  });

const Page: React.FC<Props> = async ({ params }) => {
  const id = (await params)?.orderId;

  return <MyOrderDetailsClient orderId={id} />;
};

export default Page;
