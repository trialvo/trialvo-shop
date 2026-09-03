"use client";

import React from "react";

type ExportPdfArgs = {
  element: HTMLElement;
  fileName?: string;
};

/** A4 content width at ~96dpi */
const EXPORT_WIDTH_PX = 794;
const EXPORT_PADDING_PX = 32;

/**
 * IMPORTANT: every selector must be scoped under [data-export-sandbox].
 * A bare [data-print-root] / [data-invoice-*] rule would also restyle the
 * live invoice on the page and cause a visible layout jump on Download.
 */
const EXPORT_FORCE_CSS = `
  [data-export-sandbox] [data-invoice-sheet],
  [data-export-sandbox] [data-print-root] {
    width: ${EXPORT_WIDTH_PX}px !important;
    max-width: ${EXPORT_WIDTH_PX}px !important;
    box-sizing: border-box !important;
    padding: ${EXPORT_PADDING_PX}px !important;
    background: #ffffff !important;
    color: #191919 !important;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif !important;
  }

  [data-export-sandbox] [data-invoice-header] {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    justify-content: space-between !important;
    gap: 28px !important;
  }

  [data-export-sandbox] [data-invoice-brand] {
    flex: 1 1 auto !important;
    min-width: 0 !important;
  }

  [data-export-sandbox] [data-invoice-logo-wrap] {
    display: flex !important;
    align-items: center !important;
    width: 160px !important;
    height: 40px !important;
    overflow: visible !important;
  }

  [data-export-sandbox] [data-invoice-logo] {
    display: block !important;
    width: 160px !important;
    height: 40px !important;
    max-width: 160px !important;
    max-height: 40px !important;
    object-fit: contain !important;
    object-position: left center !important;
    opacity: 1 !important;
    visibility: visible !important;
    filter: none !important;
    transform: none !important;
  }

  [data-export-sandbox] [data-invoice-meta-wrap] {
    width: 300px !important;
    max-width: 300px !important;
    flex: 0 0 300px !important;
  }

  [data-export-sandbox] [data-invoice-products-header] {
    display: grid !important;
    grid-template-columns: minmax(0, 1.7fr) 0.9fr 0.45fr 0.9fr !important;
    gap: 12px !important;
    align-items: center !important;
  }

  [data-export-sandbox] [data-invoice-product-row] {
    display: grid !important;
    grid-template-columns: minmax(0, 1.7fr) 0.9fr 0.45fr 0.9fr !important;
    gap: 12px !important;
    align-items: center !important;
  }

  [data-export-sandbox] [data-invoice-product-row] > div:nth-child(2),
  [data-export-sandbox] [data-invoice-product-row] > div:nth-child(3) {
    display: block !important;
    text-align: center !important;
  }

  [data-export-sandbox] [data-invoice-product-row] > div:nth-child(4) {
    display: block !important;
    text-align: right !important;
    font-variant-numeric: tabular-nums !important;
  }

  [data-export-sandbox] [data-invoice-product-row] .invoice-mobile-label {
    display: none !important;
  }

  [data-export-sandbox] [data-invoice-totals-wrap] {
    width: 320px !important;
    max-width: 320px !important;
    margin-left: auto !important;
    display: block !important;
  }

  [data-export-sandbox] [data-invoice-totals-wrap] > div {
    width: 100% !important;
    max-width: 100% !important;
  }

  [data-export-sandbox] [data-invoice-total-row],
  [data-export-sandbox] [data-invoice-meta-row] {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) 148px !important;
    align-items: center !important;
    column-gap: 16px !important;
  }

  [data-export-sandbox] [data-invoice-total-value] {
    text-align: right !important;
    font-variant-numeric: tabular-nums !important;
    white-space: nowrap !important;
  }

  [data-export-sandbox] img {
    opacity: 1 !important;
    visibility: visible !important;
    filter: none !important;
    transform: none !important;
  }
`;

