export type VideoProvider = "youtube" | "vimeo" | "loom" | "file";

export type ParsedVideo = {
  provider: VideoProvider;
  id: string;
  /** Safe iframe src — privacy-enhanced host for YouTube */
  embedUrl: string;
  /** Canonical page URL for structured data and "open on …" links */
  watchUrl: string;
  thumbnailUrl?: string;
};

const FILE_EXT = /\.(mp4|webm|ogg|ogv|mov)(\?|#|$)/i;
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "youtube-nocookie.com",
  "music.youtube.com",
]);
/** Path prefixes that carry the id in the next segment: /embed/ID, /shorts/ID … */
const YOUTUBE_PATH_PREFIXES = ["embed", "shorts", "live", "v"];

function youtubeId(value: string): string | null {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }

    if (YOUTUBE_HOSTS.has(host)) {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery && /^[\w-]{11}$/.test(fromQuery)) return fromQuery;

      const parts = url.pathname.split("/").filter(Boolean);
      if (
        parts.length >= 2 &&
        YOUTUBE_PATH_PREFIXES.includes(parts[0]) &&
        /^[\w-]{11}$/.test(parts[1])
      ) {
        return parts[1];
      }
    }
    return null;
  } catch {
    const loose = value.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{11})/);
    return loose?.[1] ?? null;
  }
}

function vimeoId(value: string): string | null {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[0] === "video" ? parts[1] : parts[parts.length - 1];
    return id && /^\d+$/.test(id) ? id : null;
  } catch {
    const loose = value.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return loose?.[1] ?? null;
  }
}

function loomId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.hostname.replace(/^www\./, "") !== "loom.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if ((parts[0] === "share" || parts[0] === "embed") && parts[1]) return parts[1];
    return null;
  } catch {
    const loose = value.match(/loom\.com\/(?:share|embed)\/([a-z0-9]+)/i);
    return loose?.[1] ?? null;
  }
}

/**
 * Accepts a watch URL, share URL, shorts URL, or an already-embedded src and
 * returns something safe to put in an iframe. Returns null for empty or
 * unrecognised input, so callers can hide the video UI entirely.
 */
export function parseVideoUrl(raw: string | null | undefined): ParsedVideo | null {
  const value = raw?.trim();
  if (!value) return null;

  const yt = youtubeId(value);
  if (yt) {
    return {
      provider: "youtube",
      id: yt,
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1`,
      watchUrl: `https://www.youtube.com/watch?v=${yt}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
    };
  }

  const vimeo = vimeoId(value);
  if (vimeo) {
    return {
      provider: "vimeo",
      id: vimeo,
      embedUrl: `https://player.vimeo.com/video/${vimeo}`,
      watchUrl: `https://vimeo.com/${vimeo}`,
    };
  }

  const loom = loomId(value);
  if (loom) {
    return {
      provider: "loom",
      id: loom,
      embedUrl: `https://www.loom.com/embed/${loom}`,
      watchUrl: `https://www.loom.com/share/${loom}`,
    };
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (FILE_EXT.test(url.pathname)) {
      return {
        provider: "file",
        id: url.pathname,
        embedUrl: url.href,
        watchUrl: url.href,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function videoProviderLabel(provider: VideoProvider): string {
  if (provider === "youtube") return "YouTube";
  if (provider === "vimeo") return "Vimeo";
  if (provider === "loom") return "Loom";
  return "Video";
}
