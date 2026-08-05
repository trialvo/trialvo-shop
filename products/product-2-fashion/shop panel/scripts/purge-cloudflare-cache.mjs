const zoneId = process.env.CLOUDFLARE_ZONE_ID?.trim();
const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://graduatefashionbd.com").replace(/\/+$/, "");

if (!zoneId || !apiToken) {
  console.error(
    "Missing CLOUDFLARE_ZONE_ID or CLOUDFLARE_API_TOKEN. Skipping Cloudflare purge."
  );
  process.exit(1);
}

const endpoint = `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`;

// Only purge HTML pages — preserve cached images, CSS, JS (they have hashed URLs)
const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prefixes: [
      `${siteUrl}/`,    // All HTML pages
    ],
  }),
});

const payload = await response.json().catch(() => null);

if (!response.ok || !payload?.success) {
  const authError = Array.isArray(payload?.errors)
    ? payload.errors.some((e) => e?.code === 10000)
    : false;

  if (authError) {
    console.error(
      "Cloudflare token does not have purge permission. Add `Zone > Cache Purge > Purge` for this zone."
    );
  }

  // Fallback: if prefix purge fails (free plan), try purging everything
  console.warn("Prefix purge failed, falling back to purge_everything...");
  const fallbackRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ purge_everything: true }),
  });

  const fallbackPayload = await fallbackRes.json().catch(() => null);

  if (!fallbackRes.ok || !fallbackPayload?.success) {
    console.error("Cloudflare purge failed.", fallbackPayload ?? { status: fallbackRes.status });
    process.exit(1);
  }

  console.log("Cloudflare cache purged (full purge fallback).");
  process.exit(0);
}

console.log("Cloudflare cache purged successfully (HTML pages only, assets preserved).");
