import { notFound } from "next/navigation";
import { fetchPublicPolicyByKey } from "@/lib/api/policy";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import PolicyPageClient from "@/components/legal/PolicyPageClient";

type Props = {
  params: Promise<{ key: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  const policy = await fetchPublicPolicyByKey(key);

  if (!policy) {
    return buildMetadata({
      title: "Policy Not Found | Graduate",
      robots: "noindex,nofollow",
    });
  }

  const title = `${policy.title} | Graduate`;
  const description = `Read Graduate's ${policy.title} for important information about our policies and terms.`;

  return buildMetadata({
    title,
    description,
    canonical: `/policy/${key}`,
    ogTitle: title,
    ogDescription: description,
  });
}

const PolicyPage = async ({ params }: Props) => {
  const { key } = await params;
  const policy = await fetchPublicPolicyByKey(key);

  if (!policy) {
    notFound();
  }

  return <PolicyPageClient policy={policy} />;
};

export default PolicyPage;
