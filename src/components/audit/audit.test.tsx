import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { shortHash, type Audit, type Receipt } from "@/lib/audit";

import { AuditReport } from "./audit-report";
import { CopyLink } from "./copy-link";
import { ReceiptCard } from "./receipt-card";

const H = (c: string) => c.repeat(64);

const audit = (overrides: Partial<Audit> = {}): Audit => ({
  lot: { id: 7, title: "Girassóis", artist: "Vincent van Gogh", status: "settled", phase: "ended", current_bid: "1100.00", bid_count: 2 } as Audit["lot"],
  intact: true,
  problems: [],
  head_hash: H("b"),
  bids: [
    { sequence: 1, bidder_alias: "Licitante #A1", amount: "1000.00", created_at: "2026-10-23T13:00:00Z", prev_hash: H("0"), hash: H("a"), valid: true },
    { sequence: 2, bidder_alias: "Licitante #B2", amount: "1100.00", created_at: "2026-10-23T13:01:00Z", prev_hash: H("a"), hash: H("b"), valid: true },
  ],
  ...overrides,
});

const receipt = (overrides: Partial<Receipt> = {}): Receipt => ({
  token: "tok-7",
  issued_at: "2026-10-23T14:00:05Z",
  amount: "1100.00",
  winner_alias: "Licitante #B2",
  head_hash: H("b"),
  lot: { id: 7, title: "Girassóis", artist: "Vincent van Gogh", image_url: "/api/lots/7/image/" },
  authentic: true,
  audit: { intact: true, head_matches: true, url: "/api/lots/7/audit/" },
  ...overrides,
});

describe("shortHash", () => {
  it("mostra o começo e o fim", () => {
    expect(shortHash("0123456789abcdef".repeat(4))).toBe("01234567…89abcdef");
  });
});

describe("AuditReport", () => {
  it("histórico íntegro: veredito, lances conferidos, hash final e dados brutos", () => {
    render(<AuditReport audit={audit()} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Histórico íntegro");
    const rows = within(screen.getByRole("list", { name: "Lances auditados" })).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("Confere")).toBeInTheDocument();
    expect(screen.getByText(H("b"))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Dados brutos/ })).toHaveAttribute("href", "/api/lots/7/audit/");
    expect(screen.getByRole("link", { name: /Voltar para a sala/ })).toHaveAttribute("href", "/lotes/7");
  });

  it("histórico adulterado: veredito, problemas e o lance alterado marcado", () => {
    const bids = audit().bids.map((bid) => (bid.sequence === 2 ? { ...bid, valid: false } : bid));
    render(<AuditReport audit={audit({ intact: false, problems: ["Lance #2 foi alterado depois de registrado."], bids })} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Histórico adulterado");
    expect(screen.getByRole("alert")).toHaveTextContent("Lance #2 foi alterado depois de registrado.");
    const rows = within(screen.getByRole("list", { name: "Lances auditados" })).getAllByRole("listitem");
    expect(within(rows[1]).getByText("Não confere")).toBeInTheDocument();
  });

  it("lote sem lances diz isso em vez de uma lista vazia", () => {
    render(<AuditReport audit={audit({ bids: [] })} />);
    expect(screen.getByText(/Nenhum lance registrado/)).toBeInTheDocument();
  });
});

describe("ReceiptCard", () => {
  it("autêntico quando as três verificações conferem", () => {
    render(<ReceiptCard origin="https://verz.example" receipt={receipt()} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Comprovante autêntico");
    const checks = within(screen.getByRole("list", { name: "Verificações" })).getAllByRole("listitem");
    expect(checks).toHaveLength(3);
    checks.forEach((check) => expect(check).toHaveTextContent("Confere"));
    expect(screen.getByText("R$ 1.100,00")).toBeInTheDocument();
    expect(screen.getByText("Licitante #B2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Auditar o histórico/ })).toHaveAttribute("href", "/lotes/7/auditoria");
    expect(screen.getByText("https://verz.example/comprovante/tok-7")).toBeInTheDocument(); // impresso
  });

  it("assinatura inválida: não é autêntico", () => {
    render(<ReceiptCard origin="https://verz.example" receipt={receipt({ authentic: false })} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Comprovante não confere");
    expect(screen.getByRole("alert")).toHaveTextContent(/assinatura/);
  });

  it("histórico divergente: aponta para a auditoria", () => {
    render(<ReceiptCard origin="https://verz.example" receipt={receipt({ audit: { intact: true, head_matches: false, url: "/api/lots/7/audit/" } })} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Comprovante não confere");
    expect(screen.getByRole("alert")).toHaveTextContent(/histórico/);
    const checks = within(screen.getByRole("list", { name: "Verificações" })).getAllByRole("listitem");
    expect(checks[2]).toHaveTextContent("Não confere");
  });
});

describe("CopyLink", () => {
  it("copia a URL absoluta e anuncia", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<CopyLink path="/comprovante/tok-7" label="Copiar link" />);

    await userEvent.click(screen.getByRole("button", { name: "Copiar link" }));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/comprovante/tok-7`);
    expect(await screen.findByRole("status")).toHaveTextContent("Link copiado");
  });

  it("sem permissão, mostra o link para copiar à mão", async () => {
    Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn().mockRejectedValue(new Error("no")) }, configurable: true });
    render(<CopyLink path="/comprovante/tok-7" label="Copiar link" />);

    await userEvent.click(screen.getByRole("button", { name: "Copiar link" }));
    expect(await screen.findByRole("status")).toHaveTextContent(`${window.location.origin}/comprovante/tok-7`);
  });
});
