import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { LoginForm } from "./login-form";
import { fakeApi, json, push, renderWithProviders } from "@/test/render";

describe("LoginForm", () => {
  it("entra com e-mail e senha e volta para a vitrine", async () => {
    const calls = fakeApi({
      "POST /api/auth/login/": () => json(200, { id: 1, email: "ana@example.com", role: "bidder" }),
    });
    renderWithProviders(<LoginForm />);

    await userEvent.type(screen.getByLabelText("E-mail"), "ana@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "senha-forte-123");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(calls.find((c) => c.key === "POST /api/auth/login/")?.body).toEqual({
      email: "ana@example.com",
      password: "senha-forte-123",
    });
  });

  it("mostra a mensagem do servidor quando o login falha", async () => {
    fakeApi({ "POST /api/auth/login/": () => json(400, { detail: "E-mail ou senha inválidos." }) });
    renderWithProviders(<LoginForm />);

    await userEvent.type(screen.getByLabelText("E-mail"), "ana@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "errada-123456");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha inválidos.");
    expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
  });

  it("desabilita o botão enquanto envia", async () => {
    let release: (r: Response) => void = () => {};
    fakeApi({ "POST /api/auth/login/": () => json(200, {}) });
    const slow = new Promise<Response>((resolve) => (release = resolve));
    const original = globalThis.fetch;
    globalThis.fetch = (async (url: string, init?: RequestInit) =>
      url === "/api/auth/login/" ? slow : original(url, init)) as typeof fetch;
    renderWithProviders(<LoginForm />);

    await userEvent.type(screen.getByLabelText("E-mail"), "ana@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "senha-forte-123");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByRole("button", { name: "Entrando…" })).toBeDisabled();
    release(json(200, { id: 1, email: "ana@example.com", role: "bidder" }));
    await waitFor(() => expect(push).toHaveBeenCalled());
  });
});
