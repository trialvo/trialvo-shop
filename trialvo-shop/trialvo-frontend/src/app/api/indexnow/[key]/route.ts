import { indexNowKey } from "@/lib/seo/indexnow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Ownership verification file for IndexNow. The crawler fetches the
 * `keyLocation` URL and expects the body to be exactly the key.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const key = indexNowKey();
  const requested = (await params).key.replace(/\.txt$/i, "");

  if (!key || requested !== key) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
