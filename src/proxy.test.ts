// @vitest-environment node
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
