import type { NextConfig } from "next";

// No Compose quem leva /api/ ao Django é o nginx (D21). Na Vercel quem leva é o src/proxy.ts (D35, D36).
// Sem cacheComponents/partialPrefetching: a CSP com nonce (src/proxy.ts) exige renderização dinâmica.
const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // As rotas do Django terminam em "/"; sem isto o Next redireciona /api/x/ para /api/x (308) e o POST se perde.
  skipTrailingSlashRedirect: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Atrás de TLS, o navegador passa a recusar http para o site (OWASP A02); em http puro ele ignora.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
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
