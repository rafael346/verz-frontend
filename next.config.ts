import type { NextConfig } from "next";

// No Compose quem leva /api/ ao Django é o nginx (D21): o proxy do Next segurava o SSE e repassava o X-Forwarded-For
// do cliente sem o IP real. Na Vercel não há nginx: o rewrite abaixo (ligado só quando BACKEND_URL existe no build) faz
// o navegador ver a API no mesmo domínio do front, para o cookie de sessão valer; no Docker o build roda sem ela.
// Sem cacheComponents/partialPrefetching: a CSP com nonce (src/proxy.ts) exige renderização dinâmica.
const backendUrl = process.env.BACKEND_URL;

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // As rotas do Django terminam em "/"; sem isto o Next redireciona /api/x/ para /api/x (308) e o POST se perde.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return backendUrl ? [{ source: "/api/:path*/", destination: `${backendUrl}/api/:path*/` }] : [];
  },
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
