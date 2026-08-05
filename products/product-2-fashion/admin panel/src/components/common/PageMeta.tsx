import { HelmetProvider, Helmet } from "react-helmet-async";
import { useAppBranding } from "../../context/AppBrandingContext";
import { useTheme } from "../../context/ThemeContext";

const AppHead = () => {
  const { branding } = useAppBranding();
  const { theme } = useTheme();
  const faviconHref =
    theme === "dark" && branding.faviconDarkUrl
      ? branding.faviconDarkUrl
      : branding.faviconUrl;

  return (
    <Helmet>
      <link rel="icon" href={faviconHref} />
      {branding.appleTouchIconUrl ? (
        <link rel="apple-touch-icon" href={branding.appleTouchIconUrl} />
      ) : null}
      {branding.defaultOgImageUrl ? (
        <meta property="og:image" content={branding.defaultOgImageUrl} />
      ) : null}
      <meta
        name="theme-color"
        content={
          theme === "dark" ? branding.themeColorDark : branding.themeColorLight
        }
      />
    </Helmet>
  );
};

export type PageMetaProps = {
  /** Page-specific title segment. App name is appended automatically. */
  title: string;
  description?: string;
  /** When true, title is used as-is (no app name suffix). */
  rawTitle?: boolean;
};

/**
 * Builds document title: "Products | Lifestyle Admin"
 * Strips any legacy "| Brand" suffix so verticals stay config-driven.
 */
function buildDocumentTitle(
  title: string,
  appName: string,
  separator: string,
  rawTitle?: boolean,
): string {
  if (rawTitle) return title;
  const sep = ` ${separator} `;
  const pageOnly = title.includes(sep) ? title.split(sep)[0]!.trim() : title.trim();
  if (!pageOnly) return appName;
  if (pageOnly === appName) return appName;
  return `${pageOnly} ${separator} ${appName}`;
}

const PageMeta = ({ title, description, rawTitle }: PageMetaProps) => {
  const { branding } = useAppBranding();
  const documentTitle = buildDocumentTitle(
    title,
    branding.appName,
    branding.titleSeparator,
    rawTitle,
  );

  return (
    <Helmet>
      <title>{documentTitle}</title>
      <meta
        name="description"
        content={description ?? branding.defaultDescription}
      />
    </Helmet>
  );
};

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    <AppHead />
    {children}
  </HelmetProvider>
);

export default PageMeta;
