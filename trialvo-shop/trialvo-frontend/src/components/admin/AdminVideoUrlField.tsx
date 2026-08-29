"use client";

import { ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseVideoUrl, videoProviderLabel } from "@/lib/videoEmbed";

export type AdminVideoUrlFieldProps = {
  value: string;
  onChange: (value: string) => void;
  inputClass?: string;
  labelClass?: string;
};

/**
 * Accepts any YouTube / Vimeo / Loom / direct-file URL and previews the embed
 * the shop will actually render, so a watch link is never saved as a broken
 * iframe src.
 */
export function AdminVideoUrlField({
  value,
  onChange,
  inputClass,
  labelClass,
}: Readonly<AdminVideoUrlFieldProps>) {
  const trimmed = value.trim();
  const parsed = parseVideoUrl(trimmed);
  const invalid = Boolean(trimmed) && !parsed;

  return (
    <div className="space-y-2">
      <Label className={labelClass}>Demo video URL</Label>
      <Input
        type="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
        placeholder="https://www.youtube.com/watch?v=..."
        aria-invalid={invalid || undefined}
      />
      <p className="text-xs leading-5 text-muted-foreground">
        Paste a YouTube watch, Shorts or youtu.be link — or Vimeo, Loom, or a
        direct .mp4 / .webm file. The shop converts it into a playable embed.
      </p>

      {invalid ? (
        <p className="text-xs text-destructive">
          Unrecognised URL. Use a YouTube, Vimeo, Loom, or direct video file link.
        </p>
      ) : null}

      {parsed ? (
        <div className="overflow-hidden rounded-lg border border-border bg-muted">
          <div className="aspect-video">
            {parsed.provider === "file" ? (
              <video
                src={parsed.embedUrl}
                controls
                playsInline
                preload="metadata"
                className="h-full w-full"
              >
                <track kind="captions" />
              </video>
            ) : (
              <iframe
                src={parsed.embedUrl}
                title="Demo video preview"
                className="h-full w-full"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            )}
          </div>
          <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground">
            <span>Preview · {videoProviderLabel(parsed.provider)}</span>
            {parsed.provider !== "file" ? (
              <a
                href={parsed.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
              >
                Open
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdminVideoUrlField;
