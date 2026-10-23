import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { fakeApi, json, renderWithProviders } from "@/test/render";

import { SellerDashboard } from "./dashboard";

const SELLER = { id: 1, email: "leo@example.com", role: "seller" };

const lot = (overrides: Record<string, unknown>) => ({
  id: 5,
  title: "Girassóis",
  artist: "Vincent van Gogh",
  date: "1887",
  medium: "",
  dimensions: "",
  culture: "",
  department: "",
  source_url: "",
  image_url: "/api/lots/5/image/",
  starting_bid: "100.00",
  min_increment: "10.00",
  starts_at: "2026-10-24T12:00:00Z",
  ends_at: "2026-10-25T12:00:00Z",
  phase: "scheduled",
  current_bid: null,
  bid_count: 0,
  min_next_bid: "100.00",
  external_id: 436524,
  status: "open",
  created_at: "2026-10-23T12:00:00Z",
  result: null,
  ...overrides,
});

const page = (results: unknown[]) => ({ count: results.length, next: null, previous: null, results });

const ITEM = {
  external_id: 436524,
  title: "Sunflowers",
  artist: "Vincent van Gogh",
  date: "1887",
  medium: "Oil on canvas",
  dimensions: "17 x 24 in.",
  culture: "",
  department: "European Paintings",
  image_url: "https://images.metmuseum.org/a.jpg",
  source_url: "https://www.metmuseum.org/art/collection/search/436524",
};

function sellerApi(extra: Record<string, () => Response> = {}, lots: unknown[] = []) {
  return fakeApi({
    "GET /api/auth/me/": () => json(200, SELLER),
    "GET /api/lots/mine/summary/": () => json(200, { total_received: "300.00", sold: 2, unsold: 1 }),
    "GET /api/lots/mine/": () => json(200, page(lots)),
    ...extra,
  });
}

