import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

type Props = {
  html: string;

  /** Optional outer wrapper classes */
  className?: string;

  /** Text shown when html is empty */
  emptyText?: string;

  /**
   * If you ever allow user-submitted HTML, sanitize on server.
   * For now we assume backend-controlled HTML.
   */
  sanitize?: (html: string) => string;
};

function defaultSanitize(html: string) {
  // Minimal defensive cleanup (NOT a full sanitizer).
  // Real sanitization should be done server-side.
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/javascript:/gi, "");
}

export default function RichTextPreview({
  html,
  className,
  emptyText = "-",
  sanitize,
}: Props) {
  const safeHtml = useMemo(() => {
    const raw = (html ?? "").trim();
    if (!raw) return "";
    const s = sanitize ?? defaultSanitize;
    return s(raw).trim();
  }, [html, sanitize]);

  if (!safeHtml) {
    return (
      <div className={cn("text-sm text-gray-500 dark:text-gray-400", className)}>
        {emptyText}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-800 shadow-theme-xs",
        "dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200",
        className,
      )}
    >
      <div
        className={cn(
          "richtext-preview",
          "space-y-3",
          "[&_*]:max-w-full",

          // Typography
          "[&_p]:leading-relaxed",
          "[&_strong]:font-semibold",
          "[&_em]:italic",
          "[&_u]:underline",
          "[&_s]:line-through",
          "[&_code]:rounded-md [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] dark:[&_code]:bg-white/[0.06]",
          "[&_pre]:overflow-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-gray-200 [&_pre]:bg-gray-50 [&_pre]:p-4 dark:[&_pre]:border-gray-800 dark:[&_pre]:bg-white/[0.03]",
          "[&_pre_code]:bg-transparent [&_pre_code]:p-0",

          // Headings
          "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-gray-900 dark:[&_h1]:text-white",
          "[&_h2]:text-lg [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-gray-900 dark:[&_h2]:text-white",
          "[&_h3]:text-base [&_h3]:font-bold [&_h3]:tracking-tight [&_h3]:text-gray-900 dark:[&_h3]:text-white",
          "[&_h1]:mt-2 [&_h2]:mt-2 [&_h3]:mt-2",
          "[&_h1]:mb-1 [&_h2]:mb-1 [&_h3]:mb-1",

          // Links
          "[&_a]:text-brand-600 dark:[&_a]:text-brand-400",
          "[&_a]:underline [&_a]:underline-offset-2",
          "[&_a:hover]:opacity-90",
          "[&_a]:break-words",

          // Lists
          "[&_ul]:list-disc [&_ul]:pl-6",
          "[&_ol]:list-decimal [&_ol]:pl-6",
          "[&_li]:my-1",
          "[&_ol>li]:pl-1",
          "[&_ul>li]:pl-1",

          // Blockquote + HR
          "[&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-4 [&_blockquote]:text-gray-700 dark:[&_blockquote]:border-gray-800 dark:[&_blockquote]:text-gray-300",
          "[&_hr]:my-4 [&_hr]:border-gray-200 dark:[&_hr]:border-gray-800",

          // Media
          "[&_img]:max-w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-gray-200 dark:[&_img]:border-gray-800",
          "[&_video]:max-w-full [&_video]:rounded-xl [&_video]:border [&_video]:border-gray-200 dark:[&_video]:border-gray-800",
          "[&_iframe]:w-full [&_iframe]:rounded-xl [&_iframe]:border [&_iframe]:border-gray-200 dark:[&_iframe]:border-gray-800",
          "[&_figure]:my-3",
          "[&_figcaption]:mt-2 [&_figcaption]:text-xs [&_figcaption]:text-gray-500 dark:[&_figcaption]:text-gray-400",

          // Tables (advanced)
          "[&_table]:w-full [&_table]:border-collapse [&_table]:text-left",
          "[&_table]:rounded-xl [&_table]:overflow-hidden",
          "[&_table]:border [&_table]:border-gray-200 dark:[&_table]:border-gray-800",
          "[&_thead_th]:bg-gray-50 dark:[&_thead_th]:bg-white/[0.04]",
          "[&_th]:font-semibold [&_th]:text-gray-900 dark:[&_th]:text-gray-100",
          "[&_th]:px-3 [&_th]:py-2",
          "[&_td]:px-3 [&_td]:py-2",
          "[&_th]:border [&_th]:border-gray-200 dark:[&_th]:border-gray-800",
          "[&_td]:border [&_td]:border-gray-200 dark:[&_td]:border-gray-800",
          "[&_tbody_tr:hover]:bg-gray-50/70 dark:[&_tbody_tr:hover]:bg-white/[0.03]",
          "[&_td]:align-top",

          // Responsive table wrapper if backend provides <div class="table-wrap"> or plain <table>
          "[&_.table-wrap]:overflow-x-auto [&_.table-wrap]:rounded-xl [&_.table-wrap]:border [&_.table-wrap]:border-gray-200 dark:[&_.table-wrap]:border-gray-800",
          "[&_.table-wrap_table]:border-0",

          // TipTap YouTube node (if class exists)
          "[&_.youtube]:overflow-hidden [&_.youtube]:rounded-xl",
        )}
        // NOTE: backend controlled HTML. If you ever allow user-submitted HTML, sanitize on server.
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </div>
  );
}
