import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Layout from "@/components/layout/Layout";
import PolicyDocumentView from "@/components/policies/PolicyDocumentView";
import {
  getPolicyDocument,
  POLICY_TYPES,
} from "@/lib/policies/policyContent";

type Props = Readonly<{
  params: Promise<{ type: string }>;
}>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const policy = getPolicyDocument(type);
  if (!policy) return { title: "Policy Not Found" };
  return {
    title: policy.title,
    description: policy.description,
    openGraph: {
      title: `${policy.title} | ShopLinkBD`,
      description: policy.description,
    },
  };
}

export function generateStaticParams() {
  return POLICY_TYPES.map((type) => ({ type }));
}

export default async function PolicyPage({ params }: Props) {
  const { type } = await params;
  const policy = getPolicyDocument(type || "");

  if (!policy) {
    notFound();
  }

  return (
    <Layout>
      <PolicyDocumentView policy={policy} />
    </Layout>
  );
}
