/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ── Images ────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // ── Security Headers ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Control referrer information sent with requests
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // HSTS — tells browsers to always use HTTPS
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Disable browser features that aren't needed
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(self)",
          },
          // XSS protection (legacy browsers)
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js requires inline scripts for hydration
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
              "style-src 'self' 'unsafe-inline'",
              // Fonts: self + Google Fonts (via next/font — same-origin after self-hosting)
              "font-src 'self' data:",
              // Images: self + API/CDN. `http://localhost:*` covers Option 1 local
              // port-mode trials (each instance gets a different API host port).
              "img-src 'self' data: blob: http://localhost:* http://127.0.0.1:* https://images.unsplash.com https://lh3.googleusercontent.com https://lifestyle-api.example.com https://cdn.lifestyle.example.com https://stylishwave-api.trialvo.com https://graduatefashion-api-641431966702.asia-south1.run.app https://storage.googleapis.com https://shop-api.shoplinkbd.com https://shop.shoplinkbd.com",
              // Allow fetch/XHR to same origin + API servers
              "connect-src 'self' http://localhost:* http://127.0.0.1:* https://accounts.google.com https://oauth2.googleapis.com https://lifestyle-api.example.com https://stylishwave-api.trialvo.com https://graduatefashion-api-641431966702.asia-south1.run.app https://storage.googleapis.com https://shop-api.shoplinkbd.com",
              "frame-src 'self' https://accounts.google.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
