"use client";

import React, { useRef } from "react";
import Image from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { cn } from "@/lib/utils";

function ResizableImageNodeView({
  node,
  updateAttributes,
  selected,
}: {
  node: any;
  updateAttributes: (attrs: Record<string, unknown>) => void;
  selected: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const src: string = node?.attrs?.src ?? "";
  const alt: string = node?.attrs?.alt ?? "";
  const width: string | null = node?.attrs?.width ?? null;
  const height: string | null = node?.attrs?.height ?? null;

  return (
    <NodeViewWrapper className="my-3">
      <div
        ref={wrapperRef}
        className={cn(
          "inline-block max-w-full overflow-hidden rounded-xl",
          "border border-transparent",
          selected && "border-primary-500/60 ring-2 ring-primary-500/20",
        )}
        style={{
          resize: "both",
          width: width ?? "auto",
          height: height ?? "auto",
        }}
        onMouseUp={() => {
          const el = wrapperRef.current;
          if (!el) return;

          const w = el.style.width;
          const h = el.style.height;

          const widthPx =
            w && w !== "auto" ? `${Math.max(40, el.clientWidth)}px` : null;
          const heightPx =
            h && h !== "auto" ? `${Math.max(40, el.clientHeight)}px` : null;

          updateAttributes({ width: widthPx, height: heightPx });
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="block h-full w-full max-w-full"
          style={{ objectFit: "contain" }}
          draggable={false}
        />
      </div>
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attrs) => (attrs.width ? { width: attrs.width } : {}),
      },
      height: {
        default: null,
        renderHTML: (attrs) => (attrs.height ? { height: attrs.height } : {}),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView);
  },
});