describe("SellerDashboard", () => {
  it("visitante é convidado a entrar", async () => {
    fakeApi({});
    renderWithProviders(<SellerDashboard />);

    expect(await screen.findByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/entrar");
  });

  it("licitante vê que o painel é de leiloeiros", async () => {
    fakeApi({ "GET /api/auth/me/": () => json(200, { ...SELLER, role: "bidder" }) });
    renderWithProviders(<SellerDashboard />);

    expect(await screen.findByText(/painel é para leiloeiros/)).toBeInTheDocument();
  });

  it("mostra o total recebido e o resultado de cada lote", async () => {
    sellerApi({}, [
      lot({ id: 7, title: "Vendido", phase: "ended", status: "settled", current_bid: "300.00", bid_count: 2, result: { sold: true, amount: "300.00" } }),
      lot({ id: 8, title: "Sem procura", phase: "ended", status: "settled", result: { sold: false, amount: null } }),
      lot({ id: 9, title: "Fechando", phase: "ended", status: "open", current_bid: "50.00", bid_count: 1 }),
    ]);
    renderWithProviders(<SellerDashboard />);

    expect(await screen.findByText("R$ 300,00", { selector: "[data-summary] *" })).toBeInTheDocument();
    const rows = await screen.findAllByRole("listitem");
    expect(within(rows[0]).getByText("Arrematado por R$ 300,00")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Encerrado sem lances")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Aguardando liquidação")).toBeInTheDocument();
  });

  it("busca no acervo e cria um lote com valores e horários normalizados", async () => {
    const calls = sellerApi({
      "GET /api/catalog/search/?q=sunflowers&offset=0": () => json(200, { total: 1, next_offset: null, items: [ITEM] }),
      "POST /api/lots/": () => json(201, lot({ id: 12, title: "Sunflowers" })),
    });
    renderWithProviders(<SellerDashboard />);

    await userEvent.type(await screen.findByRole("searchbox", { name: "Buscar no acervo do Met" }), "sunflowers");
    await userEvent.click(screen.getByRole("button", { name: "Buscar obras" }));
    await userEvent.click(await screen.findByRole("button", { name: /Escolher Sunflowers/ }));

    const form = screen.getByRole("form", { name: "Condições do lote" });
    expect(within(form).getByText("Oil on canvas")).toBeInTheDocument();
    await userEvent.type(within(form).getByLabelText("Lance inicial"), "1.250,50");
    await userEvent.type(within(form).getByLabelText("Incremento mínimo"), "50");
    // O seletor de data do navegador entrega o valor inteiro de uma vez.
    fireEvent.change(within(form).getByLabelText("Início"), { target: { value: "2030-01-10T10:00" } });
    await userEvent.click(within(form).getByRole("button", { name: "1 dia" }));
    expect(within(form).getByLabelText("Fim")).toHaveValue("2030-01-11T10:00");
    await userEvent.click(within(form).getByRole("button", { name: "Criar lote" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Lote 012 criado");
    expect(calls.find((c) => c.key === "POST /api/lots/")?.body).toEqual({
      external_id: 436524,
      starting_bid: "1250.50",
      min_increment: "50.00",
      starts_at: new Date(2030, 0, 10, 10, 0).toISOString(),
      ends_at: new Date(2030, 0, 11, 10, 0).toISOString(),
    });
    await waitFor(() => expect(calls.filter((c) => c.key === "GET /api/lots/mine/").length).toBeGreaterThan(1));
  });

  it("valor inválido é explicado antes de chamar o servidor", async () => {
    const calls = sellerApi({
      "GET /api/catalog/search/?q=sunflowers&offset=0": () => json(200, { total: 1, next_offset: null, items: [ITEM] }),
    });
    renderWithProviders(<SellerDashboard />);

    await userEvent.type(await screen.findByRole("searchbox", { name: "Buscar no acervo do Met" }), "sunflowers");
    await userEvent.click(screen.getByRole("button", { name: "Buscar obras" }));
    await userEvent.click(await screen.findByRole("button", { name: /Escolher Sunflowers/ }));
    await userEvent.type(screen.getByLabelText("Lance inicial"), "dez reais");
    await userEvent.click(screen.getByRole("button", { name: "Criar lote" }));

    expect(screen.getByLabelText("Lance inicial")).toHaveAccessibleDescription(/Informe um valor em reais/);
    expect(calls.some((c) => c.key === "POST /api/lots/")).toBe(false);
  });

  it("mostra o erro do servidor junto ao campo", async () => {
    sellerApi({
      "GET /api/catalog/search/?q=sunflowers&offset=0": () => json(200, { total: 1, next_offset: null, items: [ITEM] }),
      "POST /api/lots/": () => json(400, { starts_at: ["O início não pode estar no passado."] }),
    });
    renderWithProviders(<SellerDashboard />);

    await userEvent.type(await screen.findByRole("searchbox", { name: "Buscar no acervo do Met" }), "sunflowers");
    await userEvent.click(screen.getByRole("button", { name: "Buscar obras" }));
    await userEvent.click(await screen.findByRole("button", { name: /Escolher Sunflowers/ }));
    await userEvent.type(screen.getByLabelText("Lance inicial"), "100");
    await userEvent.type(screen.getByLabelText("Incremento mínimo"), "10");
    await userEvent.click(screen.getByRole("button", { name: "Criar lote" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Início")).toHaveAccessibleDescription("O início não pode estar no passado."),
    );
  });

  it("acervo indisponível vira uma mensagem clara", async () => {
    sellerApi({
      "GET /api/catalog/search/?q=cat&offset=0": () => json(503, { detail: "O catálogo do museu está indisponível no momento." }),
    });
    renderWithProviders(<SellerDashboard />);

    await userEvent.type(await screen.findByRole("searchbox", { name: "Buscar no acervo do Met" }), "cat");
    await userEvent.click(screen.getByRole("button", { name: "Buscar obras" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("indisponível");
  });

  it("cancela um lote sem lances em dois passos", async () => {
    const calls = sellerApi(
      { "POST /api/lots/5/cancel/": () => json(200, lot({ status: "cancelled" })) },
      [lot({})],
    );
    renderWithProviders(<SellerDashboard />);

    await userEvent.click(await screen.findByRole("button", { name: "Cancelar lote" }));
    expect(calls.some((c) => c.key === "POST /api/lots/5/cancel/")).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "Sim, cancelar" }));

    await waitFor(() => expect(calls.some((c) => c.key === "POST /api/lots/5/cancel/")).toBe(true));
  });

  it("não oferece cancelar lote com lances", async () => {
    sellerApi({}, [lot({ phase: "live", current_bid: "120.00", bid_count: 2 })]);
    renderWithProviders(<SellerDashboard />);

    await screen.findByText("Girassóis");
    expect(screen.queryByRole("button", { name: "Cancelar lote" })).not.toBeInTheDocument();
  });

  it("mostra quando o cancelamento é recusado", async () => {
    sellerApi(
      { "POST /api/lots/5/cancel/": () => json(400, { detail: "Lote com lances não pode ser cancelado." }) },
      [lot({})],
    );
    renderWithProviders(<SellerDashboard />);

    await userEvent.click(await screen.findByRole("button", { name: "Cancelar lote" }));
    await userEvent.click(screen.getByRole("button", { name: "Sim, cancelar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Lote com lances não pode ser cancelado.");
  });
});
