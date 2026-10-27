import { NextResponse, type NextRequest } from "next/server";

/**
 * Na Vercel (D35, D36): /api/ vai ao Django no mesmo domínio do front, para o cookie de sessão valer, com o segredo
 * que prova à API que a requisição passou por aqui. No Compose o nginx leva /api/ antes de chegar ao Next.
 */
function proxyToBackend(request: NextRequest, backendUrl: string) {
  const headers = new Headers(request.headers);
  const secret = process.env.PROXY_SECRET;
  if (secret) headers.set("X-Verz-Proxy", secret);
  const target = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, backendUrl);
  return NextResponse.rewrite(target, { request: { headers } });
}

/** CSP com nonce por requisição (OWASP; guia oficial do Next 16): nenhum script inline sem o nonce roda. */
export function proxy(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL;
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return backendUrl ? proxyToBackend(request, backendUrl) : NextResponse.next();
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const dev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    // 'unsafe-eval' só em desenvolvimento: o React usa eval para mostrar a pilha de erros do servidor.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // Em desenvolvimento o Next injeta estilos inline sem nonce (e, com nonce presente, 'unsafe-inline' é ignorado).
    `style-src 'self' ${dev ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    "img-src 'self' blob: data: https://images.metmuseum.org",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
