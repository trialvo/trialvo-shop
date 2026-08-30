const { getFrontendUrl } = require('../config/publicUrls');

/**
 * Tells the shop frontend that catalog content changed, so it can drop its
 * cached sitemap/feed and ping the search engines that support instant
 * indexing. Best-effort by design: a failure here must never break an admin
 * write, so errors are logged and swallowed.
 */
function seoEndpoint() {
    return `${getFrontendUrl()}/api/indexnow`;
}

function isEnabled() {
    return Boolean(process.env.SEO_REVALIDATE_SECRET);
}

/**
 * @param {{ slugs?: string[], paths?: string[], all?: boolean }} payload
 */
async function notifySeoChange(payload = {}) {
    if (!isEnabled()) return { skipped: true, reason: 'SEO_REVALIDATE_SECRET not set' };

    const body = {
        slugs: (payload.slugs || []).filter(Boolean),
        paths: (payload.paths || []).filter(Boolean),
        all: Boolean(payload.all),
    };

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(seoEndpoint(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-seo-secret': process.env.SEO_REVALIDATE_SECRET,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        const detail = await res.json().catch(() => null);

        if (!res.ok) {
            console.warn('[seoNotify] frontend responded %s', res.status);
            return { ok: false, status: res.status, detail };
        }
        return { ok: true, status: res.status, detail };
    } catch (error) {
        console.warn('[seoNotify] failed:', error.message);
        return { ok: false, error: error.message };
    }
}

/** Fire and forget — callers should not await this on the request path. */
function notifySeoChangeAsync(payload = {}) {
    notifySeoChange(payload).catch(() => {});
}

module.exports = { notifySeoChange, notifySeoChangeAsync, isEnabled };
