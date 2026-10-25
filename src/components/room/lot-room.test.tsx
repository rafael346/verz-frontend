import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fakeApi, json, renderWithProviders } from "@/test/render";

import { LotRoom } from "./lot-room";

class FakeEventSource {
  static CLOSED = 2;
  static last: FakeEventSource | null = null;
  readyState = 1;
  listeners = new Map<string, Array<(event: MessageEvent) => void>>();
  closed = false;
  constructor(readonly url: string) {
    FakeEventSource.last = this;
  }
  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  close() {
    this.closed = true;
  }
  emit(type: string, data: unknown) {
    act(() => this.listeners.get(type)?.forEach((listener) => listener(new MessageEvent(type, { data: JSON.stringify(data) }))));
  }
}

const HOUR = 3_600_000;
const BIDDER = { id: 2, email: "ana@example.com", role: "bidder" };

const lot = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  title: "Girassóis",
  artist: "Vincent van Gogh",
  date: "1887",
  medium: "Óleo sobre tela",
  dimensions: "",
  culture: "",
  department: "",
  source_url: "https://www.metmuseum.org/art/collection/search/436524",
  image_url: "/api/lots/7/image/",
  starting_bid: "1000.00",
  min_increment: "50.00",
  starts_at: new Date(Date.now() - HOUR).toISOString(),
  ends_at: new Date(Date.now() + HOUR).toISOString(),
  phase: "live",
  current_bid: "1000.00",
  bid_count: 1,
  min_next_bid: "1050.00",
  ...overrides,
});

const bid = (sequence: number, amount: string, alias = "Licitante B7") => ({
  sequence,
  bidder_alias: alias,
  amount,
  created_at: new Date().toISOString(),
  hash: `h${sequence}`,
  is_you: false,
});

const page = (results: unknown[]) => ({ count: results.length, next: null, previous: null, results });
const standing = (status: string, position: number | null) => ({ status, position, bidders: 2, alias: "Licitante A1" });

function renderRoom() {
  return renderWithProviders(<LotRoom initialLot={lot() as never} initialBids={page([bid(1, "1000.00")]) as never} />);
}

beforeEach(() => {
  vi.stubGlobal("EventSource", FakeEventSource);
});

afterEach(() => {
  FakeEventSource.last = null;
});

