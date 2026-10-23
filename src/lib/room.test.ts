import { describe, expect, it } from "vitest";

import type { Lot } from "./lots";
import { applyEvent, phaseAt, type Bid, type RoomState } from "./room";

const LOT = {
  id: 7,
  starts_at: "2026-10-23T12:00:00Z",
  ends_at: "2026-10-23T14:00:00Z",
  phase: "live",
  current_bid: "1000.00",
  bid_count: 1,
  min_next_bid: "1050.00",
  status: "open",
} as unknown as RoomState["lot"];

const bid = (sequence: number, amount: string): Bid => ({
  sequence,
  bidder_alias: `Licitante ${sequence}`,
  amount,
  created_at: "2026-10-23T13:00:00Z",
  hash: `h${sequence}`,
});

const start: RoomState = { lot: LOT, bids: [bid(1, "1000.00")] };

describe("applyEvent", () => {
  it("estado novo substitui o lote e mantém o histórico", () => {
    const next = applyEvent(start, { type: "state", lot: { ...LOT, ends_at: "2026-10-23T14:02:00Z" } });
    expect(next.lot.ends_at).toBe("2026-10-23T14:02:00Z");
    expect(next.bids).toHaveLength(1);
  });

  it("lance novo entra no topo e atualiza o lote", () => {
    const next = applyEvent(start, { type: "bid", bid: bid(2, "1050.00"), lot: { ...LOT, current_bid: "1050.00", bid_count: 2 } });
    expect(next.bids.map((b) => b.sequence)).toEqual([2, 1]);
    expect(next.lot.current_bid).toBe("1050.00");
  });

  it("lance repetido (POST e SSE) entra uma vez só", () => {
    const once = applyEvent(start, { type: "bid", bid: bid(2, "1050.00") });
    expect(applyEvent(once, { type: "bid", bid: bid(2, "1050.00") }).bids).toHaveLength(2);
  });

  it("lance retomado fora de ordem fica na posição certa", () => {
    const withThree = applyEvent(start, { type: "bid", bid: bid(3, "1100.00") });
    expect(applyEvent(withThree, { type: "bid", bid: bid(2, "1050.00") }).bids.map((b) => b.sequence)).toEqual([3, 2, 1]);
  });

  it("lance sem lote junto (retomada) não apaga o lote", () => {
    expect(applyEvent(start, { type: "bid", bid: bid(2, "1050.00") }).lot).toBe(LOT);
  });

  it("encerramento e cancelamento trazem o status novo", () => {
    expect(applyEvent(start, { type: "closed", lot: { ...LOT, status: "settled" } }).lot.status).toBe("settled");
    expect(applyEvent(start, { type: "cancelled", lot: { ...LOT, status: "cancelled" } }).lot.status).toBe("cancelled");
  });
});

describe("phaseAt", () => {
  const lot = LOT as unknown as Lot;
  it("segue o relógio, não a fase que veio do servidor", () => {
    expect(phaseAt(lot, Date.parse("2026-10-23T11:59:59Z"))).toBe("scheduled");
    expect(phaseAt(lot, Date.parse("2026-10-23T12:00:00Z"))).toBe("live");
    expect(phaseAt(lot, Date.parse("2026-10-23T14:00:00Z"))).toBe("ended");
  });
});
