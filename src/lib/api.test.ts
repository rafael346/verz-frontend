import { describe, expect, it, vi } from "vitest";

import { api, ApiError, SESSION_EXPIRED } from "./api";

function reply(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockFetch(...responses: Array<Response | (() => Response)>) {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => {
    const next = responses.shift();
    if (!next) throw new Error("fetch inesperado");
    return typeof next === "function" ? next() : next;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function headersOf(call: [string, RequestInit?]) {
  return new Headers(call[1]?.headers);
}

/** A promessa deve falhar; devolve o ApiError para inspeção. */
async function failure(promise: Promise<unknown>): Promise<ApiError> {
  return promise.then(
    () => {
      throw new Error("esperava falha");
    },
    (error: unknown) => error as ApiError,
  );
}

describe("api", () => {
  it("faz GET com o cookie de sessão e sem token CSRF", async () => {
    const fetchMock = mockFetch(reply(200, { ok: true }));

    await expect(api("/api/auth/me/")).resolves.toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/me/");
    expect(init?.credentials).toBe("same-origin");
    expect(headersOf(fetchMock.mock.calls[0]).has("X-CSRFToken")).toBe(false);
  });

  it("lê o cookie csrftoken a cada escrita, porque o Django o troca no login", async () => {
    const fetchMock = mockFetch(reply(200, {}), reply(200, {}));

    document.cookie = "csrftoken=antigo; path=/";
    await api("/api/auth/login/", { method: "POST", body: { email: "a@b.c" } });
    document.cookie = "csrftoken=novo; path=/";
    await api("/api/auth/logout/", { method: "POST" });

    expect(headersOf(fetchMock.mock.calls[0]).get("X-CSRFToken")).toBe("antigo");
    expect(headersOf(fetchMock.mock.calls[1]).get("X-CSRFToken")).toBe("novo");
    expect(headersOf(fetchMock.mock.calls[0]).get("Content-Type")).toBe("application/json");
    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify({ email: "a@b.c" }));
  });

  it("sem cookie CSRF, busca um antes de escrever", async () => {
    const fetchMock = mockFetch(
      () => {
        document.cookie = "csrftoken=fresco; path=/";
        return reply(200, { csrfToken: "fresco" });
      },
      reply(201, { id: 1 }),
    );

    await api("/api/auth/register/", { method: "POST", body: {} });

    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/csrf/");
    expect(headersOf(fetchMock.mock.calls[1]).get("X-CSRFToken")).toBe("fresco");
  });

  it("usa a mensagem do servidor quando há detail", async () => {
    mockFetch(reply(400, { detail: "E-mail ou senha inválidos." }));

    const error = await failure(api("/api/auth/login/"));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe("E-mail ou senha inválidos.");
  });

  it("separa erros por campo e usa non_field_errors como mensagem", async () => {
    mockFetch(reply(400, { email: ["Este e-mail já está cadastrado."], non_field_errors: ["Senha muito comum."] }));

    const error = await failure(api("/api/x/"));

    expect(error.message).toBe("Senha muito comum.");
    expect(error.fieldErrors()).toEqual({ email: "Este e-mail já está cadastrado." });
  });

  it("explica limite de tentativas, falha do servidor e falta de conexão", async () => {
    mockFetch(reply(429, { detail: "Request was throttled." }), reply(502), () => {
      throw new TypeError("Failed to fetch");
    });

    expect((await failure(api("/a/"))).message).toMatch(/Muitas tentativas/);
    expect((await failure(api("/b/"))).message).toMatch(/servidor/);
    const offline = await failure(api("/c/"));
    expect([offline.status, offline.message]).toEqual([0, expect.stringMatching(/conexão/)]);
  });

  it("em 503 usa o detail do backend; sem ele, a mensagem genérica", async () => {
    mockFetch(reply(503, { detail: "O catálogo do museu está indisponível no momento." }), reply(503));

    expect((await failure(api("/a/"))).message).toBe("O catálogo do museu está indisponível no momento.");
    expect((await failure(api("/b/"))).message).toMatch(/servidor/);
  });

  it("em 401 diz que a sessão expirou e avisa o resto da página", async () => {
    mockFetch(reply(401, { detail: "As credenciais de autenticação não foram fornecidas." }));
    const expired = vi.fn();
    window.addEventListener(SESSION_EXPIRED, expired);

    expect((await failure(api("/api/wallet/"))).message).toBe("Sua sessão expirou. Entre de novo para continuar.");
    expect(expired).toHaveBeenCalledOnce();
    window.removeEventListener(SESSION_EXPIRED, expired);
  });

  it("traduz a falha de CSRF do DRF, que vem em inglês", async () => {
    mockFetch(reply(403, { detail: "CSRF Failed: CSRF token missing." }), reply(403, { detail: "Sem permissão aqui." }));

    expect((await failure(api("/a/"))).message).toMatch(/Ative os cookies/);
    expect((await failure(api("/b/"))).message).toBe("Sem permissão aqui."); // outro 403 segue com a mensagem do backend
  });

  it("devolve null em 204", async () => {
    mockFetch(new Response(null, { status: 204 }));
    document.cookie = "csrftoken=t; path=/";

    await expect(api("/api/auth/logout/", { method: "POST" })).resolves.toBeNull();
  });
});
