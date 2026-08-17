import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Techshop — Premium Tech Accessories & Gadgets in Bangladesh";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, hsl(217,91%,15%), hsl(217,91%,35%))",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, hsl(217,91%,30%), hsl(217,91%,50%))",
              fontSize: "48px",
              fontWeight: 900,
              color: "white",
            }}
          >
            S
          </div>
          <span
            style={{
              fontSize: "52px",
              fontWeight: 800,
              color: "white",
              letterSpacing: "-1px",
            }}
          >
            Techshop
          </span>
        </div>
        <p
          style={{
            fontSize: "28px",
            color: "rgba(255,255,255,0.7)",
            maxWidth: "700px",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Premium Tech Accessories & Gadgets in Bangladesh
        </p>
        <div
          style={{
            display: "flex",
            gap: "32px",
            marginTop: "40px",
          }}
        >
          {["✓ 100% Authentic", "✓ Fast Delivery", "✓ COD Available", "✓ Warranty"].map(
            (text) => (
              <span
                key={text}
                style={{
                  fontSize: "18px",
                  color: "rgba(255,255,255,0.6)",
                  background: "rgba(255,255,255,0.1)",
                  padding: "8px 16px",
                  borderRadius: "8px",
                }}
              >
                {text}
              </span>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
