import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

const UPLOADS_INTERNAL_URL =
  process.env.UPLOADS_INTERNAL_URL?.trim() || "http://combobasket-api:5000";

async function proxyUpload(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const suffix = path.map(encodeURIComponent).join("/");
  const target = `${UPLOADS_INTERNAL_URL.replace(/\/+$/, "")}/uploads/${suffix}${request.nextUrl.search}`;

  try {
    const upstream = await fetch(target, { cache: "no-store" });
    const headers = new Headers();
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "transfer-encoding") {
        headers.set(key, value);
      }
    });
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch {
    return NextResponse.json({ error: "Upload proxy failed" }, { status: 502 });
  }
}

export const GET = proxyUpload;
export const HEAD = proxyUpload;
