import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { api } from "@/lib/api";
import { fakeApi, json, renderWithProviders } from "@/test/render";

import { useAuth } from "./auth-provider";

function Who() {
  const { user, loading, expired, logout } = useAuth();
  if (loading) return null;
  return (
    <>
      <p>{user ? user.email : expired ? "sessão expirou" : "visitante"}</p>
      <button onClick={() => logout().catch(() => {})}>Sair</button>
    </>
  );
}

describe("AuthProvider", () => {
  it("um 401 em qualquer chamada desloga e marca a sessão como expirada", async () => {
    fakeApi({
      "GET /api/auth/me/": () => json(200, { id: 1, email: "ana@example.com", role: "bidder" }),
      "GET /api/wallet/": () => json(401, { detail: "As credenciais de autenticação não foram fornecidas." }),
    });
    renderWithProviders(<Who />);
    expect(await screen.findByText("ana@example.com")).toBeInTheDocument();

    await act(() => api("/api/wallet/").catch(() => {}));

    expect(screen.getByText("sessão expirou")).toBeInTheDocument();
  });

  it("sair com a sessão já vencida não mostra o aviso de sessão expirada", async () => {
    fakeApi({
      "GET /api/auth/me/": () => json(200, { id: 1, email: "ana@example.com", role: "bidder" }),
      "POST /api/auth/logout/": () => json(401, {}),
    });
    renderWithProviders(<Who />);
    expect(await screen.findByText("ana@example.com")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Sair" }));

    expect(await screen.findByText("visitante")).toBeInTheDocument();
  });

  it("visitante que recebe 401 continua visitante, sem aviso de sessão expirada", async () => {
    fakeApi({ "GET /api/wallet/": () => json(401, {}) });
    renderWithProviders(<Who />);
    expect(await screen.findByText("visitante")).toBeInTheDocument();

    await act(() => api("/api/wallet/").catch(() => {}));

    expect(screen.getByText("visitante")).toBeInTheDocument();
  });
});
