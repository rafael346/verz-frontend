import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { fakeApi, json, renderWithProviders } from "@/test/render";

import { MyBids } from "./my-bids";

const BIDDER = { id: 2, email: "ana@example.com", role: "bidder" };
const HOUR = 3_600_000;

const lot = (id: number, overrides: Record<string, unknown>) => ({
  id,
  title: `Obra ${id}`,
  artist: "Artista",
  date: "",
  medium: "",
  dimensions: "",
  culture: "",
  department: "",
  source_url: "",
  image_url: `/api/lots/${id}/image/`,
  starting_bid: "100.00",
  min_increment: "10.00",
  starts_at: new Date(Date.now() - 2 * HOUR).toISOString(),
  ends_at: new Date(Date.now() + HOUR).toISOString(),
  phase: "live",
  current_bid: "200.00",
  bid_count: 3,
  min_next_bid: "210.00",
  receipt_token: null,
  ...overrides,
});

const page = (results: unknown[]) => ({ count: results.length, next: null, previous: null, results });

describe("MyBids", () => {
  it("visitante é convidado a entrar", async () => {
    fakeApi({ "GET /api/auth/me/": () => new Response(null, { status: 204 }) });
    renderWithProviders(<MyBids />);
    expect(await screen.findByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/entrar");
  });

  it("separa lotes em disputa e encerrados, com o comprovante do arremate", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    fakeApi({
      "GET /api/auth/me/": () => json(200, BIDDER),
      "GET /api/lots/participating/": () =>
        json(
          200,
          page([
            lot(1, { my_status: "winning" }),
            lot(2, { my_status: "outbid" }),
            lot(3, { my_status: "won", phase: "ended", current_bid: "900.00", receipt_token: "tok-3", ends_at: new Date(Date.now() - HOUR).toISOString() }),
            lot(4, { my_status: "lost", phase: "ended", ends_at: new Date(Date.now() - HOUR).toISOString() }),
            lot(5, { my_status: "won", phase: "ended", receipt_token: null, ends_at: new Date(Date.now() - 1000).toISOString() }),
          ]),
        ),
    });
    renderWithProviders(<MyBids />);

    const open = within(await screen.findByRole("region", { name: "Em disputa" }));
    expect(open.getByText("Você está ganhando")).toBeInTheDocument();
    expect(open.getByText("Você foi superado")).toBeInTheDocument();
    expect(open.getAllByRole("link", { name: /Ir para a sala/ })[0]).toHaveAttribute("href", "/lotes/1");

    const ended = within(screen.getByRole("region", { name: "Encerrados" }));
    expect(ended.getByText("Arrematado por R$ 900,00")).toBeInTheDocument();
    expect(ended.getByText("Não arrematado")).toBeInTheDocument();
    expect(ended.getByText("Emitindo o comprovante…")).toBeInTheDocument();
    expect(ended.getByRole("link", { name: "Ver comprovante" })).toHaveAttribute("href", "/comprovante/tok-3");

    await userEvent.click(ended.getByRole("button", { name: "Copiar link do comprovante" }));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/comprovante/tok-3`);
    expect(await ended.findByText("Link copiado")).toBeInTheDocument();
  });

  it("sem participação, aponta para a vitrine", async () => {
    fakeApi({
      "GET /api/auth/me/": () => json(200, BIDDER),
      "GET /api/lots/participating/": () => json(200, page([])),
    });
    renderWithProviders(<MyBids />);
    expect(await screen.findByRole("link", { name: "Ver lotes ao vivo" })).toHaveAttribute("href", "/lotes");
  });
});
