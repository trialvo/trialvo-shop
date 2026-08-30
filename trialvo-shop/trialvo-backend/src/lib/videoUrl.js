/**
 * Accept watch / share / embed URLs from YouTube, Vimeo, Loom, or a direct
 * video file. Empty input becomes null. Unrecognised non-empty input is
 * rejected so a broken iframe src can never reach the database.
 *
 * Must stay in lockstep with trialvo-frontend/src/lib/videoEmbed.ts
 */

const FILE_EXT = /\.(mp4|webm|ogg|ogv|mov)(\?|#|$)/i;
const YOUTUBE_HOSTS = ['youtube.com', 'youtube-nocookie.com', 'music.youtube.com'];
const YOUTUBE_PATH_PREFIXES = ['embed', 'shorts', 'live', 'v'];

function youtubeId(value) {
    try {
        const url = new URL(value);
        const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');

        if (host === 'youtu.be') {
            const id = url.pathname.split('/').filter(Boolean)[0];
            return id && /^[\w-]{11}$/.test(id) ? id : null;
        }

        if (YOUTUBE_HOSTS.includes(host)) {
            const fromQuery = url.searchParams.get('v');
            if (fromQuery && /^[\w-]{11}$/.test(fromQuery)) return fromQuery;

            const parts = url.pathname.split('/').filter(Boolean);
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
        return loose ? loose[1] : null;
    }
}

function vimeoId(value) {
    try {
        const url = new URL(value);
        const host = url.hostname.replace(/^www\./, '');
        if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null;
        const parts = url.pathname.split('/').filter(Boolean);
        const id = parts[0] === 'video' ? parts[1] : parts[parts.length - 1];
        return id && /^\d+$/.test(id) ? id : null;
    } catch {
        const loose = value.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        return loose ? loose[1] : null;
    }
}

function loomId(value) {
    try {
        const url = new URL(value);
        if (url.hostname.replace(/^www\./, '') !== 'loom.com') return null;
        const parts = url.pathname.split('/').filter(Boolean);
        if ((parts[0] === 'share' || parts[0] === 'embed') && parts[1]) return parts[1];
        return null;
    } catch {
        const loose = value.match(/loom\.com\/(?:share|embed)\/([a-z0-9]+)/i);
        return loose ? loose[1] : null;
    }
}

function isDirectFile(value) {
    try {
        const url = new URL(value);
        return (
            (url.protocol === 'http:' || url.protocol === 'https:') &&
            FILE_EXT.test(url.pathname)
        );
    } catch {
        return false;
    }
}

/**
 * @param {unknown} raw
 * @returns {{ ok: true, value: string | null } | { ok: false, error: string }}
 */
function normalizeVideoUrl(raw) {
    if (raw == null || raw === '') return { ok: true, value: null };
    if (typeof raw !== 'string') return { ok: false, error: 'Video URL must be a string' };

    const value = raw.trim();
    if (!value) return { ok: true, value: null };

    if (youtubeId(value) || vimeoId(value) || loomId(value) || isDirectFile(value)) {
        return { ok: true, value };
    }

    return {
        ok: false,
        error: 'Video URL must be a YouTube, Vimeo, Loom, or direct .mp4/.webm link',
    };
}

module.exports = { normalizeVideoUrl };