function isSameOrigin(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image blob"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Resolve an image src into an embedded data URL so html-to-image
 * does not lose same-origin SVGs or CORS-blocked product images.
 */
async function resolveImageDataUrl(rawSrc: string): Promise<string | null> {
  if (!rawSrc) return null;
  if (rawSrc.startsWith("data:")) return rawSrc;

  let fetchUrl = rawSrc;
  try {
    const absolute = new URL(rawSrc, window.location.href).href;

    if (isSameOrigin(absolute)) {
      // Local public assets (logo SVG) — fetch directly, never via proxy
      fetchUrl = absolute;
    } else {
      fetchUrl = `/api/image-proxy?url=${encodeURIComponent(absolute)}`;
    }

    const res = await fetch(fetchUrl, { cache: "force-cache" });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";

    // SVG: embed as utf-8 data URL (more reliable than binary for html-to-image)
    if (
      contentType.includes("svg") ||
      absolute.toLowerCase().endsWith(".svg") ||
      rawSrc.toLowerCase().includes(".svg")
    ) {
      const text = await res.text();
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
    }

    const blob = await res.blob();
    return blobToDataUrl(blob);
  } catch {
    return null;
  }
}

/**
 * Exports a DOM node as a clean A4 PDF.
 * Inlines images (including the brand logo SVG) before capture.
 */
export function useExportPdf() {
  const [isExporting, setIsExporting] = React.useState(false);

  const exportPdf = React.useCallback(
    async ({ element, fileName = "invoice.pdf" }: ExportPdfArgs) => {
      if (!element) return;

      setIsExporting(true);

      const [{ toPng }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);

      const clone = element.cloneNode(true) as HTMLElement;
      clone.setAttribute("data-invoice-sheet", "true");
      clone.querySelectorAll("[data-export-ignore]").forEach((n) => n.remove());

      // Inline every image as a data URL before capture
      const images = Array.from(clone.querySelectorAll("img"));
      await Promise.all(
        images.map(async (img) => {
          const src = img.getAttribute("src") || "";
          const dataUrl = await resolveImageDataUrl(src);
          if (dataUrl) {
            img.setAttribute("src", dataUrl);
          }
          img.removeAttribute("srcset");
          img.removeAttribute("sizes");
          img.style.opacity = "1";
          img.style.visibility = "visible";
          img.style.filter = "none";
          img.style.transform = "none";
        }),
      );

      clone.querySelectorAll("[data-invoice-product-row] span").forEach((span) => {
        const text = (span.textContent || "").trim().toLowerCase();
        if (text === "unit price" || text === "qty" || text === "price") {
          span.classList.add("invoice-mobile-label");
        }
      });

      const style = document.createElement("style");
      style.textContent = EXPORT_FORCE_CSS;

      // Zero-size host so the offscreen clone never expands document scroll/layout.
      // data-export-sandbox scopes EXPORT_FORCE_CSS so the live page is untouched.
      const host = document.createElement("div");
      host.setAttribute("aria-hidden", "true");
      host.setAttribute("data-export-sandbox", "true");
      host.style.cssText =
        "position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;";

      const sandbox = document.createElement("div");
      sandbox.style.cssText = `position:absolute;left:0;top:0;width:${EXPORT_WIDTH_PX}px;background:#ffffff;`;
      sandbox.appendChild(style);
      sandbox.appendChild(clone);
      host.appendChild(sandbox);
      document.body.appendChild(host);

      try {
        const fontsReady = (
          document as Document & { fonts?: { ready?: Promise<unknown> } }
        ).fonts?.ready;
        if (fontsReady) await fontsReady;

        // Wait for inlined images to decode
        await Promise.all(
          Array.from(clone.querySelectorAll("img")).map(async (img) => {
            try {
              if ("decode" in img && typeof img.decode === "function") {
                await img.decode();
              }
            } catch {
              // ignore decode errors — placeholder may still render
            }
          }),
        );

        await new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        );

        const pixelRatio = 2;
        const width = EXPORT_WIDTH_PX;
        const height = Math.max(clone.scrollHeight, clone.offsetHeight, 1);

        const imgData = await toPng(clone, {
          backgroundColor: "#ffffff",
          pixelRatio,
          width,
          height,
          canvasWidth: width * pixelRatio,
          canvasHeight: height * pixelRatio,
          cacheBust: false,
          skipFonts: true,
          imagePlaceholder:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
          onImageErrorHandler: () => true,
        });

        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - margin * 2;

        const imgWidth = usableWidth;
        const imgHeight = (height * imgWidth) / width;

        let heightLeft = imgHeight;
        let position = margin;

        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= usableHeight;

        while (heightLeft > 1) {
          position = margin - (imgHeight - heightLeft);
          pdf.addPage();
          pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
          heightLeft -= usableHeight;
        }

        pdf.save(fileName);
      } finally {
        document.body.removeChild(host);
        setIsExporting(false);
      }
    },
    [],
  );

  return { exportPdf, isExporting };
}
