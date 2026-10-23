import { render } from "@testing-library/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { router } from "@/test/router-mock";

import { AuthProvider } from "@/components/auth-provider";

export const push = router.push;

/** Respostas da API por "MÉTODO caminho"; registra cada chamada. */
export function fakeApi(routes: Record<string, () => Response>) {
  const calls: Array<{ key: string; body: unknown }> = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const key = `${init.method ?? "GET"} ${url}`;
      calls.push({ key, body: init.body ? JSON.parse(init.body as string) : undefined });
      if (key === "GET /api/auth/csrf/") document.cookie = "csrftoken=t; path=/";
      const route = routes[key];
      return route ? route() : json(403, { detail: "Não autenticado." });
    }),
  );
  return calls;
}

export function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export function renderWithProviders(ui: ReactNode) {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light">
      <AuthProvider>{ui}</AuthProvider>
    </ThemeProvider>,
  );
}
