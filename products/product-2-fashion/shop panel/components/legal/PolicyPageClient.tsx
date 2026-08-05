"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { getLocalName } from "@/lib/utils";
import React from "react";
import Breadcrumbs from "../breadcrumb/Breadcrumbs";
import type { PolicyData } from "@/lib/api/policy";

type Props = {
  policy: PolicyData;
};

const PolicyPageClient: React.FC<Props> = ({ policy }) => {
  const { language } = useTranslation();

  // Show bd_title when language is Bangla and bd_title exists; otherwise English title
  const displayTitle = getLocalName(policy.title, policy.bd_title, language);

  return (
    <div className="container mx-auto pb-6 max-[501px]:pt-11.5 max-[501px]:px-2">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: displayTitle }]}
      />

      <Card className="gap-3 rounded-none border-0 p-0 shadow-none">
        <CardHeader className="gap-0 rounded-none border-0 px-4 py-2.5 shadow-[0px_0px_12px_rgba(0,0,0,0.12)]">
          <h1 className="text-2xl font-bold text-black">{displayTitle}</h1>
          {policy.updated_at && (
            <p className="mt-1 text-xs text-gray-400">
              {language === "bn" ? "সর্বশেষ আপডেট:" : "Last updated:"}{" "}
              {new Date(policy.updated_at).toLocaleDateString(
                language === "bn" ? "bn-BD" : "en-US",
                { year: "numeric", month: "long", day: "numeric" }
              )}
            </p>
          )}
        </CardHeader>

        <CardContent className="gap-0 rounded-none border-0! p-6 shadow-[0px_0px_12px_rgba(0,0,0,0.12)]">
          {!policy.content ? (
            <p className="text-sm text-gray-400 italic">
              {language === "bn" ? "শীঘ্রই আসছে।" : "Content coming soon."}
            </p>
          ) : policy.content_type === "html" ? (
            <div
              className="policy-content"
              dangerouslySetInnerHTML={{ __html: policy.content }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[#2E2E2E]">
              {policy.content}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PolicyPageClient;
