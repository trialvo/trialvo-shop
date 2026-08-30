import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import LegalPage from "@/views/LegalPage";
import { legalDoc, legalPath, type LegalDocKey } from "@/lib/legal";
import { LEGAL_MODIFIED_ISO } from "@/lib/legal/types";
import { pageSeo, type PageSeoKey } from "@/lib/seo/copy";
import { breadcrumbJsonLd, graphJsonLd, legalPageJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata, resolveLocale } from "@/lib/seo/metadata";

type RouteParams = { params: Promise<{ lang: string }> };

/**
 * Every legal route is the same shape: locale-aware metadata, a breadcrumb +
 * legal-document graph, and the shared renderer. This builds both exports so a
 * route file stays two lines.
 */
export function createLegalRoute(docKey: LegalDocKey & PageSeoKey) {
  const path = legalPath(docKey);

  async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
    const locale = resolveLocale((await params).lang);
    return buildPageMetadata({
      locale,
      path,
      seo: pageSeo(docKey, locale),
      ogType: "article",
    });
  }

  async function Page({ params }: RouteParams) {
    const locale = resolveLocale((await params).lang);
    const doc = legalDoc(docKey, locale);
    const seo = pageSeo(docKey, locale);

    return (
      <>
        <JsonLd
          id={`seo-legal-${docKey}`}
          data={graphJsonLd(
            legalPageJsonLd({
              locale,
              path,
              name: doc.title,
              description: seo.description,
              dateModified: LEGAL_MODIFIED_ISO,
            }),
            breadcrumbJsonLd(locale, [
              { name: locale === "bn" ? "হোম" : "Home", path: "/" },
              { name: doc.title, path },
            ]),
          )}
        />
        <LegalPage docKey={docKey} />
      </>
    );
  }

  return { generateMetadata, Page };
}
