import { NextResponse } from "next/server";
import { detectCountryFromRequest } from "@/lib/phone/detectCountry";

export const dynamic = "force-dynamic";

/**
 * GET /api/geo/country — ISO2 country for phone input defaults.
 */
export async function GET(request: Request) {
  const result = await detectCountryFromRequest(request.headers);
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "private, max-age=300",
    },
  });
}
