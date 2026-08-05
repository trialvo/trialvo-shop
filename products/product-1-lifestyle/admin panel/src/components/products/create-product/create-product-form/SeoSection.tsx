import { useMemo } from "react";
import Section from "./Section";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import FieldGroup from "@/components/ui/layout/FieldGroup";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

type Option = { value: string; label: string };

function SeoSection({
  seo,
  setSeo,
}: {
  seo: {
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    canonical_url: string;
    og_title: string;
    og_description: string;
    robots: string;
  };
  setSeo: React.Dispatch<
    React.SetStateAction<{
      meta_title: string;
      meta_description: string;
      meta_keywords: string;
      canonical_url: string;
      og_title: string;
      og_description: string;
      robots: string;
    }>
  >;
}) {
  const { t } = useTranslation();
  const robotsOptions: Option[] = useMemo(
    () => [
      { value: "index, follow", label: "index, follow" },
      { value: "index, nofollow", label: "index, nofollow" },
      { value: "noindex, follow", label: "noindex, follow" },
      { value: "noindex, nofollow", label: "noindex, nofollow" },
    ],
    [],
  );

  return (
    <Section
      title={t("products.createProduct.seoTitle")}
      description={t("products.createProduct.seoDesc")}
      icon={<Globe className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FieldGroup label={t("products.createProduct.metaTitle")}>
          <Input
            value={seo.meta_title}
            onChange={(e) =>
              setSeo((p) => ({
                ...p,
                meta_title: String(e.target.value),
              }))
            }
            placeholder={t("products.createProduct.metaTitlePlaceholder")}
          />
        </FieldGroup>

        <FieldGroup label={t("products.createProduct.canonicalUrl")}>
          <Input
            value={seo.canonical_url}
            onChange={(e) =>
              setSeo((p) => ({
                ...p,
                canonical_url: String(e.target.value),
              }))
            }
            placeholder="https://example.com/product"
          />
        </FieldGroup>

        <div className="lg:col-span-2">
          <FieldGroup
            label={t("products.createProduct.metaDescription")}
            hint={t("products.createProduct.metaDescHint")}
          >
            <Input
              value={seo.meta_description}
              onChange={(e) =>
                setSeo((p) => ({
                  ...p,
                  meta_description: String(e.target.value),
                }))
              }
              placeholder={t("products.createProduct.metaDescPlaceholder")}
            />
          </FieldGroup>
        </div>

        <div className="lg:col-span-2">
          <FieldGroup label={t("products.createProduct.metaKeywords")}>
            <Input
              value={seo.meta_keywords}
              onChange={(e) =>
                setSeo((p) => ({
                  ...p,
                  meta_keywords: String(e.target.value),
                }))
              }
              placeholder={t("products.createProduct.metaKeywordsPlaceholder")}
            />
          </FieldGroup>
        </div>

        <FieldGroup label={t("products.createProduct.ogTitle")}>
          <Input
            value={seo.og_title}
            onChange={(e) =>
              setSeo((p) => ({
                ...p,
                og_title: String(e.target.value),
              }))
            }
            placeholder={t("products.createProduct.ogTitlePlaceholder")}
          />
        </FieldGroup>

        <FieldGroup label={t("products.createProduct.robots")}>
          <Select
            options={robotsOptions}
            placeholder={t("products.createProduct.robotsPlaceholder")}
            value={seo.robots}
            onChange={(v) =>
              setSeo((p) => ({ ...p, robots: String(v) }))
            }
          />
        </FieldGroup>

        <div className="lg:col-span-2">
          <FieldGroup label={t("products.createProduct.ogDescription")}>
            <Input
              value={seo.og_description}
              onChange={(e) =>
                setSeo((p) => ({
                  ...p,
                  og_description: String(e.target.value),
                }))
              }
              placeholder={t("products.createProduct.ogDescPlaceholder")}
            />
          </FieldGroup>
        </div>
      </div>
    </Section>
  );
}
export default SeoSection;