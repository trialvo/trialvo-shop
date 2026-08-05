import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");

  if (!target) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json(
      { error: "Unsupported protocol" },
      { status: 400 },
    );
  }

  const res = await fetch(parsed.toString(), { cache: "no-store" });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: res.status },
    );
  }

  const contentType =
    res.headers.get("content-type") || "application/octet-stream";
  const body = await res.arrayBuffer();

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
    },
  });
}
