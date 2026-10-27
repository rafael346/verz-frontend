// @vitest-environment node
import { getRewrittenUrl, isRewrite } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { proxy } from "./proxy";

function cspFor(mode: "production" | "development") {
  vi.stubEnv("NODE_ENV", mode);
  const response = proxy(new NextRequest("http://localhost/entrar"));
  const csp = response.headers.get("Content-Security-Policy") ?? "";
  return Object.fromEntries(csp.split("; ").map((rule) => [rule.split(" ")[0], rule]));
}

afterEach(() => vi.unstubAllEnvs());

describe("CSP", () => {
  it("em produção só roda script e estilo com o nonce da requisição", () => {
    const csp = cspFor("production");

    expect(csp["script-src"]).toMatch(/'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(csp["style-src"]).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
    expect(Object.values(csp).join(";")).not.toMatch(/unsafe-inline|unsafe-eval/);
    expect(csp["frame-ancestors"]).toBe("frame-ancestors 'none'");
    expect(csp["object-src"]).toBe("object-src 'none'");
    // Prévia das obras na busca do painel vem direto do Met; nenhum outro host externo.
    expect(csp["img-src"]).toBe("img-src 'self' blob: data: https://images.metmuseum.org");
  });

  it("gera um nonce novo a cada requisição", () => {
    expect(cspFor("production")["script-src"]).not.toBe(cspFor("production")["script-src"]);
  });

  it("em desenvolvimento libera o que o next dev precisa", () => {
    const csp = cspFor("development");

    expect(csp["script-src"]).toContain("'unsafe-eval'");
    expect(csp["style-src"]).toBe("style-src 'self' 'unsafe-inline'");
  });
});

describe("/api/ na Vercel (D36)", () => {
  it("leva à API com o segredo do proxy, sobrescrevendo o que o visitante mandar", () => {
    vi.stubEnv("BACKEND_URL", "https://api.exemplo");
    vi.stubEnv("PROXY_SECRET", "segredo-do-front");
    const request = new NextRequest("https://front.exemplo/api/auth/me/?a=1", { headers: { "X-Verz-Proxy": "do-atacante" } });

    const response = proxy(request);

    expect(isRewrite(response)).toBe(true);
    expect(getRewrittenUrl(response)).toBe("https://api.exemplo/api/auth/me/?a=1");
    expect(response.headers.get("x-middleware-request-x-verz-proxy")).toBe("segredo-do-front");
  });

  it("sem BACKEND_URL (Compose, onde o nginx leva /api/) não reescreve", () => {
    expect(isRewrite(proxy(new NextRequest("http://localhost/api/auth/me/")))).toBe(false);
  });
});
