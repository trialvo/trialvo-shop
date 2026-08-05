// src/components/ui/upload/VideoUploader.tsx
"use client";

import React, { useMemo } from "react";
import { Trash2, Video } from "lucide-react";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string; // ✅ only URL
  onChange: (nextUrl: string) => void;
  helperText?: string;
};

function normalizeUrl(input: string): string {
  const t = input.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function isYouTubeUrl(url: string) {
  return /(^|\.)youtube\.com/i.test(url) || /youtu\.be/i.test(url);
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);

    // youtu.be/<id>
    if (/youtu\.be$/i.test(u.hostname)) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    // youtube.com/watch?v=<id>
    if (/(^|\.)youtube\.com$/i.test(u.hostname)) {
      // /watch?v=
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      // /embed/<id>
      if (u.pathname.startsWith("/embed/")) {
        const id = u.pathname.split("/").filter(Boolean)[1];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      // /shorts/<id>
      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.split("/").filter(Boolean)[1];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function looksLikeDirectVideo(url: string) {
  // best-effort (no HEAD fetch)
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
}

export default function VideoUploader({ label, value, onChange, helperText }: Props) {
  const normalized = useMemo(() => normalizeUrl(value), [value]);

  const preview = useMemo(() => {
    if (!normalized) return { kind: "none" as const };

    if (isYouTubeUrl(normalized)) {
      const embed = getYouTubeEmbedUrl(normalized);
      return embed ? ({ kind: "youtube" as const, src: embed }) : ({ kind: "unknown" as const });
    }

    if (looksLikeDirectVideo(normalized)) {
      return { kind: "video" as const, src: normalized };
    }

    // Some CDNs or pages may still be playable in iframe, but not always
    return { kind: "iframe" as const, src: normalized };
  }, [normalized]);

  const clear = () => onChange("");

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>

        <Button variant="outline" size="sm" onClick={clear} disabled={!value.trim()}>
          Clear
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Left: URL input */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Video size={18} />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Video URL</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">YouTube link or direct video link (.mp4/.webm)</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Input
              placeholder="https://youtube.com/watch?v=... or https://cdn.com/video.mp4"
              value={value}
              onChange={(e) => onChange(String(e.target.value))}
            />

            <Button
              variant="outline"
              onClick={() => onChange(normalizeUrl(value))}
              disabled={!value.trim()}
            >
              Fix
            </Button>
          </div>

          {helperText ? <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{helperText}</p> : null}
        </div>

        {/* Right: Preview */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Preview</p>

            {!!value.trim() ? (
              <button
                type="button"
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl border",
                  "border-error-200 bg-white text-error-600 shadow-theme-xs hover:bg-error-50",
                  "dark:border-error-900/40 dark:bg-gray-900 dark:text-error-400 dark:hover:bg-error-500/10",
                )}
                onClick={clear}
                aria-label="Remove video"
                title="Remove"
              >
                <Trash2 size={16} />
              </button>
            ) : null}
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            {preview.kind === "none" ? (
              <div className="flex h-64 items-center justify-center bg-gray-50 text-sm text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                Paste a URL to preview
              </div>
            ) : preview.kind === "youtube" ? (
              <iframe
                title="youtube-video"
                src={preview.src}
                className="h-64 w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : preview.kind === "video" ? (
              <video controls className="h-64 w-full bg-black" src={preview.src} />
            ) : preview.kind === "iframe" ? (
              <iframe
                title="video-iframe"
                src={preview.src}
                className="h-64 w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex h-64 items-center justify-center bg-gray-50 text-sm text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                Invalid video URL
              </div>
            )}
          </div>

          {preview.kind === "iframe" ? (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              If preview doesn’t load, use a direct video file URL (.mp4/.webm) or YouTube link.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
