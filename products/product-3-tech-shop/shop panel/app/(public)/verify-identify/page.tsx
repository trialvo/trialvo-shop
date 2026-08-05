import { Suspense } from "react";
import Layout from "@/components/layout/Layout";
import VerifyIdentifyClient from "@/components/auth/VerifyIdentifyClient";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ email?: string; otp?: string }>;
};

export default async function VerifyIdentifyPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <Suspense
      fallback={
        <Layout>
          <div className="container py-20 text-center text-muted-foreground text-sm">
            Loading verification…
          </div>
        </Layout>
      }
    >
      <VerifyIdentifyClient
        email={params.email ?? ""}
        otp={params.otp ?? ""}
      />
    </Suspense>
  );
}
