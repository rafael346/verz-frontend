import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { fakeApi, json, renderWithProviders } from "@/test/render";

import { WalletPanel } from "./wallet-panel";

const BIDDER = { id: 2, email: "ana@example.com", role: "bidder" };

describe("WalletPanel", () => {
  it("visitante é convidado a entrar; leiloeiro vê que a carteira é de licitantes", async () => {
    fakeApi({ "GET /api/auth/me/": () => new Response(null, { status: 204 }) });
    const { unmount } = renderWithProviders(<WalletPanel />);
    expect(await screen.findByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/entrar");
    unmount();

    fakeApi({ "GET /api/auth/me/": () => json(200, { id: 1, email: "leo@example.com", role: "seller" }) });
    renderWithProviders(<WalletPanel />);
    expect(await screen.findByText(/carteira é para licitantes/)).toBeInTheDocument();
  });

  it("mostra total, comprometido e disponível, e deposita", async () => {
    let balance = { balance: "1000.00", committed: "300.00", available: "700.00" };
    const calls = fakeApi({
      "GET /api/auth/me/": () => json(200, BIDDER),
      "GET /api/wallet/": () => json(200, balance),
      "POST /api/wallet/deposit/": () => {
        balance = { balance: "1250.50", committed: "300.00", available: "950.50" };
        return json(201, balance);
      },
    });
    renderWithProviders(<WalletPanel />);

    const summary = await screen.findByRole("region", { name: "Saldo" });
    await waitFor(() => expect(summary).toHaveTextContent("R$ 1.000,00"));
    expect(summary).toHaveTextContent("R$ 300,00");
    expect(summary).toHaveTextContent("R$ 700,00");

    await userEvent.type(screen.getByLabelText("Valor do depósito"), "250,50");
    await userEvent.click(screen.getByRole("button", { name: "Depositar" }));

    await waitFor(() => expect(calls.find((c) => c.key === "POST /api/wallet/deposit/")?.body).toEqual({ amount: "250.50" }));
    expect(await within(summary).findByText("R$ 950,50")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Depósito de R$ 250,50 feito");
  });

  it("atalho preenche o valor; valor inválido não é enviado", async () => {
    const calls = fakeApi({
      "GET /api/auth/me/": () => json(200, BIDDER),
      "GET /api/wallet/": () => json(200, { balance: "0.00", committed: "0.00", available: "0.00" }),
    });
    renderWithProviders(<WalletPanel />);

    await userEvent.click(await screen.findByRole("button", { name: "R$ 500" }));
    expect(screen.getByLabelText("Valor do depósito")).toHaveValue("500,00");

    await userEvent.clear(screen.getByLabelText("Valor do depósito"));
    await userEvent.type(screen.getByLabelText("Valor do depósito"), "0");
    await userEvent.click(screen.getByRole("button", { name: "Depositar" }));
    expect(screen.getByText(/entre R\$ 1,00 e R\$ 100.000,00/)).toBeInTheDocument();
    expect(calls.some((c) => c.key === "POST /api/wallet/deposit/")).toBe(false);
  });
});