describe("LotRoom", () => {
  it("visitante vê o lote, o histórico e o convite para entrar", async () => {
    fakeApi({ "GET /api/auth/me/": () => new Response(null, { status: 204 }) });
    renderRoom();

    expect(screen.getByRole("heading", { level: 1, name: "Girassóis" })).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Histórico de lances" })).getAllByRole("listitem")).toHaveLength(1);
    expect(await screen.findByRole("link", { name: "Entre para dar lances" })).toHaveAttribute("href", "/entrar");
    expect(FakeEventSource.last?.url).toBe("/api/lots/7/events/");
  });

  it("leiloeiro acompanha, mas não dá lances", async () => {
    fakeApi({ "GET /api/auth/me/": () => json(200, { id: 1, email: "leo@example.com", role: "seller" }) });
    renderRoom();

    expect(await screen.findByText(/Leiloeiros acompanham/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dar lance" })).not.toBeInTheDocument();
  });

  it("licitante dá lance e passa a ganhar, sem recarregar", async () => {
    let mine = standing("outbid", 2);
    const calls = fakeApi({
      "GET /api/auth/me/": () => json(200, BIDDER),
      "GET /api/lots/7/": () => json(200, { ...lot(), me: mine }),
      "GET /api/wallet/": () => json(200, { balance: "5000.00", committed: "0.00", available: "5000.00" }),
      "POST /api/lots/7/bids/": () => {
        mine = standing("winning", 1);
        return json(201, {
          bid: { ...bid(2, "1100.00", "Licitante A1"), is_you: true },
          lot: lot({ current_bid: "1100.00", bid_count: 2, min_next_bid: "1150.00" }),
        });
      },
    });
    renderRoom();

    expect(await screen.findByText("Você foi superado")).toBeInTheDocument();
    expect(screen.getByText(/2º de 2 licitantes/)).toBeInTheDocument();
    expect(await screen.findByText("R$ 5.000,00")).toBeInTheDocument();
    const amount = screen.getByLabelText("Seu lance");
    expect(amount).toHaveValue("1.050,00");

    await userEvent.clear(amount);
    await userEvent.type(amount, "1.100");
    await userEvent.click(screen.getByRole("button", { name: "Dar lance" }));

    await waitFor(() => expect(calls.find((c) => c.key === "POST /api/lots/7/bids/")?.body).toEqual({ amount: "1100.00" }));
    expect(await screen.findByText("Você está ganhando")).toBeInTheDocument();
    const history = within(screen.getByRole("list", { name: "Histórico de lances" }));
    expect(history.getAllByRole("listitem")).toHaveLength(2);
    expect(history.getByText("Você")).toBeInTheDocument();
    expect(screen.getByLabelText("Seu lance")).toHaveValue("1.150,00");
  });

  it("lance recusado mostra o motivo do backend", async () => {
    const calls = fakeApi({
      "GET /api/auth/me/": () => json(200, BIDDER),
      "GET /api/lots/7/": () => json(200, { ...lot(), me: standing("none", null) }),
      "GET /api/wallet/": () => json(200, { balance: "10.00", committed: "0.00", available: "10.00" }),
      "POST /api/lots/7/bids/": () =>
        json(400, { code: "insufficient_balance", detail: "Saldo disponível insuficiente: você tem R$ 10,00." }),
    });
    renderRoom();

    await userEvent.click(await screen.findByRole("button", { name: "Dar lance" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Saldo disponível insuficiente");
    expect(calls.filter((c) => c.key === "POST /api/lots/7/bids/")).toHaveLength(1);
  });

  it("valor inválido não chega ao backend", async () => {
    const calls = fakeApi({
      "GET /api/auth/me/": () => json(200, BIDDER),
      "GET /api/lots/7/": () => json(200, { ...lot(), me: standing("none", null) }),
      "GET /api/wallet/": () => json(200, { balance: "5000.00", committed: "0.00", available: "5000.00" }),
    });
    renderRoom();

    const amount = await screen.findByLabelText("Seu lance");
    await userEvent.clear(amount);
    await userEvent.type(amount, "mil");
    await userEvent.click(screen.getByRole("button", { name: "Dar lance" }));

    expect(screen.getByText(/Informe um valor em reais/)).toBeInTheDocument();
    expect(calls.some((c) => c.key === "POST /api/lots/7/bids/")).toBe(false);
  });

  it("lance de outra pessoa chega pelo SSE e atualiza a sala", async () => {
    fakeApi({ "GET /api/auth/me/": () => new Response(null, { status: 204 }) });
    renderRoom();

    FakeEventSource.last!.emit("bid", {
      type: "bid",
      bid: bid(2, "1200.00"),
      lot: lot({ current_bid: "1200.00", bid_count: 2, min_next_bid: "1250.00" }),
    });

    expect(screen.getAllByText("R$ 1.200,00").length).toBeGreaterThan(0);
    expect(within(screen.getByRole("list", { name: "Histórico de lances" })).getAllByRole("listitem")).toHaveLength(2);
  });

  it("ser superada pelo SSE atualiza a situação e libera o saldo comprometido", async () => {
    let mine = standing("winning", 1);
    let wallet = { balance: "5000.00", committed: "1000.00", available: "4000.00" };
    fakeApi({
      "GET /api/auth/me/": () => json(200, BIDDER),
      "GET /api/lots/7/": () => json(200, { ...lot(), me: mine }),
      "GET /api/wallet/": () => json(200, wallet),
    });
    renderRoom();
    expect(await screen.findByText("R$ 4.000,00")).toBeInTheDocument();

    mine = standing("outbid", 2);
    wallet = { balance: "5000.00", committed: "0.00", available: "5000.00" };
    FakeEventSource.last!.emit("bid", { type: "bid", bid: bid(2, "1050.00"), lot: lot({ current_bid: "1050.00", bid_count: 2 }) });

    expect(await screen.findByText("Você foi superado")).toBeInTheDocument();
    expect(await screen.findByText("R$ 5.000,00")).toBeInTheDocument();
    // Região ao vivo: o leitor de tela anuncia "superado" sem a pessoa navegar até a mensagem.
    expect(screen.getByText("Você foi superado").closest('[aria-live="polite"]')).not.toBeNull();
  });

  it("prorrogação pelo anti-sniping é avisada", async () => {
    fakeApi({ "GET /api/auth/me/": () => new Response(null, { status: 204 }) });
    renderRoom();

    FakeEventSource.last!.emit("state", { ...lot({ ends_at: new Date(Date.now() + 2 * HOUR).toISOString() }), status: "open" });

    expect(screen.getByRole("status")).toHaveTextContent(/Pregão prorrogado até/);
  });

  it("encerramento mostra o resultado e fecha o formulário", async () => {
    fakeApi({
      "GET /api/auth/me/": () => json(200, BIDDER),
      "GET /api/lots/7/": () => json(200, { ...lot(), me: standing("winning", 1) }),
      "GET /api/wallet/": () => json(200, { balance: "5000.00", committed: "1000.00", available: "4000.00" }),
    });
    renderRoom();
    await screen.findByText("Você está ganhando");

    FakeEventSource.last!.emit("closed", {
      type: "closed",
      lot: { ...lot({ ends_at: new Date(Date.now() - 1000).toISOString(), phase: "ended" }), status: "settled" },
    });

    expect(await screen.findByText("Você arrematou este lote")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Meus arremates/ })).toHaveAttribute("href", "/arremates");
    expect(screen.queryByRole("button", { name: "Dar lance" })).not.toBeInTheDocument();
  });

  it("conexão recusada pelo servidor avisa em vez de prometer reconexão", async () => {
    fakeApi({ "GET /api/auth/me/": () => new Response(null, { status: 204 }) });
    renderRoom();

    FakeEventSource.last!.readyState = FakeEventSource.CLOSED;
    FakeEventSource.last!.emit("error", {});

    expect(screen.getByText(/Tempo real indisponível/)).toBeInTheDocument();
  });

  it("lote já liquidado fecha a conexão do tempo real", async () => {
    fakeApi({ "GET /api/auth/me/": () => new Response(null, { status: 204 }) });
    renderRoom();

    FakeEventSource.last!.emit("state", { ...lot({ phase: "ended" }), status: "settled" });

    expect(FakeEventSource.last!.closed).toBe(true);
  });

  it("lote cancelado avisa e fecha o formulário", async () => {
    fakeApi({ "GET /api/auth/me/": () => new Response(null, { status: 204 }) });
    renderRoom();

    FakeEventSource.last!.emit("cancelled", {
      type: "cancelled",
      lot: { ...lot(), status: "cancelled", cancellation: { reason: "A obra foi retirada.", refunded: null, cancelled_at: new Date().toISOString() } },
    });

    expect(screen.getByText("Este lote foi cancelado pelo leiloeiro: A obra foi retirada.")).toBeInTheDocument();
    // Nada de "lance atual" nem contagem depois do cancelamento.
    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(["Último lance", "Cancelado"]);
    expect(screen.queryByRole("button", { name: "Dar lance" })).not.toBeInTheDocument();
  });
});
