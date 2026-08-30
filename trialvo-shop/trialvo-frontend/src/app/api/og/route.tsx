import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

export const runtime = "nodejs";

// ImageResponse sets Content-Type itself; a `contentType` export is only valid
// in the opengraph-image file convention, not in a route handler.
const SIZE = { width: 1200, height: 630 };

/**
 * Branded Open Graph card. Latin-only copy on purpose: embedding a Bangla font
 * in the image renderer is not worth the payload, and unsupported glyphs would
 * render as boxes.
 */
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #1d2124 0%, #23292e 55%, #1d3a2c 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#1DBF73",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            T
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>
            {BRAND.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -2,
              maxWidth: 940,
            }}
          >
            Ready-made ecommerce websites with full source code
          </div>
          <div style={{ fontSize: 30, color: "#b9c2c7", maxWidth: 900 }}>
            Admin panel + storefront. One-time payment, lifetime license,
            lifetime support and updates.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {["Live trial before you buy", "Full source code", "Lifetime support"].map(
            (item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 24,
                  color: "#e6eaec",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: "#1DBF73",
                  }}
                />
                {item}
              </div>
            ),
          )}
        </div>
      </div>
    ),
    SIZE,
  );
}
