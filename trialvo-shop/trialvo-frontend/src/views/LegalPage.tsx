"use client";

import Layout from "@/components/layout/Layout";
import LegalDocument from "@/components/legal/LegalDocument";
import { useLanguage } from "@/contexts/LanguageContext";
import { legalDoc, type LegalDocKey } from "@/lib/legal";

/** One view for every legal/policy route — the route passes the doc key. */
export default function LegalPage({ docKey }: Readonly<{ docKey: LegalDocKey }>) {
  const { language } = useLanguage();
  const doc = legalDoc(docKey, language);

  return (
    <Layout>
      <LegalDocument doc={doc} docKey={docKey} language={language} />
    </Layout>
  );
}
