// @vitest-environment node
import { describe, expect, it } from "vitest";

import { backendHeaders } from "./server-api";

describe("backendHeaders", () => {
  it("repassa o IP do visitante e a sessão: logado conta no limite por conta, não no do IP", () => {
    expect(backendHeaders("203.0.113.7", "abc123")).toEqual({
      Accept: "application/json",
      "X-Forwarded-For": "203.0.113.7",
      Cookie: "sessionid=abc123",
    });
  });

  it("visitante sem sessão vai sem cookie", () => {
    expect(backendHeaders(null, undefined)).toEqual({ Accept: "application/json" });
  });
});
