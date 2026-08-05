"use client";

import React from "react";

type ExportPdfArgs = {
  element: HTMLElement;
  fileName?: string; // default: "invoice.pdf"
};

/**
 * Exports a DOM node as PDF.
 * - Uses a cloned DOM to remove elements marked with [data-export-ignore].
 * - Uses dynamic import to keep bundle smaller.
 */
export function useExportPdf() {
  const [isExporting, setIsExporting] = React.useState(false);

  const exportPdf = React.useCallback(
    async ({ element, fileName = "invoice.pdf" }: ExportPdfArgs) => {
      if (!element) return;

      setIsExporting(true);

      // dynamic imports (performance)
      const [{ toPng }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);

      // Clone node so we can remove "ignore" parts for export
      const clone = element.cloneNode(true) as HTMLElement;

      // Remove buttons/actions from export if needed
      clone.querySelectorAll("[data-export-ignore]").forEach((n) => n.remove());

      const toProxyUrl = (rawUrl: string) => {
        if (!rawUrl) return rawUrl;
        if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:"))
          return rawUrl;
        try {
          const absolute = new URL(rawUrl, window.location.href).href;
          return `/api/image-proxy?url=${encodeURIComponent(absolute)}`;
        } catch {
          return rawUrl;
        }
      };

      // Proxy images to avoid CORS/fetch issues during export.
      clone.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src");
        if (!src) return;
        img.setAttribute("src", toProxyUrl(src));
        img.setAttribute("srcset", "");
      });

      clone.style.width = `${element.offsetWidth}px`;
      // Put cloned node offscreen to capture computed styles properly
      const sandbox = document.createElement("div");
      sandbox.style.position = "fixed";
      sandbox.style.left = "-10000px";
      sandbox.style.top = "0";
      sandbox.style.width = `${element.offsetWidth}px`;
      sandbox.style.background = "white";
      sandbox.style.zIndex = "999999";
      sandbox.appendChild(clone);
      document.body.appendChild(sandbox);

      try {
        const fontsReady = (
          document as Document & { fonts?: { ready?: Promise<unknown> } }
        ).fonts?.ready;
        if (fontsReady) {
          await fontsReady;
        }

        const images = Array.from(clone.querySelectorAll("img"));
        await Promise.all(
          images.map(
            (img) =>
              new Promise<void>((resolve) => {
                if (img.complete) return resolve();
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }),
          ),
        );

        const pixelRatio = 2;
        const width = element.offsetWidth;
        const height = element.offsetHeight;

        const imgData = await toPng(clone, {
          backgroundColor: "#ffffff",
          pixelRatio,
          skipFonts: true,
          imagePlaceholder:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
          onImageErrorHandler: () => true,
        });

        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const scale = Math.min(pageWidth / width, pageHeight / height);
        const imgWidth = width * scale;
        const imgHeight = height * scale;
        const x = (pageWidth - imgWidth) / 2;
        const y = 0;

        pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
        pdf.save(fileName);
      } finally {
        document.body.removeChild(sandbox);
        setIsExporting(false);
      }
    },
    [],
  );

  return { exportPdf, isExporting };
}
