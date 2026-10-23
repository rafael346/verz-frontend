import type { NextConfig } from "next";

// Sem rewrites para a API: quem leva /api/ ao Django é o nginx (D21). O proxy do Next segurava o SSE e
// repassava o X-Forwarded-For do cliente sem o IP real.
// Sem cacheComponents/partialPrefetching: a CSP com nonce (src/proxy.ts) exige renderização dinâmica.
const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
